import { contract } from "@app/api-contract";
import { NOTIFICATION_TYPE } from "@app/shared";
import { implement } from "@orpc/server";
import { requireUserId, toOrpcError } from "#/platform/orpc/errors.ts";
import type { OrpcContext } from "#/platform/orpc/context.ts";
import { createDrizzleRoundRepository } from "#/modules/debate-execution/infrastructure/persistence/drizzle-round-repository.ts";
import { createDrizzleRoomRepository } from "#/modules/debate-room/infrastructure/persistence/drizzle-room-repository.ts";
import { createDrizzleRoomParticipationReader } from "#/modules/membership/infrastructure/persistence/drizzle-membership-repository.ts";
import { createDrizzleVoteRepository } from "#/modules/voting/infrastructure/persistence/drizzle-vote-repository.ts";
import { notificationServiceFor, safeNotify } from "#/modules/notifications/index.ts";
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
		const deps = depsFrom(context);

		try {
			const result = await finalizeRound(deps, userId, input.roundId);
			const round = await deps.rounds.findById(input.roundId);

			if (round) {
				await safeNotify(
					notificationServiceFor(context.db).notifyRoomMembers(
						round.roomId,
						{
							type: NOTIFICATION_TYPE.ROUND_RESULT,
							title: `Round ${result.roundNumber} result`,
							body: `${result.outcome}: PRO ${result.proCount} · CONTRA ${result.contraCount} (${result.totalVotes} votes).`,
							roomId: round.roomId,
							roundId: result.roundId,
						},
						{ excludeUserId: userId },
					),
				);
			}

			return result;
		} catch (error) {
			return toOrpcError(error);
		}
	}),

	finalizeRoom: os.results.finalizeRoom.handler(async ({ context, input }) => {
		const userId = requireUserId(context);

		try {
			const result = await finalizeRoom(depsFrom(context), userId, input.roomId);

			await safeNotify(
				notificationServiceFor(context.db).notifyRoomMembers(
					input.roomId,
					{
						type: NOTIFICATION_TYPE.ROOM_RESULT,
						title: "Debate completed",
						body:
							result.outcome === "DRAW"
								? `The debate ended in a draw: PRO ${result.proWins} · CONTRA ${result.contraWins}.`
								: `${result.outcome} won the debate: PRO ${result.proWins} · CONTRA ${result.contraWins}.`,
						roomId: input.roomId,
					},
					{ excludeUserId: userId },
				),
			);

			return result;
		} catch (error) {
			return toOrpcError(error);
		}
	}),
};
