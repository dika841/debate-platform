import type { ListReportsInput, ListReportsResult } from "@app/api-contract";
import { pageRequest } from "@app/shared";
import { assertCanModerate } from "../../domain/permissions.ts";
import { toReportDto } from "../mappers/report-mapper.ts";
import type { ReportRepository } from "../ports/report-repository.ts";

export type ListReportsDeps = {
	readonly reports: ReportRepository;
};

export const listReports = async (
	deps: ListReportsDeps,
	actorRole: string,
	input: ListReportsInput,
): Promise<ListReportsResult> => {
	assertCanModerate(actorRole);

	const page = pageRequest({ cursor: input.cursor, limit: input.limit });
	const result = await deps.reports.list({
		status: input.status,
		cursor: page.cursor,
		limit: page.limit,
	});

	return {
		items: result.items.map(toReportDto),
		nextCursor: result.nextCursor,
	};
};
