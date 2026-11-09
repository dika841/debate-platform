import type { QueryClient } from "@tanstack/react-query";
import { match } from "ts-pattern";

export type SignOutResult = { error?: unknown };

export type SignOutDeps = {
	signOut: () => Promise<SignOutResult>;
	queryClient: QueryClient;
	onSignedOut: () => void;
	onFailure: () => void;
};

const attempt = async (signOut: SignOutDeps["signOut"]): Promise<boolean> => {
	try {
		const { error } = await signOut();
		return error === null || error === undefined;
	} catch {
		return false;
	}
};

/**
 * Signs out without pretending it worked. Queries are only cleared after the
 * server confirms, so a failed request leaves the current session intact.
 */
export const signOutPerform = async (deps: SignOutDeps): Promise<void> =>
	match(await attempt(deps.signOut))
		.with(false, () => deps.onFailure())
		.otherwise(() => {
			deps.queryClient.clear();
			deps.onSignedOut();
		});
