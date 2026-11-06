import { healthCheckOutputSchema, getSessionOutputSchema } from "@app/api-contract";
import { describe, expect, it } from "vitest";

describe("api contract", () => {
	it("accepts a healthy payload", () => {
		const parsed = healthCheckOutputSchema.parse({
			status: "ok",
			service: "debate-platform-api",
			version: "0.1.0",
			time: new Date().toISOString(),
			database: "up"
		});

		expect(parsed.status).toBe("ok");
	});

	it("accepts an anonymous session payload", () => {
		const parsed = getSessionOutputSchema.parse({ session: null });
		expect(parsed.session).toBeNull();
	});
});
