import { contract } from "@app/api-contract";
import { NOTIFICATION_TYPE } from "@app/shared";
import { implement } from "@orpc/server";
import { requireUserId, toOrpcError } from "#/platform/orpc/errors.ts";
import type { OrpcContext } from "#/platform/orpc/context.ts";
import { createDrizzleSubmissionRepository } from "#/modules/debate-execution/infrastructure/persistence/drizzle-submission-repository.ts";
import { createDrizzleRoomRepository } from "#/modules/debate-room/infrastructure/persistence/drizzle-room-repository.ts";
import { createDrizzleRoomParticipationReader } from "#/modules/membership/infrastructure/persistence/drizzle-membership-repository.ts";
import { notificationServiceFor, safeNotify } from "#/modules/notifications/index.ts";
import { createDrizzleReportRepository } from "../infrastructure/persistence/drizzle-report-repository.ts";
import { createReport } from "../application/use-cases/create-report.ts";
import { listReports } from "../application/use-cases/list-reports.ts";
import { resolveReport } from "../application/use-cases/resolve-report.ts";

const os = implement(contract).$context<OrpcContext>();

const depsFrom = (context: OrpcContext) => ({
	rooms: createDrizzleRoomRepository(context.db),
	submissions: createDrizzleSubmissionRepository(context.db),
	reports: createDrizzleReportRepository(context.db),
	participation: createDrizzleRoomParticipationReader(context.db),
});

export const reportsRouter = {
	create: os.reports.create.handler(async ({ context, input }) => {
		const userId = requireUserId(context);

		try {
			return await createReport(depsFrom(context), userId, input);
		} catch (error) {
			return toOrpcError(error);
		}
	}),

	list: os.reports.list.handler(async ({ context, input }) => {
		requireUserId(context);

		try {
			return await listReports(depsFrom(context), context.session?.user.role ?? "USER", input);
		} catch (error) {
			return toOrpcError(error);
		}
	}),

	resolve: os.reports.resolve.handler(async ({ context, input }) => {
		const userId = requireUserId(context);

		try {
			const report = await resolveReport(
				depsFrom(context),
				userId,
				context.session?.user.role ?? "USER",
				input,
			);

			await safeNotify(
				notificationServiceFor(context.db).notifyUser(report.reporter.id, {
					type: NOTIFICATION_TYPE.REPORT_RESOLVED,
					title: "Report resolved",
					body: `Your report for "${report.room.title}" was ${report.status.toLowerCase()}.`,
					roomId: report.room.id,
				}),
			);

			return report;
		} catch (error) {
			return toOrpcError(error);
		}
	}),
};
