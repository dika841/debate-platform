import { describe, expect, it } from "vitest";
import { safeInternalPath } from "./navigation.ts";

describe("safeInternalPath", () => {
	it("keeps internal paths", () => {
		expect(safeInternalPath("/profile")).toBe("/profile");
		expect(safeInternalPath("/rooms/abc?tab=1")).toBe("/rooms/abc?tab=1");
	});

	it("rejects external and protocol-relative URLs", () => {
		expect(safeInternalPath("https://evil.example")).toBe("/");
		expect(safeInternalPath("//evil.example")).toBe("/");
		expect(safeInternalPath("/\\evil.example")).toBe("/");
		expect(safeInternalPath("javascript:alert(1)")).toBe("/");
	});

	it("uses the fallback for empty values", () => {
		expect(safeInternalPath(undefined)).toBe("/");
		expect(safeInternalPath(undefined, "/rooms")).toBe("/rooms");
	});
});
