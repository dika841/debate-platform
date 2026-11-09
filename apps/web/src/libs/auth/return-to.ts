import { safeInternalPath } from "@/libs/navigation.ts";

export const RETURN_TO_DEFAULT = "/";

/** Resolves a post-login redirect, refusing external or protocol-relative URLs. */
export const returnToResolve = (requested: string | undefined): string =>
	safeInternalPath(requested, RETURN_TO_DEFAULT);
