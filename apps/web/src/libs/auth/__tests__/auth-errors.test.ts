import { ERROR } from "@app/messages";
import { describe, expect, it } from "vitest";
import { ForbiddenError, isForbidden } from "@/libs/auth/forbidden.ts";
import { isServerUnreachable, ServerUnreachableError } from "@/libs/auth/server-unreachable.ts";

describe("ForbiddenError", () => {
	it("uses the forbidden title and is recognised", () => {
		const error = new ForbiddenError();

		expect(error.message).toBe(ERROR.forbiddenTitle);
		expect(isForbidden(error)).toBe(true);
		expect(isForbidden(new Error("boom"))).toBe(false);
	});
});

describe("ServerUnreachableError", () => {
	it("uses the unreachable title and is recognised", () => {
		const error = new ServerUnreachableError();

		expect(error.message).toBe(ERROR.serverUnreachableTitle);
		expect(isServerUnreachable(error)).toBe(true);
		expect(isServerUnreachable(new Error("boom"))).toBe(false);
	});
});
