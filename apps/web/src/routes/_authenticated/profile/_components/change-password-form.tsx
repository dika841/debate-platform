import { Button } from "@app/components/ui/button";
import { FieldError, hasFieldError } from "@app/components/ui/field-error";
import { Label } from "@app/components/ui/label";
import { AUTH } from "@app/messages";
import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { passwordChangeErrorMessage } from "@/libs/auth/auth-error.ts";
import { changePassword } from "@/libs/auth/client.ts";
import { changePasswordSchema, type ChangePasswordInput } from "@/libs/auth/password-schema.ts";
import { PasswordInput } from "@/routes/_components/password-input.tsx";

const DEFAULT_VALUES: ChangePasswordInput = {
	currentPassword: "",
	newPassword: "",
	confirmPassword: "",
};

type Feedback = {
	readonly message: string;
	readonly error: boolean;
};

export const ChangePasswordForm = () => {
	const [feedback, setFeedback] = useState<Feedback | null>(null);

	const form = useForm({
		defaultValues: DEFAULT_VALUES,
		validators: {
			onChange: changePasswordSchema,
			onSubmit: changePasswordSchema,
		},
		onSubmit: async ({ value }) => {
			setFeedback(null);

			const result = await changePassword({
				currentPassword: value.currentPassword,
				newPassword: value.newPassword,
				revokeOtherSessions: true,
			});

			if (result.error) {
				setFeedback({ message: passwordChangeErrorMessage(result.error), error: true });
				return;
			}

			form.reset();
			setFeedback({ message: AUTH.passwordUpdated, error: false });
		},
	});

	return (
		<form
			className="grid gap-4 sm:grid-cols-3"
			onSubmit={(event) => {
				event.preventDefault();
				void form.handleSubmit();
			}}
		>
			<form.Field name="currentPassword">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor="currentPassword">{AUTH.currentPassword}</Label>
						<PasswordInput
							id="currentPassword"
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

			<form.Field name="newPassword">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor="newPassword">{AUTH.newPassword}</Label>
						<PasswordInput
							id="newPassword"
							name={field.name}
							autoComplete="new-password"
							aria-invalid={hasFieldError(field.state.meta.errorMap)}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(event) => field.handleChange(event.target.value)}
						/>
						<FieldError errorMap={field.state.meta.errorMap} />
					</div>
				)}
			</form.Field>

			<form.Field name="confirmPassword">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor="confirmNewPassword">{AUTH.confirmPassword}</Label>
						<PasswordInput
							id="confirmNewPassword"
							name={field.name}
							autoComplete="new-password"
							aria-invalid={hasFieldError(field.state.meta.errorMap)}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(event) => field.handleChange(event.target.value)}
						/>
						<FieldError errorMap={field.state.meta.errorMap} />
					</div>
				)}
			</form.Field>

			{feedback ? (
				<p
					className={
						feedback.error
							? "text-sm text-destructive sm:col-span-3"
							: "text-sm text-muted-foreground sm:col-span-3"
					}
				>
					{feedback.message}
				</p>
			) : null}

			<form.Subscribe selector={(state) => state.isSubmitting}>
				{(isSubmitting) => (
					<Button type="submit" disabled={isSubmitting} className="sm:col-span-3 sm:w-fit">
						{isSubmitting ? <Loader2 className="animate-spin" /> : null}
						{isSubmitting ? AUTH.updatingPassword : AUTH.updatePassword}
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
};
