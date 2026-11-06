import { createAuthClient } from "better-auth/react";

const apiOrigin = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || undefined;

export const authClient = createAuthClient({
	baseURL: apiOrigin ?? window.location.origin,
	basePath: "/api/auth",
});

export const signIn = authClient.signIn;
export const signUp = authClient.signUp;
export const signOut = authClient.signOut;
