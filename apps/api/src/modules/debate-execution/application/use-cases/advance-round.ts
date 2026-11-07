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
} from "../../domain/round.ts";
import { toRoundDto } from "../mappers/execution-mapper.ts";
import type { RoundRepository } from "../ports/round-repository.ts";

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
	const current = rounds.find(
		(summary) => effectiveRoundStatus(summary.round, now) !== ROUND_STATUS.CLOSED,
	);

	if (!current) {
		throw new DomainError(DOMAIN_ERROR_CODE.INVALID_ROUND_STATE, "All rounds are already closed");
	}

	if (effectiveRoundStatus(current.round, now) === ROUND_STATUS.OPEN) {
		const participants = await deps.memberships.listParticipants(roomId);
		assertRoundAdvanceable(current.round, now, current.submissionCount, participants.length);

		await deps.rounds.update(current.round.id, {
			status: ROUND_STATUS.CLOSED,
			updatedAt: now,
		});
	}

	const next = rounds.find(
		(summary) => summary.round.roundNumber === current.round.roundNumber + 1,
	);

	let opening = next;
	if (!opening) {
		opening = rounds.find(
			(summary) =>
				summary.round.roundNumber > current.round.roundNumber &&
				effectiveRoundStatus(summary.round, now) !== ROUND_STATUS.CLOSED,
		);
	}

	if (opening) {
		await deps.rounds.update(opening.round.id, {
			status: ROUND_STATUS.OPEN,
			opensAt: now,
			submissionDeadline: submissionDeadlineFor(now, found.room.submissionDurationMinutes),
			updatedAt: now,
		});
	}

	const refreshed = await deps.rounds.listByRoom(roomId);

	return {
		items: refreshed.map((summary) => toRoundDto(summary, now)),
	};
};
