import type { Report } from "@app/api-contract";
import type { ReportWithRelations } from "../ports/report-repository.ts";

export const toReportDto = ({ report, room, reporter }: ReportWithRelations): Report => ({
	id: report.id,
	room: { id: room.id, title: room.title },
	submissionId: report.submissionId,
	category: report.category,
	details: report.details,
	status: report.status,
	resolutionNote: report.resolutionNote,
	reporter: {
		id: reporter.id,
		displayName: reporter.displayName,
		username: reporter.username,
	},
	createdAt: report.createdAt.toISOString(),
	resolvedAt: report.resolvedAt?.toISOString() ?? null,
});
