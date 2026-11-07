import { contract } from "@app/api-contract";
import { implement } from "@orpc/server";
import { requireUserId, toOrpcError } from "#/platform/orpc/errors.ts";
import type { OrpcContext } from "#/platform/orpc/context.ts";
import { createDrizzleRoundRepository } from "#/modules/debate-execution/infrastructure/persistence/drizzle-round-repository.ts";
import { createDrizzleRoomRepository } from "#/modules/debate-room/infrastructure/persistence/drizzle-room-repository.ts";
import {
	createDrizzleMembershipRepository,
	createDrizzleRoomParticipationReader,
} from "#/modules/membership/infrastructure/persistence/drizzle-membership-repository.ts";
import { createDrizzleVoteRepository } from "../infrastructure/persistence/drizzle-vote-repository.ts";
import { castVote } from "../application/use-cases/cast-vote.ts";
import { getVoteSummary } from "../application/use-cases/get-vote-summary.ts";

const os = implement(contract).$context<OrpcContext>();

const depsFrom = (context: OrpcContext) => ({
	rooms: createDrizzleRoomRepository(context.db),
	rounds: createDrizzleRoundRepository(context.db),
	memberships: createDrizzleMembershipRepository(context.db),
	votes: createDrizzleVoteRepository(context.db),
	participation: createDrizzleRoomParticipationReader(context.db),
});

export const votesRouter = {
	cast: os.votes.cast.handler(async ({ context, input }) => {
		const userId = requireUserId(context);

		try {
			return await castVote(depsFrom(context), userId, input);
		} catch (error) {
			return toOrpcError(error);
		}
	}),

	summary: os.votes.summary.handler(async ({ context, input }) => {
		try {
			return await getVoteSummary(
				depsFrom(context),
				context.session?.userId ?? null,
				input.roundId,
			);
		} catch (error) {
			return toOrpcError(error);
		}
	}),
};
