import { AUTH } from "@app/messages";
import { useForm } from "@tanstack/react-form";
import { useNavigate } from "@tanstack/react-router";
import { useState, type SubmitEvent } from "react";
import { signInErrorMessage } from "@/libs/auth/auth-error.ts";
import { signIn, twoFactor } from "@/libs/auth/client.ts";
import { loginSchema, type LoginInput } from "@/libs/auth/login-schema.ts";
import { returnToResolve } from "@/libs/auth/return-to.ts";
import { SESSION_REACH } from "@/libs/auth/session-reach.ts";
import { sessionRefresh } from "@/libs/auth/session.ts";

const DEFAULT_VALUES: LoginInput = {
	email: "",
	password: "",
};

type TwoFactorSignInData = {
	twoFactorRedirect?: boolean;
};

export const useLogin = (redirect: string | undefined) => {
	const navigate = useNavigate();
	const [serverError, setServerError] = useState<string | null>(null);
	const [twoFactorRequired, setTwoFactorRequired] = useState(false);

	const finishSignIn = async (): Promise<void> => {
		const resolution = await sessionRefresh();

		if (resolution.reach === SESSION_REACH.UNREACHABLE) {
			setServerError(AUTH.sessionUnreachable);
			return;
		}

		if (!resolution.session) {
			setServerError(AUTH.sessionUnverified);
			return;
		}

		await navigate({ to: returnToResolve(redirect) });
	};

	const form = useForm({
		defaultValues: DEFAULT_VALUES,
		validators: {
			onChange: loginSchema,
			onSubmit: loginSchema,
		},
		onSubmit: async ({ value }) => {
			setServerError(null);

			const result = await signIn.email(value);

			if (result.error) {
				setServerError(signInErrorMessage(result.error));
				return;
			}

			const data = result.data as TwoFactorSignInData | null;

			if (data?.twoFactorRedirect) {
				setTwoFactorRequired(true);
				return;
			}

			await finishSignIn();
		},
	});

	const verifyCode = async (code: string): Promise<void> => {
		setServerError(null);

		const result = await twoFactor.verifyTotp({ code });

		if (result.error) {
			setServerError(AUTH.invalidCode);
			return;
		}

		await finishSignIn();
	};

	const onSubmit = (event: SubmitEvent<HTMLFormElement>): void => {
		event.preventDefault();
		void form.handleSubmit();
	};

	return {
		form,
		serverError,
		twoFactorRequired,
		onSubmit,
		verifyCode,
	};
};
