import type { ListRoundsResult } from "@app/api-contract";
import { type Clock, DOMAIN_ERROR_CODE, DomainError, ROUND_STATUS, systemClock } from "@app/shared";
import type { RoomRepository } from "#/modules/debate-room/application/ports/room-repository.ts";
import { assertRoomHost, loadRoom } from "#/modules/debate-room/application/room-access.ts";
import type { MembershipRepository } from "#/modules/membership/application/ports/membership-repository.ts";
import {
	assertRoomInProgress,
	assertRoundAdvanceable,
	effectiveRoundStatus,
	submissionDeadlineFor,
	votingDeadlineFor,
} from "../../domain/round.ts";
import { toRoundDto } from "../mappers/execution-mapper.ts";
import type { RoundRepository, RoundSummaryRecord } from "../ports/round-repository.ts";

export type AdvanceRoundDeps = {
	readonly rooms: RoomRepository;
	readonly rounds: RoundRepository;
	readonly memberships: MembershipRepository;
	readonly clock?: Clock;
};

export const advanceRound = async (
	deps: AdvanceRoundDeps,
	actorId: string,
	roomId: string,
): Promise<ListRoundsResult> => {
	const found = await loadRoom(deps.rooms, roomId);
	assertRoomHost(found, actorId);
	assertRoomInProgress(found.room.status);

	const clock = deps.clock ?? systemClock;
	const now = clock.now();
	const rounds = await deps.rounds.listByRoom(roomId);
	const current = rounds.find((summary) => summary.round.status !== ROUND_STATUS.CLOSED);

	if (!current) {
		throw new DomainError(DOMAIN_ERROR_CODE.INVALID_ROUND_STATE, "All rounds are already closed");
	}

	const openRound = async (summary: RoundSummaryRecord): Promise<void> => {
		const submissionDeadline = submissionDeadlineFor(now, found.room.submissionDurationMinutes);

		await deps.rounds.update(summary.round.id, {
			status: ROUND_STATUS.OPEN,
			opensAt: now,
			submissionDeadline,
			votingDeadline: votingDeadlineFor(submissionDeadline, found.room.votingDurationMinutes),
			updatedAt: now,
		});
	};

	const openNextRound = async (roundNumber: number): Promise<void> => {
		const next = rounds.find((summary) => summary.round.roundNumber === roundNumber + 1);

		if (next) {
			await openRound(next);
		}
	};

	if (current.round.status === ROUND_STATUS.OPEN) {
		const effective = effectiveRoundStatus(current.round, now);

		if (effective === ROUND_STATUS.OPEN) {
			const participants = await deps.memberships.listParticipants(roomId);
			assertRoundAdvanceable(current.round, now, current.submissionCount, participants.length);
		}

		if (effective === ROUND_STATUS.CLOSED) {
			await deps.rounds.update(current.round.id, {
				status: ROUND_STATUS.CLOSED,
				updatedAt: now,
			});
			await openNextRound(current.round.roundNumber);
		} else {
			await deps.rounds.update(current.round.id, {
				status: ROUND_STATUS.VOTING,
				votingDeadline:
					current.round.votingDeadline ?? votingDeadlineFor(now, found.room.votingDurationMinutes),
				updatedAt: now,
			});
		}
	} else if (current.round.status === ROUND_STATUS.VOTING) {
		await deps.rounds.update(current.round.id, {
			status: ROUND_STATUS.CLOSED,
			updatedAt: now,
		});
		await openNextRound(current.round.roundNumber);
	} else {
		await openRound(current);
	}

	const refreshed = await deps.rounds.listByRoom(roomId);

	return {
		items: refreshed.map((summary) => toRoundDto(summary, now)),
	};
};
