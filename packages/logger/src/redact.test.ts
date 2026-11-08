import { describe, expect, it } from "vitest";
import { redactError } from "./redact.ts";

describe("redactError", () => {
	it("redacts database params, details and emails", () => {
		const error = new Error("insert failed for demo@example.com with password=secret");
		const cause = {
			code: "23505",
			detail: "Key (username)=(demo) already exists.",
			params: ["demo@example.com", "super-secret"],
			constraint: "user_profiles_username_unique",
		};
		Object.assign(error, { cause });

		const redacted = JSON.stringify(redactError(error));

		expect(redacted).not.toContain("demo@example.com");
		expect(redacted).not.toContain("super-secret");
		expect(redacted).not.toContain("already exists");
		expect(redacted).toContain("23505");
		expect(redacted).toContain("user_profiles_username_unique");
	});

	it("redacts sensitive object keys", () => {
		const redacted = JSON.stringify(
			redactError({
				email: "demo@example.com",
				password: "secret",
				token: "abc",
				safe: "value",
			}),
		);

		expect(redacted).not.toContain("demo@example.com");
		expect(redacted).not.toContain("secret");
		expect(redacted).toContain("value");
		expect(redacted).toContain("[redacted]");
	});
});
