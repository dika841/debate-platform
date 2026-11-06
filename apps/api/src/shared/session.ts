import type { AppSession } from "@app/api-contract";

export const SESSION_STATE = {
	RESOLVED: "resolved",
	ANONYMOUS: "anonymous",
	UNAVAILABLE: "unavailable"
} as const;

export type SessionState = (typeof SESSION_STATE)[keyof typeof SESSION_STATE];

export type SessionResolution = {
	readonly session: AppSession | null;
	readonly sessionState: SessionState;
};

type BetterAuthSession = {
	session: {
		id: string;
		userId: string;
		expiresAt: Date;
	};
	user: {
		id: string;
		name: string;
		email: string;
		image?: string | null;
		role?: string | null;
	};
};

export const sessionFromBetterAuth = (session: BetterAuthSession): AppSession => ({
	id: session.session.id,
	userId: session.session.userId,
	expiresAt: session.session.expiresAt,
	user: {
		id: session.user.id,
		name: session.user.name,
		email: session.user.email,
		image: session.user.image ?? null,
		role: session.user.role ?? "USER"
	}
});

export const sessionResolutionOf = (session: BetterAuthSession | null): SessionResolution => {
	if (!session) {
		return { session: null, sessionState: SESSION_STATE.ANONYMOUS };
	}

	return { session: sessionFromBetterAuth(session), sessionState: SESSION_STATE.RESOLVED };
};

export const unavailableResolution = (): SessionResolution => ({
	session: null,
	sessionState: SESSION_STATE.UNAVAILABLE
});
