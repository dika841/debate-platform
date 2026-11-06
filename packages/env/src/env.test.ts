import { describe, expect, it } from "vitest";
import { z } from "zod";
import { EnvValidationError, envParse } from "./env.ts";

describe("envParse", () => {
	it("parses valid values", () => {
		const result = envParse(z.object({ PORT: z.coerce.number().default(3001) }), { PORT: "4000" });
		expect(result.PORT).toBe(4000);
	});

	it("throws a readable error for invalid values", () => {
		expect(() =>
			envParse(z.object({ DATABASE_URL: z.string().min(1) }), { DATABASE_URL: "" }),
		).toThrow(EnvValidationError);
	});
});
