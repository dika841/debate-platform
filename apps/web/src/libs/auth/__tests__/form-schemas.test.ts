import { AUTH } from "@app/messages";
import { describe, expect, it } from "vitest";
import {
	deleteAccountSchema,
	profileFormSchema,
	twoFactorCodeSchema,
} from "@/libs/auth/account-schema.ts";
import { registerSchema } from "@/libs/auth/register-schema.ts";
import { changePasswordSchema, resetPasswordSchema } from "@/libs/auth/password-schema.ts";

const issueMessages = (result: { success: boolean; error?: { issues: { message: string }[] } }) =>
	result.success ? [] : (result.error?.issues.map((issue) => issue.message) ?? []);

describe("registerSchema", () => {
	it("accepts a valid registration", () => {
		expect(
			registerSchema.safeParse({
				name: "Ada",
				email: "ada@test.app",
				password: "Password123!",
				confirmPassword: "Password123!",
			}).success,
		).toBe(true);
	});

	it("reports mismatched passwords on the confirmation field", () => {
		const result = registerSchema.safeParse({
			name: "Ada",
			email: "ada@test.app",
			password: "Password123!",
			confirmPassword: "OtherPassword123!",
		});

		expect(result.success).toBe(false);
		expect(issueMessages(result)).toContain(AUTH.passwordsMismatch);
	});
});

describe("password schemas", () => {
	it("requires matching reset passwords", () => {
		const result = resetPasswordSchema.safeParse({
			password: "Password123!",
			confirmPassword: "OtherPassword123!",
		});

		expect(issueMessages(result)).toContain(AUTH.passwordsMismatch);
	});

	it("requires a current password when changing it", () => {
		const result = changePasswordSchema.safeParse({
			currentPassword: "",
			newPassword: "Password123!",
			confirmPassword: "Password123!",
		});

		expect(issueMessages(result)).toContain(AUTH.currentPasswordRequired);
	});
});

describe("account schemas", () => {
	it("requires the exact delete confirmation", () => {
		const result = deleteAccountSchema.safeParse({
			password: "Password123!",
			confirmation: "delete",
		});

		expect(issueMessages(result)).toContain(AUTH.deleteConfirmation);
	});

	it("rejects an invalid username", () => {
		const result = profileFormSchema.safeParse({
			displayName: "Ada",
			username: "Not Valid!",
			bio: "",
			avatarUrl: "",
		});

		expect(issueMessages(result)).toContain(AUTH.usernameInvalid);
	});

	it("requires a six-digit authenticator code", () => {
		expect(twoFactorCodeSchema.safeParse({ code: "12345" }).success).toBe(false);
		expect(twoFactorCodeSchema.safeParse({ code: "123456" }).success).toBe(true);
	});
});
