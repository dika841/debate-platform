import { describe, expect, it } from "vitest";
import { isUniqueViolation } from "./errors.ts";

describe("database error helpers", () => {
	it("detects a direct unique violation", () => {
		expect(isUniqueViolation({ code: "23505" })).toBe(true);
	});

	it("detects a wrapped unique violation", () => {
		expect(isUniqueViolation({ message: "query failed", cause: { code: "23505" } })).toBe(true);
		expect(
			isUniqueViolation({
				cause: { cause: { code: "23505" } },
			}),
		).toBe(true);
	});

	it("ignores other errors", () => {
		expect(isUniqueViolation({ code: "23503" })).toBe(false);
		expect(isUniqueViolation(new Error("boom"))).toBe(false);
		expect(isUniqueViolation(null)).toBe(false);
	});
});
