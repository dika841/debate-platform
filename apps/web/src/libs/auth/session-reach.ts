import type { AppSession } from "@app/api-contract";

export const SESSION_REACH = {
	REACHED: "reached",
	UNREACHABLE: "unreachable",
} as const;

export type SessionReach = (typeof SESSION_REACH)[keyof typeof SESSION_REACH];

export type SessionResolution =
	| { reach: typeof SESSION_REACH.REACHED; session: AppSession | null }
	| { reach: typeof SESSION_REACH.UNREACHABLE; session: null };
