import { describe, expect, it } from "vitest";
import { SESSION_STATE, sessionFromBetterAuth, sessionResolutionOf } from "./session.ts";

const betterAuthSession = {
	session: {
		id: "session-1",
		userId: "user-1",
		expiresAt: new Date("2030-01-01T00:00:00.000Z"),
	},
	user: {
		id: "user-1",
		name: "Demo",
		email: "demo@example.com",
		image: null,
		role: "USER",
		twoFactorEnabled: false,
	},
};

describe("session mapping", () => {
	it("maps a Better Auth session into the public contract shape", () => {
		const session = sessionFromBetterAuth(betterAuthSession);
		expect(session.user.email).toBe("demo@example.com");
		expect(session.user.role).toBe("USER");
		expect(session.expiresAt).toEqual(new Date("2030-01-01T00:00:00.000Z"));
	});

	it("marks missing sessions as anonymous", () => {
		const resolution = sessionResolutionOf(null);
		expect(resolution.session).toBeNull();
		expect(resolution.sessionState).toBe(SESSION_STATE.ANONYMOUS);
	});

	it("marks present sessions as resolved", () => {
		const resolution = sessionResolutionOf(betterAuthSession);
		expect(resolution.sessionState).toBe(SESSION_STATE.RESOLVED);
	});
});
