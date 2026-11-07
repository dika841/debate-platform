import { describe, expect, it } from "vitest";
import {
	createReportInputSchema,
	listReportsInputSchema,
	reportSchema,
	resolveReportInputSchema,
} from "./reports.ts";

const report = {
	id: "report-1",
	room: { id: "room-1", title: "Climate debate" },
	submissionId: null,
	category: "HARASSMENT" as const,
	details: "This argument targets a person instead of the motion.",
	status: "PENDING" as const,
	resolutionNote: null,
	reporter: { id: "user-1", displayName: "Reporter", username: "reporter" },
	createdAt: "2026-04-01T12:00:00.000Z",
	resolvedAt: null,
};

describe("reports contract", () => {
	it("accepts a report payload", () => {
		expect(reportSchema.parse(report).status).toBe("PENDING");
	});

	it("validates report creation", () => {
		const parsed = createReportInputSchema.parse({
			roomId: "room-1",
			category: "SPAM",
			details: "This message is repeated advertising spam.",
		});

		expect(parsed.submissionId).toBeUndefined();
		expect(() =>
			createReportInputSchema.parse({
				roomId: "room-1",
				category: "SPAM",
				details: "short",
			}),
		).toThrow();
	});

	it("accepts a status filter and resolution", () => {
		expect(listReportsInputSchema.parse({ status: "PENDING" }).status).toBe("PENDING");
		expect(
			resolveReportInputSchema.parse({
				reportId: "report-1",
				status: "ACTIONED",
				note: "Handled",
			}).status,
		).toBe("ACTIONED");
	});

	it("rejects resolving into PENDING", () => {
		expect(() =>
			resolveReportInputSchema.parse({
				reportId: "report-1",
				status: "PENDING",
			}),
		).toThrow();
	});
});
