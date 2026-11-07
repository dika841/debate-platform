import { DomainError, REPORT_STATUS } from "@app/shared";
import { describe, expect, it } from "vitest";
import {
	assertCanModerate,
	assertCanTakeModerationAction,
	canModerate,
	canTakeModerationAction,
} from "./permissions.ts";
import { assertReportPending, resolutionToStatus, validateReportDetails } from "./report.ts";

describe("moderation domain", () => {
	it("validates report details", () => {
		expect(validateReportDetails(`  ${"x".repeat(20)}  `)).toHaveLength(20);
		expect(() => validateReportDetails("short")).toThrowError(DomainError);
	});

	it("only resolves pending reports", () => {
		expect(() => assertReportPending(REPORT_STATUS.PENDING)).not.toThrow();
		expect(() => assertReportPending(REPORT_STATUS.ACTIONED)).toThrowError(DomainError);
		expect(resolutionToStatus("DISMISSED")).toBe(REPORT_STATUS.DISMISSED);
	});

	it("separates review from action permissions", () => {
		expect(canModerate("MODERATOR")).toBe(true);
		expect(canModerate("USER")).toBe(false);
		expect(canTakeModerationAction("MODERATOR")).toBe(false);
		expect(canTakeModerationAction("ADMIN")).toBe(true);

		expect(() => assertCanModerate("USER")).toThrow();
		expect(() => assertCanModerate("MODERATOR")).not.toThrow();
		expect(() => assertCanTakeModerationAction("ADMIN")).not.toThrow();
	});
});
