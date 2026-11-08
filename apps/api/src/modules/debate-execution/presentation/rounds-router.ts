import { contract } from "@app/api-contract";
import { NOTIFICATION_TYPE } from "@app/shared";
import { implement } from "@orpc/server";
import { requireUserId, toOrpcError } from "#/platform/orpc/errors.ts";
import type { OrpcContext } from "#/platform/orpc/context.ts";
import { createDrizzleRoomRepository } from "#/modules/debate-room/infrastructure/persistence/drizzle-room-repository.ts";
import { notificationServiceFor, safeNotify } from "#/modules/notifications/index.ts";
import {
	createDrizzleMembershipRepository,
	createDrizzleRoomParticipationReader,
} from "#/modules/membership/infrastructure/persistence/drizzle-membership-repository.ts";
import { createDrizzleRoundRepository } from "../infrastructure/persistence/drizzle-round-repository.ts";
import { createDrizzleSubmissionRepository } from "../infrastructure/persistence/drizzle-submission-repository.ts";
import { advanceRound } from "../application/use-cases/advance-round.ts";
import { createSubmission } from "../application/use-cases/create-submission.ts";
import { listRounds } from "../application/use-cases/list-rounds.ts";
import { listSubmissions } from "../application/use-cases/list-submissions.ts";
import { startDebate } from "../application/use-cases/start-debate.ts";

const os = implement(contract).$context<OrpcContext>();

const depsFrom = (context: OrpcContext) => ({
	rooms: createDrizzleRoomRepository(context.db),
	rounds: createDrizzleRoundRepository(context.db),
	memberships: createDrizzleMembershipRepository(context.db),
	submissions: createDrizzleSubmissionRepository(context.db),
	participation: createDrizzleRoomParticipationReader(context.db),
});

export const roundsRouter = {
	list: os.rounds.list.handler(async ({ context, input }) => {
		try {
			return await listRounds(depsFrom(context), context.session?.userId ?? null, input.roomId);
		} catch (error) {
			return toOrpcError(error);
		}
	}),

	start: os.rounds.start.handler(async ({ context, input }) => {
		const userId = requireUserId(context);

		try {
			const result = await startDebate(depsFrom(context), userId, input.roomId);
			const firstRound = result.items[0];

			await safeNotify(
				notificationServiceFor(context.db).notifyRoomMembers(
					input.roomId,
					{
						type: NOTIFICATION_TYPE.DEBATE_STARTED,
						title: "Debate started",
						body: firstRound
							? `Round ${firstRound.roundNumber} is now open for submissions.`
							: "The debate has started.",
						roomId: input.roomId,
						roundId: firstRound?.id ?? null,
					},
					{ excludeUserId: userId },
				),
			);

			return result;
		} catch (error) {
			return toOrpcError(error);
		}
	}),

	advance: os.rounds.advance.handler(async ({ context, input }) => {
		const userId = requireUserId(context);

		try {
			const result = await advanceRound(depsFrom(context), userId, input.roomId);
			const votingRound = result.items.find((round) => round.status === "VOTING");
			const openedRound = result.items.find((round) => round.status === "OPEN");

			if (votingRound) {
				await safeNotify(
					notificationServiceFor(context.db).notifyRoomMembers(
						input.roomId,
						{
							type: NOTIFICATION_TYPE.ROUND_VOTING,
							title: "Voting opened",
							body: `Round ${votingRound.roundNumber} is now open for voting.`,
							roomId: input.roomId,
							roundId: votingRound.id,
						},
						{ excludeUserId: userId },
					),
				);
			} else if (openedRound) {
				await safeNotify(
					notificationServiceFor(context.db).notifyRoomMembers(
						input.roomId,
						{
							type: NOTIFICATION_TYPE.ROUND_OPENED,
							title: "New round opened",
							body: `Round ${openedRound.roundNumber} is now open for submissions.`,
							roomId: input.roomId,
							roundId: openedRound.id,
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
};

export const submissionsRouter = {
	create: os.submissions.create.handler(async ({ context, input }) => {
		const userId = requireUserId(context);

		try {
			return await createSubmission(depsFrom(context), userId, input);
		} catch (error) {
			return toOrpcError(error);
		}
	}),

	list: os.submissions.list.handler(async ({ context, input }) => {
		try {
			return await listSubmissions(
				depsFrom(context),
				context.session?.userId ?? null,
				input.roundId,
			);
		} catch (error) {
			return toOrpcError(error);
		}
	}),
};
