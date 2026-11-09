import { describe, expect, it } from "vitest";
import { RETURN_TO_DEFAULT, returnToResolve } from "@/libs/auth/return-to.ts";

describe("returnToResolve", () => {
	it("goes to the default page when nothing was requested", () => {
		expect(returnToResolve(undefined)).toBe(RETURN_TO_DEFAULT);
	});

	it("keeps an internal path with its search string", () => {
		expect(returnToResolve("/rooms/abc?tab=1")).toBe("/rooms/abc?tab=1");
	});

	it("refuses absolute, protocol-relative and backslash URLs", () => {
		expect(returnToResolve("https://evil.test/")).toBe(RETURN_TO_DEFAULT);
		expect(returnToResolve("//evil.test/")).toBe(RETURN_TO_DEFAULT);
		expect(returnToResolve("/\\evil.test")).toBe(RETURN_TO_DEFAULT);
	});
});
