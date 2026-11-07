import type { RoundResult } from "@app/api-contract";
import {
	APPLICATION_ERROR_CODE,
	ApplicationError,
	type Clock,
	DOMAIN_ERROR_CODE,
	DomainError,
	ROUND_STATUS,
	systemClock,
} from "@app/shared";
import { effectiveRoundStatus } from "#/modules/debate-execution/domain/round.ts";
import type { RoundRepository } from "#/modules/debate-execution/application/ports/round-repository.ts";
import type { VoteRepository } from "#/modules/voting/application/ports/vote-repository.ts";
import type { RoomRepository } from "#/modules/debate-room/application/ports/room-repository.ts";
import { assertRoomHost, loadRoom } from "#/modules/debate-room/application/room-access.ts";
import { assertResultNotFinalized, computeRoundOutcome } from "../../domain/result.ts";
import { toRoundResultDto } from "../mappers/result-mapper.ts";
import type { ResultRepository } from "../ports/result-repository.ts";

export type FinalizeRoundDeps = {
	readonly rooms: RoomRepository;
	readonly rounds: RoundRepository;
	readonly votes: VoteRepository;
	readonly results: ResultRepository;
	readonly clock?: Clock;
	readonly generateId?: () => string;
};

export const finalizeRound = async (
	deps: FinalizeRoundDeps,
	actorId: string,
	roundId: string,
): Promise<RoundResult> => {
	const round = await deps.rounds.findById(roundId);

	if (!round) {
		throw new ApplicationError(APPLICATION_ERROR_CODE.RESOURCE_NOT_FOUND, "Round not found");
	}

	const found = await loadRoom(deps.rooms, round.roomId);
	assertRoomHost(found, actorId);

	const clock = deps.clock ?? systemClock;
	const now = clock.now();

	if (effectiveRoundStatus(round, now) !== ROUND_STATUS.CLOSED) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.INVALID_ROUND_STATE,
			"Voting must be closed before finalizing the round",
		);
	}

	const existing = await deps.results.findRoundResult(roundId);
	assertResultNotFinalized(existing !== null);

	const counts = await deps.votes.counts(roundId);
	const outcome = computeRoundOutcome(counts.proCount, counts.contraCount);
	const generateId = deps.generateId ?? (() => crypto.randomUUID());

	const saved = await deps.results.saveRoundResult({
		id: generateId(),
		roundId,
		roomId: round.roomId,
		outcome,
		proCount: counts.proCount,
		contraCount: counts.contraCount,
		totalVotes: counts.totalCount,
		finalizedById: actorId,
		finalizedAt: now,
	});

	return toRoundResultDto(saved, round.roundNumber);
};
