import type { Database } from "@app/database";
import { contentReports, debateRooms, userProfiles, users } from "@app/database/schema";
import type { ReportCategory, ReportStatus } from "@app/shared";
import { and, desc, eq, lt, or, type SQL } from "drizzle-orm";
import { decodeCursor, encodeCursor } from "#/platform/persistence/cursor.ts";
import type {
	NewReport,
	ReportListFilter,
	ReportPage,
	ReportRepository,
	ReportWithRelations,
	ResolveReportPatch,
} from "../../application/ports/report-repository.ts";

type ReportRow = {
	id: string;
	roomId: string;
	submissionId: string | null;
	reporterId: string;
	category: string;
	details: string;
	status: string;
	resolutionNote: string | null;
	resolvedById: string | null;
	resolvedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
	roomTitle: string;
	reporterName: string;
	reporterDisplayName: string | null;
	reporterUsername: string | null;
};

const reportSelection = {
	id: contentReports.id,
	roomId: contentReports.roomId,
	submissionId: contentReports.submissionId,
	reporterId: contentReports.reporterId,
	category: contentReports.category,
	details: contentReports.details,
	status: contentReports.status,
	resolutionNote: contentReports.resolutionNote,
	resolvedById: contentReports.resolvedById,
	resolvedAt: contentReports.resolvedAt,
	createdAt: contentReports.createdAt,
	updatedAt: contentReports.updatedAt,
	roomTitle: debateRooms.title,
	reporterName: users.name,
	reporterDisplayName: userProfiles.displayName,
	reporterUsername: userProfiles.username,
};

const rowToReport = (row: ReportRow): ReportWithRelations => ({
	report: {
		id: row.id,
		roomId: row.roomId,
		submissionId: row.submissionId,
		reporterId: row.reporterId,
		category: row.category as ReportCategory,
		details: row.details,
		status: row.status as ReportStatus,
		resolutionNote: row.resolutionNote,
		resolvedById: row.resolvedById,
		resolvedAt: row.resolvedAt,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	},
	room: { id: row.roomId, title: row.roomTitle },
	reporter: {
		id: row.reporterId,
		displayName: row.reporterDisplayName ?? row.reporterName,
		username: row.reporterUsername,
	},
});

export const createDrizzleReportRepository = (db: Database): ReportRepository => {
	const findById = async (id: string): Promise<ReportWithRelations | null> => {
		const [row] = await db
			.select(reportSelection)
			.from(contentReports)
			.innerJoin(debateRooms, eq(contentReports.roomId, debateRooms.id))
			.innerJoin(users, eq(contentReports.reporterId, users.id))
			.leftJoin(userProfiles, eq(userProfiles.userId, users.id))
			.where(eq(contentReports.id, id))
			.limit(1);

		return row ? rowToReport(row) : null;
	};

	return {
		async create(input: NewReport) {
			await db.insert(contentReports).values({
				id: input.id,
				roomId: input.roomId,
				submissionId: input.submissionId,
				reporterId: input.reporterId,
				category: input.category,
				details: input.details,
				createdAt: input.createdAt,
				updatedAt: input.createdAt,
			});

			const created = await findById(input.id);

			if (!created) {
				throw new Error("Report insert failed");
			}

			return created;
		},

		findById,

		async list(filter: ReportListFilter): Promise<ReportPage> {
			const conditions: SQL[] = [];

			if (filter.status) {
				conditions.push(eq(contentReports.status, filter.status));
			}

			const cursor = decodeCursor(filter.cursor);
			if (cursor) {
				const cursorCondition = or(
					lt(contentReports.createdAt, cursor.timestamp),
					and(eq(contentReports.createdAt, cursor.timestamp), lt(contentReports.id, cursor.id)),
				);

				if (cursorCondition) {
					conditions.push(cursorCondition);
				}
			}

			const rows = await db
				.select(reportSelection)
				.from(contentReports)
				.innerJoin(debateRooms, eq(contentReports.roomId, debateRooms.id))
				.innerJoin(users, eq(contentReports.reporterId, users.id))
				.leftJoin(userProfiles, eq(userProfiles.userId, users.id))
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(desc(contentReports.createdAt), desc(contentReports.id))
				.limit(filter.limit + 1);

			const hasMore = rows.length > filter.limit;
			const pageRows = hasMore ? rows.slice(0, filter.limit) : rows;
			const items = pageRows.map(rowToReport);
			const lastItem = items.at(-1);

			return {
				items,
				nextCursor:
					hasMore && lastItem
						? encodeCursor({
								timestamp: lastItem.report.createdAt,
								id: lastItem.report.id,
							})
						: null,
			};
		},

		async resolve(id: string, patch: ResolveReportPatch) {
			const [updated] = await db
				.update(contentReports)
				.set({
					status: patch.status,
					resolutionNote: patch.resolutionNote,
					resolvedById: patch.resolvedById,
					resolvedAt: patch.resolvedAt,
					updatedAt: patch.resolvedAt,
				})
				.where(eq(contentReports.id, id))
				.returning({ id: contentReports.id });

			if (!updated) {
				throw new Error("Report not found");
			}

			const result = await findById(id);

			if (!result) {
				throw new Error("Report not found after update");
			}

			return result;
		},
	};
};
