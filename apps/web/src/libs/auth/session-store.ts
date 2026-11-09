import type { AppSession } from "@app/api-contract";
import { Store } from "@tanstack/store";
import { SESSION_REACH, type SessionResolution } from "./session-reach.ts";

const SESSION_UNRESOLVED: SessionResolution = {
	reach: SESSION_REACH.UNREACHABLE,
	session: null,
};

export const sessionStore = new Store<SessionResolution>(SESSION_UNRESOLVED);

export const sessionResolutionSet = (resolution: SessionResolution): void => {
	sessionStore.setState(() => resolution);
};

export const sessionSet = (session: AppSession | null): void => {
	sessionResolutionSet({ reach: SESSION_REACH.REACHED, session });
};

export const sessionClear = (): void => sessionSet(null);
