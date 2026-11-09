import type { QueryClient } from "@tanstack/react-query";
import { describe, expect, it, vi } from "vitest";
import { signOutPerform } from "@/libs/auth/sign-out.ts";

const createDeps = (signOut: () => Promise<{ error?: unknown }>) => {
	const queryClient = { clear: vi.fn() } as unknown as QueryClient;
	const onSignedOut = vi.fn();
	const onFailure = vi.fn();

	return {
		deps: { signOut, queryClient, onSignedOut, onFailure },
		queryClient,
		onSignedOut,
		onFailure,
	};
};

describe("signOutPerform", () => {
	it("clears queries and reports a confirmed sign-out", async () => {
		const { deps, queryClient, onSignedOut, onFailure } = createDeps(async () => ({}));

		await signOutPerform(deps);

		expect(queryClient.clear).toHaveBeenCalledOnce();
		expect(onSignedOut).toHaveBeenCalledOnce();
		expect(onFailure).not.toHaveBeenCalled();
	});

	it("keeps the session when the server returns an error", async () => {
		const { deps, queryClient, onSignedOut, onFailure } = createDeps(async () => ({
			error: new Error("network"),
		}));

		await signOutPerform(deps);

		expect(queryClient.clear).not.toHaveBeenCalled();
		expect(onSignedOut).not.toHaveBeenCalled();
		expect(onFailure).toHaveBeenCalledOnce();
	});

	it("treats a thrown request as a failure", async () => {
		const { deps, onFailure } = createDeps(async () => {
			throw new Error("offline");
		});

		await signOutPerform(deps);

		expect(onFailure).toHaveBeenCalledOnce();
	});
});
