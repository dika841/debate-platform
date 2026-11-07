import { contract } from "@app/api-contract";
import { implement } from "@orpc/server";
import { requireUserId, toOrpcError } from "#/platform/orpc/errors.ts";
import type { OrpcContext } from "#/platform/orpc/context.ts";
import { createDrizzleRoundRepository } from "#/modules/debate-execution/infrastructure/persistence/drizzle-round-repository.ts";
import { createDrizzleRoomRepository } from "#/modules/debate-room/infrastructure/persistence/drizzle-room-repository.ts";
import { createDrizzleRoomParticipationReader } from "#/modules/membership/infrastructure/persistence/drizzle-membership-repository.ts";
import { createDrizzleVoteRepository } from "#/modules/voting/infrastructure/persistence/drizzle-vote-repository.ts";
import { createDrizzleResultRepository } from "../infrastructure/persistence/drizzle-result-repository.ts";
import { finalizeRoom } from "../application/use-cases/finalize-room.ts";
import { finalizeRound } from "../application/use-cases/finalize-round.ts";
import { getRoomResults } from "../application/use-cases/get-room-results.ts";

const os = implement(contract).$context<OrpcContext>();

const depsFrom = (context: OrpcContext) => ({
	rooms: createDrizzleRoomRepository(context.db),
	rounds: createDrizzleRoundRepository(context.db),
	votes: createDrizzleVoteRepository(context.db),
	results: createDrizzleResultRepository(context.db),
	participation: createDrizzleRoomParticipationReader(context.db),
});

export const resultsRouter = {
	getRoom: os.results.getRoom.handler(async ({ context, input }) => {
		try {
			return await getRoomResults(depsFrom(context), context.session?.userId ?? null, input.roomId);
		} catch (error) {
			return toOrpcError(error);
		}
	}),

	finalizeRound: os.results.finalizeRound.handler(async ({ context, input }) => {
		const userId = requireUserId(context);

		try {
			return await finalizeRound(depsFrom(context), userId, input.roundId);
		} catch (error) {
			return toOrpcError(error);
		}
	}),

	finalizeRoom: os.results.finalizeRoom.handler(async ({ context, input }) => {
		const userId = requireUserId(context);

		try {
			return await finalizeRoom(depsFrom(context), userId, input.roomId);
		} catch (error) {
			return toOrpcError(error);
		}
	}),
};
