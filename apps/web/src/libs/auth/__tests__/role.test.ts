import { ROLE } from "@app/permissions";
import { describe, expect, it } from "vitest";
import { roleOf } from "@/libs/auth/role.ts";

describe("roleOf", () => {
	it("keeps known roles", () => {
		expect(roleOf(ROLE.ADMIN)).toBe(ROLE.ADMIN);
		expect(roleOf(ROLE.MODERATOR)).toBe(ROLE.MODERATOR);
	});

	it("falls back to the least-privileged role", () => {
		expect(roleOf(undefined)).toBe(ROLE.USER);
		expect(roleOf("SUPERADMIN")).toBe(ROLE.USER);
	});
});
