import { createAuthClient } from "better-auth/react";
import { twoFactorClient } from "better-auth/client/plugins";

const apiOrigin = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || undefined;

export const authClient = createAuthClient({
	baseURL: apiOrigin ?? window.location.origin,
	basePath: "/api/auth",
	plugins: [twoFactorClient()],
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
