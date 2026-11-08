import { describe, expect, it } from "vitest";
import { updateProfileInputSchema, userProfileSchema } from "./users.ts";

describe("user profile contract", () => {
	it("accepts a complete profile", () => {
		const parsed = userProfileSchema.parse({
			id: "user-1",
			email: "demo@example.com",
			name: "Demo",
			image: null,
			role: "USER",
			twoFactorEnabled: false,
			profile: {
				username: "demo_user",
				displayName: "Demo User",
				avatarUrl: null,
				bio: null,
			},
		});

		expect(parsed.profile.username).toBe("demo_user");
	});

	it("normalizes usernames to lowercase", () => {
		const parsed = updateProfileInputSchema.parse({ username: "Demo_User" });
		expect(parsed.username).toBe("demo_user");
	});

	it("rejects invalid usernames", () => {
		expect(() => updateProfileInputSchema.parse({ username: "ab" })).toThrow();
		expect(() => updateProfileInputSchema.parse({ username: "bad name" })).toThrow();
	});
});
