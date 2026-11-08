import { contract } from "@app/api-contract";
import { NOTIFICATION_TYPE } from "@app/shared";
import { implement } from "@orpc/server";
import { auditLoggerFor, safeAudit } from "#/modules/audit/index.ts";
import { requireUserId, toOrpcError } from "#/platform/orpc/errors.ts";
import type { OrpcContext } from "#/platform/orpc/context.ts";
import { createDrizzleRoomRepository } from "#/modules/debate-room/infrastructure/persistence/drizzle-room-repository.ts";
import { createDrizzleMembershipRepository } from "#/modules/membership/infrastructure/persistence/drizzle-membership-repository.ts";
import { notificationServiceFor, safeNotify } from "#/modules/notifications/index.ts";
import { autoAssignTeams } from "../application/use-cases/auto-assign-teams.ts";
import { finalizeAssignments } from "../application/use-cases/finalize-assignments.ts";
import { setTeam } from "../application/use-cases/set-team.ts";

const os = implement(contract).$context<OrpcContext>();

const depsFrom = (context: OrpcContext) => ({
	rooms: createDrizzleRoomRepository(context.db),
	memberships: createDrizzleMembershipRepository(context.db),
});

export const assignmentsRouter = {
	autoAssign: os.assignments.autoAssign.handler(async ({ context, input }) => {
		const userId = requireUserId(context);

		try {
			return await autoAssignTeams(depsFrom(context), userId, input.roomId);
		} catch (error) {
			return toOrpcError(error);
		}
	}),

	setTeam: os.assignments.setTeam.handler(async ({ context, input }) => {
		const userId = requireUserId(context);

		try {
			return await setTeam(depsFrom(context), userId, input);
		} catch (error) {
			return toOrpcError(error);
		}
	}),

	finalize: os.assignments.finalize.handler(async ({ context, input }) => {
		const userId = requireUserId(context);

		try {
			const summary = await finalizeAssignments(depsFrom(context), userId, input.roomId);

			await safeNotify(
				notificationServiceFor(context.db).notifyRoomMembers(
					input.roomId,
					{
						type: NOTIFICATION_TYPE.ASSIGNMENT_FINALIZED,
						title: "Teams finalized",
						body: "Team assignments are locked. The host can start the debate.",
						roomId: input.roomId,
					},
					{ excludeUserId: userId },
				),
			);

			await safeAudit(
				auditLoggerFor(context.db).record({
					actorId: userId,
					actorRole: context.session?.user.role ?? "USER",
					action: "assignment.finalize",
					entityType: "room",
					entityId: input.roomId,
					metadata: {
						proCount: summary.proCount,
						contraCount: summary.contraCount,
					},
				}),
			);

			return summary;
		} catch (error) {
			return toOrpcError(error);
		}
	}),
};
