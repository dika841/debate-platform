import { REPORT_STATUS, ROOM_STATUS } from "@app/shared";
import { describe, expect, it } from "vitest";
import type { SubmissionRepository } from "#/modules/debate-execution/application/ports/submission-repository.ts";
import type {
	RoomRepository,
	RoomWithHost,
} from "#/modules/debate-room/application/ports/room-repository.ts";
import type {
	NewReport,
	ReportPage,
	ReportRepository,
	ReportWithRelations,
	ResolveReportPatch,
} from "../ports/report-repository.ts";
import { createReport } from "./create-report.ts";
import { listReports } from "./list-reports.ts";
import { resolveReport } from "./resolve-report.ts";

const HOST_ID = "host-1";
const REPORTER_ID = "user-1";

const roomWith = (): RoomWithHost => ({
	room: {
		id: "room-1",
		hostId: HOST_ID,
		title: "Climate debate",
		motion: "This house would ban fossil fuels",
		description: null,
		status: ROOM_STATUS.IN_PROGRESS,
		teamSize: 1,
		roundCount: 1,
		submissionDurationMinutes: 30,
		votingDurationMinutes: 30,
		spectatorVotingEnabled: true,
		publishedAt: new Date("2026-04-01T08:00:00.000Z"),
		cancelledAt: null,
		assignmentFinalizedAt: new Date("2026-04-01T08:30:00.000Z"),
		createdAt: new Date("2026-04-01T07:00:00.000Z"),
		updatedAt: new Date("2026-04-01T07:00:00.000Z"),
	},
	host: { id: HOST_ID, displayName: "Host", username: "host" },
});

const createHarness = () => {
	const reports: ReportWithRelations[] = [];
	const room = roomWith();

	const rooms: RoomRepository = {
		create: async () => {
			throw new Error("not used");
		},
		findById: async (id) => (id === room.room.id ? room : null),
		list: async () => ({ items: [], nextCursor: null }),
		update: async () => {
			throw new Error("not used");
		},
	};

	const submissions: SubmissionRepository = {
		create: async () => {
			throw new Error("not used");
		},
		findById: async (id) =>
			id === "submission-1"
				? {
						submission: {
							id: "submission-1",
							roundId: "round-1",
							roomId: "room-1",
							authorId: "user-2",
							team: "PRO",
							content: "x",
							submittedAt: new Date(),
						},
						author: { id: "user-2", displayName: "Member", username: "member" },
					}
				: null,
		findByRoundAndAuthor: async () => null,
		listByRound: async () => [],
		countByRound: async () => 0,
	};

	const reportRepo: ReportRepository = {
		create: async (input: NewReport) => {
			const created: ReportWithRelations = {
				report: {
					id: input.id,
					roomId: input.roomId,
					submissionId: input.submissionId,
					reporterId: input.reporterId,
					category: input.category,
					details: input.details,
					status: REPORT_STATUS.PENDING,
					resolutionNote: null,
					resolvedById: null,
					resolvedAt: null,
					createdAt: input.createdAt,
					updatedAt: input.createdAt,
				},
				room: { id: "room-1", title: "Climate debate" },
				reporter: { id: input.reporterId, displayName: "Reporter", username: "reporter" },
			};
			reports.push(created);
			return created;
		},
		findById: async (id) => reports.find((item) => item.report.id === id) ?? null,
		list: async (): Promise<ReportPage> => ({ items: reports, nextCursor: null }),
		resolve: async (id: string, patch: ResolveReportPatch) => {
			const index = reports.findIndex((item) => item.report.id === id);
			const found = reports[index];

			if (!found) {
				throw new Error("missing");
			}

			const updated: ReportWithRelations = {
				...found,
				report: {
					...found.report,
					status: patch.status,
					resolutionNote: patch.resolutionNote,
					resolvedById: patch.resolvedById,
					resolvedAt: patch.resolvedAt,
				},
			};

			reports[index] = updated;
			return updated;
		},
	};

	return {
		deps: {
			rooms,
			submissions,
			reports: reportRepo,
			participation: {
				snapshot: async () => ({
					participantCount: 2,
					spectatorCount: 0,
					viewerRole: null,
					proCount: 1,
					contraCount: 1,
				}),
			},
			clock: { now: () => new Date("2026-04-01T12:00:00.000Z") },
			generateId: () => "generated-1",
		},
		reports,
	};
};

describe("moderation use cases", () => {
	it("creates a room report", async () => {
		const harness = createHarness();

		const report = await createReport(harness.deps, REPORTER_ID, {
			roomId: "room-1",
			category: "HARASSMENT",
			details: "This argument targets a person instead of the motion.",
		});

		expect(report.status).toBe(REPORT_STATUS.PENDING);
		expect(report.reporter.id).toBe(REPORTER_ID);
	});

	it("creates a submission report only for the same room", async () => {
		const harness = createHarness();

		const report = await createReport(harness.deps, REPORTER_ID, {
			roomId: "room-1",
			submissionId: "submission-1",
			category: "HATE_SPEECH",
			details: "The submitted argument contains a slur targeting a group.",
		});

		expect(report.submissionId).toBe("submission-1");
	});

	it("rejects invalid details", async () => {
		const harness = createHarness();

		await expect(
			createReport(harness.deps, REPORTER_ID, {
				roomId: "room-1",
				category: "SPAM",
				details: "short",
			}),
		).rejects.toMatchObject({ code: "INVALID_REPORT" });
	});

	it("lists reports for moderators only", async () => {
		const harness = createHarness();
		await createReport(harness.deps, REPORTER_ID, {
			roomId: "room-1",
			category: "SPAM",
			details: "This message is repeated advertising spam.",
		});

		await expect(listReports({ reports: harness.deps.reports }, "USER", {})).rejects.toMatchObject({
			code: "AUTHORIZATION_DENIED",
		});

		const result = await listReports({ reports: harness.deps.reports }, "MODERATOR", {});
		expect(result.items).toHaveLength(1);
	});

	it("requires action permission to resolve and rejects double resolution", async () => {
		const harness = createHarness();
		await createReport(harness.deps, REPORTER_ID, {
			roomId: "room-1",
			category: "OTHER",
			details: "This report needs a moderator decision now.",
		});

		await expect(
			resolveReport(
				{ reports: harness.deps.reports, clock: harness.deps.clock },
				"mod-1",
				"MODERATOR",
				{ reportId: "generated-1", status: "ACTIONED" },
			),
		).rejects.toMatchObject({ code: "AUTHORIZATION_DENIED" });

		const resolved = await resolveReport(
			{ reports: harness.deps.reports, clock: harness.deps.clock },
			"admin-1",
			"ADMIN",
			{ reportId: "generated-1", status: "ACTIONED", note: "Handled" },
		);
		expect(resolved.status).toBe(REPORT_STATUS.ACTIONED);
		expect(resolved.resolutionNote).toBe("Handled");

		await expect(
			resolveReport(
				{ reports: harness.deps.reports, clock: harness.deps.clock },
				"admin-1",
				"ADMIN",
				{ reportId: "generated-1", status: "DISMISSED" },
			),
		).rejects.toMatchObject({ code: "INVALID_REPORT_STATE" });
	});
});
