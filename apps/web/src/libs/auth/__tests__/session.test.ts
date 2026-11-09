import type { AppSession } from "@app/api-contract";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SESSION_REACH } from "@/libs/auth/session-reach.ts";
import { sessionRefresh, sessionResolve } from "@/libs/auth/session.ts";
import { sessionSet, sessionStore } from "@/libs/auth/session-store.ts";

const { getSession } = vi.hoisted(() => ({ getSession: vi.fn() }));

vi.mock("@/libs/orpc/index.ts", () => ({
	apiClient: {
		auth: {
			getSession,
		},
	},
}));

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

beforeEach(() => {
	vi.spyOn(console, "error").mockImplementation(() => undefined);
});

afterEach(() => {
	vi.restoreAllMocks();
	getSession.mockReset();
	sessionSet(null);
});

describe("sessionResolve", () => {
	it("reports a reached server with the signed-in session", async () => {
		getSession.mockResolvedValue({ session: SESSION });

		await expect(sessionResolve()).resolves.toStrictEqual({
			reach: SESSION_REACH.REACHED,
			session: SESSION,
		});
	});

	it("treats a 4xx as a reached server with nobody signed in", async () => {
		getSession.mockRejectedValue({ status: 401 });

		await expect(sessionResolve()).resolves.toStrictEqual({
			reach: SESSION_REACH.REACHED,
			session: null,
		});
	});

	it("treats a 5xx as unreachable so the visitor is not told they signed out", async () => {
		getSession.mockRejectedValue({ status: 500 });

		await expect(sessionResolve()).resolves.toStrictEqual({
			reach: SESSION_REACH.UNREACHABLE,
			session: null,
		});
	});

	it("treats a failed fetch as unreachable", async () => {
		getSession.mockRejectedValue(new TypeError("Failed to fetch"));

		await expect(sessionResolve()).resolves.toStrictEqual({
			reach: SESSION_REACH.UNREACHABLE,
			session: null,
		});
	});

	it("logs the cause instead of swallowing it", async () => {
		const failure = new TypeError("Failed to fetch");
		getSession.mockRejectedValue(failure);

		await sessionResolve();

		expect(console.error).toHaveBeenCalledWith("session resolution failed", failure);
	});
});

describe("sessionRefresh", () => {
	it("publishes the resolved session to the store", async () => {
		getSession.mockResolvedValue({ session: SESSION });

		await sessionRefresh();

		expect(sessionStore.state).toStrictEqual({
			reach: SESSION_REACH.REACHED,
			session: SESSION,
		});
	});

	it("publishes unreachable without marking the visitor as signed out", async () => {
		getSession.mockRejectedValue({ status: 503 });

		await sessionRefresh();

		expect(sessionStore.state).toStrictEqual({
			reach: SESSION_REACH.UNREACHABLE,
			session: null,
		});
	});
});
