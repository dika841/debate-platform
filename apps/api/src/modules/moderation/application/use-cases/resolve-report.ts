import type { Report, ResolveReportInput } from "@app/api-contract";
import { APPLICATION_ERROR_CODE, ApplicationError, type Clock, systemClock } from "@app/shared";
import { assertCanTakeModerationAction } from "../../domain/permissions.ts";
import { assertReportPending, resolutionToStatus } from "../../domain/report.ts";
import { toReportDto } from "../mappers/report-mapper.ts";
import type { ReportRepository } from "../ports/report-repository.ts";

export type ResolveReportDeps = {
	readonly reports: ReportRepository;
	readonly clock?: Clock;
};

export const resolveReport = async (
	deps: ResolveReportDeps,
	actorId: string,
	actorRole: string,
	input: ResolveReportInput,
): Promise<Report> => {
	assertCanTakeModerationAction(actorRole);

	const found = await deps.reports.findById(input.reportId);

	if (!found) {
		throw new ApplicationError(APPLICATION_ERROR_CODE.RESOURCE_NOT_FOUND, "Report not found");
	}

	assertReportPending(found.report.status);

	const clock = deps.clock ?? systemClock;
	const note = input.note && input.note.trim().length > 0 ? input.note.trim() : null;

	const resolved = await deps.reports.resolve(input.reportId, {
		status: resolutionToStatus(input.status),
		resolutionNote: note,
		resolvedById: actorId,
		resolvedAt: clock.now(),
	});

	return toReportDto(resolved);
};
