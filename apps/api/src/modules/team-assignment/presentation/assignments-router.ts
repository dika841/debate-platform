import { contract } from "@app/api-contract";
import { implement } from "@orpc/server";
import { requireUserId, toOrpcError } from "#/platform/orpc/errors.ts";
import type { OrpcContext } from "#/platform/orpc/context.ts";
import { createDrizzleRoomRepository } from "#/modules/debate-room/infrastructure/persistence/drizzle-room-repository.ts";
import { createDrizzleMembershipRepository } from "#/modules/membership/infrastructure/persistence/drizzle-membership-repository.ts";
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
			return await finalizeAssignments(depsFrom(context), userId, input.roomId);
		} catch (error) {
			return toOrpcError(error);
		}
	}),
};
