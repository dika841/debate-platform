import type { RoomResult } from "@app/api-contract";
import {
	type Clock,
	DOMAIN_ERROR_CODE,
	DomainError,
	ROOM_STATUS,
	ROUND_STATUS,
	systemClock,
} from "@app/shared";
import { effectiveRoundStatus } from "#/modules/debate-execution/domain/round.ts";
import type { RoundRepository } from "#/modules/debate-execution/application/ports/round-repository.ts";
import type { RoomRepository } from "#/modules/debate-room/application/ports/room-repository.ts";
import { assertRoomHost, loadRoom } from "#/modules/debate-room/application/room-access.ts";
import { assertResultNotFinalized, computeRoomOutcome } from "../../domain/result.ts";
import { toRoomResultDto } from "../mappers/result-mapper.ts";
import type { ResultRepository } from "../ports/result-repository.ts";

export type FinalizeRoomDeps = {
	readonly rooms: RoomRepository;
	readonly rounds: RoundRepository;
	readonly results: ResultRepository;
	readonly clock?: Clock;
	readonly generateId?: () => string;
};

export const finalizeRoom = async (
	deps: FinalizeRoomDeps,
	actorId: string,
	roomId: string,
): Promise<RoomResult> => {
	const found = await loadRoom(deps.rooms, roomId);
	assertRoomHost(found, actorId);

	if (found.room.status !== ROOM_STATUS.IN_PROGRESS) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.INVALID_ROOM_STATE,
			"Only in-progress debates can be finalized",
		);
	}

	const clock = deps.clock ?? systemClock;
	const now = clock.now();
	const rounds = await deps.rounds.listByRoom(roomId);

	if (rounds.length === 0) {
		throw new DomainError(DOMAIN_ERROR_CODE.ROOM_NOT_READY, "The debate has no rounds");
	}

	if (rounds.some((summary) => effectiveRoundStatus(summary.round, now) !== ROUND_STATUS.CLOSED)) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.ROOM_NOT_READY,
			"All rounds must be closed before finalizing the debate",
		);
	}

	const roundResults = await deps.results.listRoundResults(roomId);

	if (roundResults.length < rounds.length) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.ROOM_NOT_READY,
			"Finalize every round result before finalizing the debate",
		);
	}

	const existing = await deps.results.findRoomResult(roomId);
	assertResultNotFinalized(existing !== null);

	const summary = computeRoomOutcome(roundResults.map((result) => result.outcome));
	const generateId = deps.generateId ?? (() => crypto.randomUUID());

	const saved = await deps.results.saveRoomResult({
		id: generateId(),
		roomId,
		outcome: summary.outcome,
		proWins: summary.proWins,
		contraWins: summary.contraWins,
		draws: summary.draws,
		finalizedById: actorId,
		finalizedAt: now,
	});

	await deps.rooms.update(roomId, {
		status: ROOM_STATUS.COMPLETED,
		updatedAt: now,
	});

	return toRoomResultDto(saved);
};
