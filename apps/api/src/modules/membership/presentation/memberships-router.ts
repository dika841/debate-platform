import { contract } from "@app/api-contract";
import { NOTIFICATION_TYPE } from "@app/shared";
import { implement } from "@orpc/server";
import type { OrpcContext } from "#/platform/orpc/context.ts";
import { requireUserId, toOrpcError } from "#/platform/orpc/errors.ts";
import { createDrizzleRoomRepository } from "#/modules/debate-room/infrastructure/persistence/drizzle-room-repository.ts";
import { notificationServiceFor, safeNotify } from "#/modules/notifications/index.ts";
import { joinRoom } from "../application/use-cases/join-room.ts";
import { leaveRoom } from "../application/use-cases/leave-room.ts";
import { listMembers } from "../application/use-cases/list-members.ts";
import {
	createDrizzleMembershipRepository,
	createDrizzleRoomParticipationReader,
} from "../infrastructure/persistence/drizzle-membership-repository.ts";

const os = implement(contract).$context<OrpcContext>();

const depsFrom = (context: OrpcContext) => ({
	rooms: createDrizzleRoomRepository(context.db),
	memberships: createDrizzleMembershipRepository(context.db),
	participation: createDrizzleRoomParticipationReader(context.db),
});

export const membershipsRouter = {
	join: os.memberships.join.handler(async ({ context, input }) => {
		const userId = requireUserId(context);

		try {
			const membership = await joinRoom(depsFrom(context), userId, input);

			await safeNotify(
				notificationServiceFor(context.db).notifyHost(input.roomId, {
					type: NOTIFICATION_TYPE.MEMBER_JOINED,
					title: "New member joined",
					body: `${membership.user.displayName} joined as ${input.role.toLowerCase()}.`,
					roomId: input.roomId,
				}),
			);

			return membership;
		} catch (error) {
			return toOrpcError(error);
		}
	}),

	leave: os.memberships.leave.handler(async ({ context, input }) => {
		const userId = requireUserId(context);

		try {
			return await leaveRoom(depsFrom(context), userId, input.roomId);
		} catch (error) {
			return toOrpcError(error);
		}
	}),

	list: os.memberships.list.handler(async ({ context, input }) => {
		try {
			return await listMembers(depsFrom(context), context.session?.userId ?? null, input);
		} catch (error) {
			return toOrpcError(error);
		}
	}),
};
