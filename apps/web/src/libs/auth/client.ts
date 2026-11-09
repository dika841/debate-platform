import { twoFactorClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";

const configuredOrigin = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || undefined;
const apiOrigin = import.meta.env.DEV
	? window.location.origin
	: (configuredOrigin ?? window.location.origin);

export const AUTH_BASE_URL = `${apiOrigin}/api/auth`;

export const authClient = createAuthClient({
	baseURL: apiOrigin,
	basePath: "/api/auth",
	plugins: [twoFactorClient()],
	fetchOptions: {
		credentials: "include",
	},
});

export const signIn = authClient.signIn;
export const signUp = authClient.signUp;
export const signOut = authClient.signOut;
export const getSession = authClient.getSession;
export const requestPasswordReset = authClient.requestPasswordReset;
export const resetPassword = authClient.resetPassword;
export const changePassword = authClient.changePassword;
export const revokeOtherSessions = authClient.revokeOtherSessions;
export const deleteUser = authClient.deleteUser;
export const twoFactor = authClient.twoFactor;
