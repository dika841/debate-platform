import { describe, expect, it } from "vitest";
import { err, isErr, isOk, ok, unwrapOr } from "./result.ts";

describe("Result", () => {
	it("wraps success values", () => {
		const result = ok(42);
		expect(isOk(result)).toBe(true);
		expect(result.ok && result.value).toBe(42);
	});

	it("wraps failure values", () => {
		const result = err("boom");
		expect(isErr(result)).toBe(true);
		expect(!result.ok && result.error).toBe("boom");
	});

	it("falls back with unwrapOr", () => {
		expect(unwrapOr(ok("value"), "fallback")).toBe("value");
		expect(unwrapOr(err("boom"), "fallback")).toBe("fallback");
	});
});
