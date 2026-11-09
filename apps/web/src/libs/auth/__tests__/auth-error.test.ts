import { AUTH } from "@app/messages";
import { describe, expect, it } from "vitest";
import { passwordChangeErrorMessage, signInErrorMessage } from "@/libs/auth/auth-error.ts";

const LIBRARY_MESSAGE = "Invalid email or password";

describe("signInErrorMessage", () => {
	it("maps wrong credentials to app-owned copy", () => {
		expect(signInErrorMessage({ code: "INVALID_EMAIL_OR_PASSWORD" })).toBe(AUTH.invalidCredentials);
	});

	it("does not blame credentials for other failures", () => {
		expect(signInErrorMessage({ code: "TOO_MANY_REQUESTS" })).toBe(AUTH.signInFailed);
		expect(signInErrorMessage({})).toBe(AUTH.signInFailed);
	});

	it("never surfaces the library's own wording", () => {
		expect(signInErrorMessage({ code: "INVALID_EMAIL_OR_PASSWORD" })).not.toBe(LIBRARY_MESSAGE);
	});
});

describe("passwordChangeErrorMessage", () => {
	it("names a wrong current password", () => {
		expect(passwordChangeErrorMessage({ code: "INVALID_PASSWORD" })).toBe(
			AUTH.currentPasswordIncorrect,
		);
	});

	it("falls back to a generic failure otherwise", () => {
		expect(passwordChangeErrorMessage({})).toBe(AUTH.changePasswordFailed);
	});
});
