import type { AppSession } from "@app/api-contract";
import { afterEach, describe, expect, it } from "vitest";
import { SESSION_REACH } from "@/libs/auth/session-reach.ts";
import {
	sessionClear,
	sessionResolutionSet,
	sessionSet,
	sessionStore,
} from "@/libs/auth/session-store.ts";

const SESSION: AppSession = {
	id: "session-1",
	userId: "user-1",
	expiresAt: new Date("2030-01-01T00:00:00.000Z"),
	user: {
		id: "user-1",
		name: "Ada",
		email: "ada@test.app",
		image: null,
		role: "USER",
		twoFactorEnabled: false,
	},
};

describe("session store", () => {
	afterEach(sessionClear);

	it("records a reached session", () => {
		sessionSet(SESSION);

		expect(sessionStore.state).toEqual({
			reach: SESSION_REACH.REACHED,
			session: SESSION,
		});
	});

	it("clears the session while remembering the server was reached", () => {
		sessionSet(SESSION);

		sessionClear();

		expect(sessionStore.state).toEqual({
			reach: SESSION_REACH.REACHED,
			session: null,
		});
	});

	it("keeps an unreachable server distinct from being signed out", () => {
		sessionResolutionSet({ reach: SESSION_REACH.UNREACHABLE, session: null });

		expect(sessionStore.state.reach).toBe(SESSION_REACH.UNREACHABLE);
		expect(sessionStore.state.session).toBeNull();
	});
});
