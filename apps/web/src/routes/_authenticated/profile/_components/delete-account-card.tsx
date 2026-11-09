import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@app/components/ui/card";
import { FieldError, hasFieldError } from "@app/components/ui/field-error";
import { Input } from "@app/components/ui/input";
import { Label } from "@app/components/ui/label";
import { AUTH } from "@app/messages";
import { useQueryClient } from "@tanstack/react-query";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { deleteAccountSchema, type DeleteAccountInput } from "@/libs/auth/account-schema.ts";
import { deleteUser, signOut } from "@/libs/auth/client.ts";
import { sessionClear } from "@/libs/auth/session-store.ts";
import { apiUrl } from "@/libs/orpc/index.ts";
import { PasswordInput } from "@/routes/_components/password-input.tsx";

const DEFAULT_VALUES: DeleteAccountInput = {
	password: "",
	confirmation: "",
};

export const DeleteAccountCard = () => {
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const [serverError, setServerError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: DEFAULT_VALUES,
		validators: {
			onChange: deleteAccountSchema,
			onSubmit: deleteAccountSchema,
		},
		onSubmit: async ({ value }) => {
			setServerError(null);
			const result = await deleteUser({ password: value.password });

			if (result.error) {
				setServerError(result.error.message ?? AUTH.deleteAccountFailed);
				return;
			}

			await signOut().catch(() => undefined);
			queryClient.clear();
			sessionClear();
			await navigate({ to: "/" });
		},
	});

	return (
		<Card className="md:col-span-2">
			<CardHeader>
				<CardTitle>{AUTH.deleteAccount}</CardTitle>
				<CardDescription>{AUTH.deleteAccountHint}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="flex flex-wrap gap-2">
					<Button variant="outline" asChild>
						<a href={apiUrl("/api/me/export")} download>
							{AUTH.downloadData}
						</a>
					</Button>
				</div>

				<form
					className="space-y-4"
					onSubmit={(event) => {
						event.preventDefault();
						void form.handleSubmit();
					}}
				>
					<div className="grid gap-4 sm:grid-cols-2">
						<form.Field name="password">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor="deletePassword">{AUTH.currentPassword}</Label>
									<PasswordInput
										id="deletePassword"
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
						</form.Field>

						<form.Field name="confirmation">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor="deleteConfirmation">{AUTH.deleteConfirmation}</Label>
									<Input
										id="deleteConfirmation"
										name={field.name}
										placeholder={AUTH.deleteConfirmationValue}
										aria-invalid={hasFieldError(field.state.meta.errorMap)}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
									/>
									<FieldError errorMap={field.state.meta.errorMap} />
								</div>
							)}
						</form.Field>
					</div>

					<FieldError errors={serverError ? [{ message: serverError }] : []} />

					<form.Subscribe selector={(state) => state.isSubmitting}>
						{(isSubmitting) => (
							<Button type="submit" variant="destructive" disabled={isSubmitting}>
								{isSubmitting ? <Loader2 className="animate-spin" /> : null}
								{isSubmitting ? AUTH.deletingAccount : AUTH.deleteAccount}
							</Button>
						)}
					</form.Subscribe>
				</form>
			</CardContent>
		</Card>
	);
};
