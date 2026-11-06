import type { contract } from "@app/api-contract";
import { createORPCClient } from "@orpc/client";
import { RPCLink } from "@orpc/client/fetch";
import type { ContractRouterClient } from "@orpc/contract";
import { createTanstackQueryUtils } from "@orpc/tanstack-query";

export type ApiClient = ContractRouterClient<typeof contract>;

export type ApiClientOptions = {
	/** Absolute RPC endpoint URL, e.g. `https://api.example.com/rpc`. */
	url: string;
};

export const createApiClient = (options: ApiClientOptions): ApiClient => {
	const link = new RPCLink({
		url: options.url,
		fetch: (request, init) =>
			globalThis.fetch(request, {
				...init,
				credentials: "include",
			}),
	});

	return createORPCClient(link);
};

export const createApiUtils = (client: ApiClient) => createTanstackQueryUtils(client);

export type ApiUtils = ReturnType<typeof createApiUtils>;

export { createORPCClient, RPCLink };
