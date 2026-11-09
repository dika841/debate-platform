import { PERMISSION } from "@app/permissions";
import { describe, expect, it } from "vitest";
import { ForbiddenError } from "@/libs/auth/forbidden.ts";
import { checkRoutePermissions } from "@/libs/auth/route-guard.ts";

const guard = checkRoutePermissions({
	permissions: [PERMISSION.MODERATION_REVIEW],
});

describe("checkRoutePermissions", () => {
	it("lets a visitor with every required permission through", () => {
		expect(guard({ context: { permissions: [PERMISSION.MODERATION_REVIEW] } })).toBeUndefined();
	});

	it("throws a forbidden error instead of redirecting", () => {
		expect(() => guard({ context: { permissions: [PERMISSION.ROOM_READ] } })).toThrow(
			ForbiddenError,
		);
	});
});
