import { AUTH } from "@app/messages";
import { useForm } from "@tanstack/react-form";
import { useState, type SubmitEvent } from "react";
import { resetPassword } from "@/libs/auth/client.ts";
import { resetPasswordSchema, type ResetPasswordInput } from "@/libs/auth/password-schema.ts";

const DEFAULT_VALUES: ResetPasswordInput = {
	password: "",
	confirmPassword: "",
};

export const useResetPassword = (token: string | undefined) => {
	const [serverError, setServerError] = useState<string | null>(null);
	const [done, setDone] = useState(false);

	const form = useForm({
		defaultValues: DEFAULT_VALUES,
		validators: {
			onChange: resetPasswordSchema,
			onSubmit: resetPasswordSchema,
		},
		onSubmit: async ({ value }) => {
			if (!token) {
				setServerError(AUTH.resetTokenInvalid);
				return;
			}

			setServerError(null);
			const result = await resetPassword({ newPassword: value.password, token });

			if (result.error) {
				setServerError(
					result.error.code === "INVALID_TOKEN"
						? AUTH.resetTokenInvalid
						: (result.error.message ?? AUTH.resetFailed),
				);
				return;
			}

			setDone(true);
		},
	});

	const onSubmit = (event: SubmitEvent<HTMLFormElement>): void => {
		event.preventDefault();
		void form.handleSubmit();
	};

	return { form, serverError, done, onSubmit };
};
