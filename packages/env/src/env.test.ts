import { describe, expect, it } from "vitest";
import { z } from "zod";
import { EnvValidationError, envParse } from "./env.ts";
import { apiEnvSchema } from "./schema.ts";

const productionEnv = {
	NODE_ENV: "production",
	DATABASE_URL: "postgresql://app:app@localhost:5432/app",
	BETTER_AUTH_URL: "https://api.example.com",
	BETTER_AUTH_SECRET: "a".repeat(64),
	WEB_ORIGIN: "https://app.example.com",
};

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

describe("apiEnvSchema production guards", () => {
	it("rejects placeholder auth secrets in production", () => {
		expect(() =>
			envParse(apiEnvSchema, {
				...productionEnv,
				BETTER_AUTH_SECRET: "change-me-change-me-change-me-change-me",
			}),
		).toThrow(EnvValidationError);
	});

	it("accepts a strong production secret", () => {
		expect(envParse(apiEnvSchema, productionEnv).NODE_ENV).toBe("production");
	});

	it("requires https for Cloudflare deployments", () => {
		expect(() =>
			envParse(apiEnvSchema, {
				...productionEnv,
				CLOUDFLARE: "true",
				WEB_ORIGIN: "http://app.example.com",
			}),
		).toThrow(EnvValidationError);
	});
});
