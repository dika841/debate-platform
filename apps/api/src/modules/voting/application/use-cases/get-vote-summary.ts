import type { VoteSummary } from "@app/api-contract";
import {
	APPLICATION_ERROR_CODE,
	ApplicationError,
	type Clock,
	isPublicRoomStatus,
	systemClock,
} from "@app/shared";
import { effectiveRoundStatus } from "#/modules/debate-execution/domain/round.ts";
import type { RoundRepository } from "#/modules/debate-execution/application/ports/round-repository.ts";
import type { RoomParticipationReader } from "#/modules/debate-room/application/ports/room-participation-reader.ts";
import type { RoomRepository } from "#/modules/debate-room/application/ports/room-repository.ts";
import { loadRoom } from "#/modules/debate-room/application/room-access.ts";
import { areVoteTotalsRevealed } from "../../domain/vote.ts";
import { toVoteSummary } from "../mappers/vote-mapper.ts";
import type { VoteRepository } from "../ports/vote-repository.ts";

export type GetVoteSummaryDeps = {
	readonly rooms: RoomRepository;
	readonly rounds: RoundRepository;
	readonly votes: VoteRepository;
	readonly participation: RoomParticipationReader;
	readonly clock?: Clock;
};

const EMPTY_COUNTS = { proCount: 0, contraCount: 0, totalCount: 0 };

export const getVoteSummary = async (
	deps: GetVoteSummaryDeps,
	actorId: string | null,
	roundId: string,
): Promise<VoteSummary> => {
	const round = await deps.rounds.findById(roundId);

	if (!round) {
		throw new ApplicationError(APPLICATION_ERROR_CODE.RESOURCE_NOT_FOUND, "Round not found");
	}

	const room = await loadRoom(deps.rooms, round.roomId);
	const isHost = room.room.hostId === actorId;

	if (!isPublicRoomStatus(room.room.status) && !isHost) {
		const participation = await deps.participation.snapshot(round.roomId, actorId);

		if (participation.viewerRole === null) {
			throw new ApplicationError(APPLICATION_ERROR_CODE.RESOURCE_NOT_FOUND, "Room not found");
		}
	}

	const clock = deps.clock ?? systemClock;
	const effective = effectiveRoundStatus(round, clock.now());
	const revealed = areVoteTotalsRevealed(effective, isHost);
	const viewerVote = actorId
		? ((await deps.votes.findByRoundAndVoter(roundId, actorId))?.team ?? null)
		: null;

	const counts = revealed ? await deps.votes.counts(roundId) : EMPTY_COUNTS;

	return toVoteSummary(roundId, counts, revealed, viewerVote);
};
