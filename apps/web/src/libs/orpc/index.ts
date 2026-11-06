import { createApiClient, createApiUtils } from "@app/api-client";

const apiOrigin = import.meta.env.VITE_API_URL?.replace(/\/$/, "");

export const apiClient = createApiClient({
	url: apiOrigin ? `${apiOrigin}/rpc` : "/rpc"
});

export const orpc = createApiUtils(apiClient);
