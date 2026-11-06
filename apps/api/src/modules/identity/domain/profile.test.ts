import { describe, expect, it } from "vitest";
import {
	normalizeUsername,
	usernameFromEmail,
	validateAvatarUrl,
	validateBio,
	validateDisplayName,
	validateUsername,
} from "./profile.ts";

describe("profile value objects", () => {
	it("normalizes usernames", () => {
		expect(normalizeUsername("  Demo_User  ")).toBe("demo_user");
	});

	it("derives a safe username from an email", () => {
		expect(usernameFromEmail("demo.user@example.com", "user-1")).toBe("demo_user");
		expect(usernameFromEmail("a@example.com", "12345678-aaaa")).toBe("user_12345678");
	});

	it("validates usernames", () => {
		expect(validateUsername("demo_user").ok).toBe(true);
		expect(validateUsername("ab").ok).toBe(false);
		expect(validateUsername("bad name").ok).toBe(false);
	});

	it("validates display names", () => {
		expect(validateDisplayName(" Demo ").ok).toBe(true);
		expect(validateDisplayName("   ").ok).toBe(false);
		expect(validateDisplayName("x".repeat(81)).ok).toBe(false);
	});

	it("validates bios", () => {
		const empty = validateBio("   ");
		expect(empty.ok && empty.value).toBeNull();
		expect(validateBio("x".repeat(501)).ok).toBe(false);
	});

	it("validates avatar urls", () => {
		expect(validateAvatarUrl("https://example.com/a.png").ok).toBe(true);
		expect(validateAvatarUrl("ftp://example.com/a.png").ok).toBe(false);
		expect(validateAvatarUrl("not-a-url").ok).toBe(false);
	});
});
