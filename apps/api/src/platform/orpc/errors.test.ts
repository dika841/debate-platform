import { ORPCError } from "@orpc/server";
import { describe, expect, it } from "vitest";
import type { OrpcContext } from "./context.ts";
import { requireTwoFactor } from "./errors.ts";

const contextWith = (twoFactorEnabled: boolean): OrpcContext =>
	({
		session: {
			id: "session-1",
			userId: "user-1",
			expiresAt: new Date(),
			user: {
				id: "user-1",
				name: "Admin",
				email: "admin@example.com",
				image: null,
				role: "ADMIN",
				twoFactorEnabled,
			},
		},
	}) as unknown as OrpcContext;

describe("two-factor guard", () => {
	it("allows sessions with two-factor enabled", () => {
		expect(requireTwoFactor(contextWith(true))).toBe("user-1");
	});

	it("rejects sessions without two-factor", () => {
		expect(() => requireTwoFactor(contextWith(false))).toThrow(ORPCError);
	});
});
