import type { UserProfile } from "@app/api-contract";
import { Badge } from "@app/components/ui/badge";
import { Button } from "@app/components/ui/button";
import { FieldError, hasFieldError } from "@app/components/ui/field-error";
import { Input } from "@app/components/ui/input";
import { Label } from "@app/components/ui/label";
import { AUTH } from "@app/messages";
import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import {
	twoFactorCodeSchema,
	twoFactorPasswordSchema,
	type TwoFactorCodeInput,
	type TwoFactorPasswordInput,
} from "@/libs/auth/account-schema.ts";
import { twoFactor } from "@/libs/auth/client.ts";
import { useInvalidateAccount } from "@/libs/api/queries.ts";
import { PasswordInput } from "@/routes/_components/password-input.tsx";

type TwoFactorSetup = {
	readonly uri: string;
	readonly backupCodes: readonly string[];
};

const PASSWORD_VALUES: TwoFactorPasswordInput = { currentPassword: "" };
const CODE_VALUES: TwoFactorCodeInput = { code: "" };

export const TwoFactorSection = ({ profile }: { profile: UserProfile }) => {
	const enabled = profile.twoFactorEnabled;
	const invalidateAccount = useInvalidateAccount();
	const [setup, setSetup] = useState<TwoFactorSetup | null>(null);
	const [feedback, setFeedback] = useState<string | null>(null);

	const passwordForm = useForm({
		defaultValues: PASSWORD_VALUES,
		validators: {
			onChange: twoFactorPasswordSchema,
			onSubmit: twoFactorPasswordSchema,
		},
		onSubmit: async ({ value }) => {
			setFeedback(null);

			if (enabled) {
				const result = await twoFactor.disable({ password: value.currentPassword });

				if (result.error) {
					setFeedback(result.error.message ?? AUTH.twoFactorFailed);
					return;
				}

				passwordForm.reset();
				setFeedback(AUTH.twoFactorDisabled);
				await invalidateAccount();
				return;
			}

			const result = await twoFactor.enable({ password: value.currentPassword });

			if (result.error) {
				setFeedback(result.error.message ?? AUTH.twoFactorFailed);
				return;
			}

			if (result.data?.method !== "totp") {
				setFeedback(AUTH.twoFactorFailed);
				return;
			}

			passwordForm.reset();
			setSetup({
				uri: result.data.totpURI,
				backupCodes: result.data.backupCodes,
			});
		},
	});

	const codeForm = useForm({
		defaultValues: CODE_VALUES,
		validators: {
			onChange: twoFactorCodeSchema,
			onSubmit: twoFactorCodeSchema,
		},
		onSubmit: async ({ value }) => {
			setFeedback(null);
			const result = await twoFactor.verifyTotp({ code: value.code });

			if (result.error) {
				setFeedback(result.error.message ?? AUTH.invalidCode);
				return;
			}

			codeForm.reset();
			setSetup(null);
			setFeedback(AUTH.twoFactorEnabled);
			await invalidateAccount();
		},
	});

	return (
		<div className="space-y-3 border-t border-border/60 pt-4">
			<div className="flex flex-wrap items-center justify-between gap-2">
				<h3 className="text-sm font-semibold">{AUTH.twoFactor}</h3>
				<Badge variant={enabled ? "secondary" : "outline"}>
					{enabled ? AUTH.twoFactorEnabled : AUTH.twoFactorDisabled}
				</Badge>
			</div>

			{feedback ? <p className="text-sm text-muted-foreground">{feedback}</p> : null}

			{!enabled && (profile.role === "MODERATOR" || profile.role === "ADMIN") ? (
				<p className="text-sm text-destructive">{AUTH.mfaRequiredForRole}</p>
			) : null}

			{setup ? (
				<div className="space-y-3 rounded-md border border-border/70 p-3 text-sm">
					<p className="text-muted-foreground">{AUTH.twoFactorUri}</p>
					<code className="block break-all rounded bg-muted p-2 text-xs">{setup.uri}</code>
					<div>
						<p className="text-muted-foreground">{AUTH.backupCodes}</p>
						<pre className="mt-1 whitespace-pre-wrap text-xs">{setup.backupCodes.join("\n")}</pre>
					</div>

					<form
						className="space-y-2"
						onSubmit={(event) => {
							event.preventDefault();
							void codeForm.handleSubmit();
						}}
					>
						<codeForm.Field name="code">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor="twoFactorSetupCode">{AUTH.twoFactorCode}</Label>
									<Input
										id="twoFactorSetupCode"
										name={field.name}
										inputMode="numeric"
										autoComplete="one-time-code"
										aria-invalid={hasFieldError(field.state.meta.errorMap)}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
									/>
									<FieldError errorMap={field.state.meta.errorMap} />
								</div>
							)}
						</codeForm.Field>

						<codeForm.Subscribe selector={(state) => state.isSubmitting}>
							{(isSubmitting) => (
								<Button type="submit" size="sm" disabled={isSubmitting}>
									{isSubmitting ? <Loader2 className="animate-spin" /> : null}
									{isSubmitting ? AUTH.verifyingCode : AUTH.verifyCode}
								</Button>
							)}
						</codeForm.Subscribe>
					</form>
				</div>
			) : (
				<form
					className="space-y-2"
					onSubmit={(event) => {
						event.preventDefault();
						void passwordForm.handleSubmit();
					}}
				>
					<passwordForm.Field name="currentPassword">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor="twoFactorPassword">{AUTH.currentPassword}</Label>
								<PasswordInput
									id="twoFactorPassword"
									name={field.name}
									autoComplete="current-password"
									aria-invalid={hasFieldError(field.state.meta.errorMap)}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
								<FieldError errorMap={field.state.meta.errorMap} />
							</div>
						)}
					</passwordForm.Field>

					<passwordForm.Subscribe selector={(state) => state.isSubmitting}>
						{(isSubmitting) => (
							<Button type="submit" variant="outline" size="sm" disabled={isSubmitting}>
								{isSubmitting ? <Loader2 className="animate-spin" /> : null}
								{isSubmitting
									? AUTH.updatingPassword
									: enabled
										? AUTH.disableTwoFactor
										: AUTH.enableTwoFactor}
							</Button>
						)}
					</passwordForm.Subscribe>
				</form>
			)}
		</div>
	);
};
