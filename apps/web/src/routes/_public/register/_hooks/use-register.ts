import { AUTH } from "@app/messages";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useState, type SubmitEvent } from "react";
import { signUp } from "@/libs/auth/client.ts";
import { registerSchema, type RegisterInput } from "@/libs/auth/register-schema.ts";
import { SESSION_REACH } from "@/libs/auth/session-reach.ts";
import { sessionRefresh } from "@/libs/auth/session.ts";

const DEFAULT_VALUES: RegisterInput = {
	name: "",
	email: "",
	password: "",
	confirmPassword: "",
};

export const useRegister = () => {
	const navigate = useNavigate();
	const [serverError, setServerError] = useState<string | null>(null);
	const [info, setInfo] = useState<string | null>(null);

	const form = useForm({
		defaultValues: DEFAULT_VALUES,
		validators: {
			onChange: registerSchema,
			onSubmit: registerSchema,
		},
		onSubmit: async ({ value }) => {
			setServerError(null);
			setInfo(null);

			const result = await signUp.email({
				name: value.name,
				email: value.email,
				password: value.password,
			});

			if (result.error) {
				setServerError(AUTH.signUpFailed);
				return;
			}

			const resolution = await sessionRefresh();

			if (resolution.reach === SESSION_REACH.UNREACHABLE) {
				setServerError(AUTH.sessionUnreachable);
				return;
			}

			if (!resolution.session) {
				setInfo(AUTH.verifyEmailSent);
				return;
			}

			await navigate({ to: "/profile" });
		},
	});

	const onSubmit = (event: SubmitEvent<HTMLFormElement>): void => {
		event.preventDefault();
		void form.handleSubmit();
	};

	return { form, serverError, info, onSubmit };
};
