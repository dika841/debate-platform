import { match, P } from "ts-pattern";
import { apiClient } from "@/libs/orpc/index.ts";
import { SESSION_REACH, type SessionResolution } from "./session-reach.ts";
import { sessionResolutionSet } from "./session-store.ts";

const SERVER_ERROR_STATUS = 500;

const SIGNED_OUT: SessionResolution = {
	reach: SESSION_REACH.REACHED,
	session: null,
};

const UNREACHABLE: SessionResolution = {
	reach: SESSION_REACH.UNREACHABLE,
	session: null,
};

const statusOf = (error: unknown): number | undefined => {
	if (typeof error !== "object" || error === null || !("status" in error)) {
		return undefined;
	}

	const status = (error as { status?: unknown }).status;
	return typeof status === "number" ? status : undefined;
};

/**
 * A 4xx response means the server was reached and the visitor is signed out.
 * Network failures and 5xx responses stay "unreachable" so the UI never tells
 * a signed-in user that they were logged out.
 */
const classify = (error: unknown): SessionResolution =>
	match(statusOf(error))
		.with(P.number.lt(SERVER_ERROR_STATUS), () => SIGNED_OUT)
		.otherwise(() => UNREACHABLE);

export const sessionResolve = async (): Promise<SessionResolution> => {
	try {
		const { session } = await apiClient.auth.getSession();

		return {
			reach: SESSION_REACH.REACHED,
			session,
		};
	} catch (error) {
		console.error("session resolution failed", error);
		return classify(error);
	}
};

export const sessionRefresh = async (): Promise<SessionResolution> => {
	const resolution = await sessionResolve();
	sessionResolutionSet(resolution);
	return resolution;
};
