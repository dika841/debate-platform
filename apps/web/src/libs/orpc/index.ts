import { createApiClient, createApiUtils } from "@app/api-client";

const apiOrigin = import.meta.env.VITE_API_URL?.replace(/\/$/, "") || undefined;
const baseOrigin = apiOrigin ?? window.location.origin;

export const apiClient = createApiClient({
	url: `${baseOrigin}/rpc`,
});

export const apiUrl = (path: string): string => `${baseOrigin}${path}`;

export const orpc = createApiUtils(apiClient);
