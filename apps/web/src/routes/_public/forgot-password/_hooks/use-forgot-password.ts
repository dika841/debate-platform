import { useForm } from "@tanstack/react-form";
import { useState, type SubmitEvent } from "react";
import { requestPasswordReset } from "@/libs/auth/client.ts";
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/libs/auth/password-schema.ts";

const DEFAULT_VALUES: ForgotPasswordInput = {
	email: "",
};

export const useForgotPassword = () => {
	const [sent, setSent] = useState(false);

	const form = useForm({
		defaultValues: DEFAULT_VALUES,
		validators: {
			onChange: forgotPasswordSchema,
			onSubmit: forgotPasswordSchema,
		},
		onSubmit: async ({ value }) => {
			try {
				await requestPasswordReset({
					email: value.email,
					redirectTo: `${window.location.origin}/reset-password`,
				});
			} finally {
				// Always show the same result to avoid account enumeration.
				setSent(true);
			}
		},
	});

	const onSubmit = (event: SubmitEvent<HTMLFormElement>): void => {
		event.preventDefault();
		void form.handleSubmit();
	};

	return { form, sent, onSubmit };
};
