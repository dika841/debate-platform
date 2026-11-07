import { contract } from "@app/api-contract";
import { implement } from "@orpc/server";
import type { OrpcContext } from "#/platform/orpc/context.ts";
import { requireUserId, toOrpcError } from "#/platform/orpc/errors.ts";
import { cancelRoom } from "../application/use-cases/cancel-room.ts";
import { createRoom } from "../application/use-cases/create-room.ts";
import { getRoom } from "../application/use-cases/get-room.ts";
import { listRooms } from "../application/use-cases/list-rooms.ts";
import { publishRoom } from "../application/use-cases/publish-room.ts";
import { updateRoom } from "../application/use-cases/update-room.ts";
import { createDrizzleRoomRepository } from "../infrastructure/persistence/drizzle-room-repository.ts";
import { createDrizzleRoomParticipationReader } from "#/modules/membership/infrastructure/persistence/drizzle-membership-repository.ts";

const os = implement(contract).$context<OrpcContext>();

const repositoryFrom = (context: OrpcContext) => createDrizzleRoomRepository(context.db);

export const roomsRouter = {
	create: os.rooms.create.handler(async ({ context, input }) => {
		const userId = requireUserId(context);

		try {
			return await createRoom({ repository: repositoryFrom(context) }, userId, input);
		} catch (error) {
			return toOrpcError(error);
		}
	}),

	get: os.rooms.get.handler(async ({ context, input }) => {
		try {
			return await getRoom(
				{
					repository: repositoryFrom(context),
					participation: createDrizzleRoomParticipationReader(context.db),
				},
				input.id,
				context.session?.userId ?? null,
			);
		} catch (error) {
			return toOrpcError(error);
		}
	}),

	list: os.rooms.list.handler(async ({ context, input }) => {
		try {
			return await listRooms(
				{ repository: repositoryFrom(context) },
				context.session?.userId ?? null,
				input,
			);
		} catch (error) {
			return toOrpcError(error);
		}
	}),

	update: os.rooms.update.handler(async ({ context, input }) => {
		const userId = requireUserId(context);

		try {
			return await updateRoom({ repository: repositoryFrom(context) }, userId, input);
		} catch (error) {
			return toOrpcError(error);
		}
	}),

	publish: os.rooms.publish.handler(async ({ context, input }) => {
		const userId = requireUserId(context);

		try {
			return await publishRoom({ repository: repositoryFrom(context) }, userId, input.id);
		} catch (error) {
			return toOrpcError(error);
		}
	}),

	cancel: os.rooms.cancel.handler(async ({ context, input }) => {
		const userId = requireUserId(context);

		try {
			return await cancelRoom({ repository: repositoryFrom(context) }, userId, input.id);
		} catch (error) {
			return toOrpcError(error);
		}
	}),
};
