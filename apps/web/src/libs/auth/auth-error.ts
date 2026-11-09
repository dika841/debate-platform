import { AUTH } from "@app/messages";
import { match } from "ts-pattern";

const AUTH_ERROR_CODE = {
	INVALID_EMAIL_OR_PASSWORD: "INVALID_EMAIL_OR_PASSWORD",
	INVALID_PASSWORD: "INVALID_PASSWORD",
} as const;

export type AuthError = {
	code?: string | undefined;
};

/** Maps Better Auth sign-in failures to copy owned by the app. */
export const signInErrorMessage = (error: AuthError): string =>
	match(error.code)
		.with(AUTH_ERROR_CODE.INVALID_EMAIL_OR_PASSWORD, () => AUTH.invalidCredentials)
		.otherwise(() => AUTH.signInFailed);

/** Maps password-change failures, especially a wrong current password. */
export const passwordChangeErrorMessage = (error: AuthError): string =>
	match(error.code)
		.with(AUTH_ERROR_CODE.INVALID_PASSWORD, () => AUTH.currentPasswordIncorrect)
		.otherwise(() => AUTH.changePasswordFailed);
