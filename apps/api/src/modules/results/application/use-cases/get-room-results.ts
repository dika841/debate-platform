import type { RoomResults } from "@app/api-contract";
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
import { toRoomResultDto, toRoundResultDto } from "../mappers/result-mapper.ts";
import type { ResultRepository } from "../ports/result-repository.ts";

export type GetRoomResultsDeps = {
	readonly rooms: RoomRepository;
	readonly rounds: RoundRepository;
	readonly results: ResultRepository;
	readonly participation: RoomParticipationReader;
	readonly clock?: Clock;
};

export const getRoomResults = async (
	deps: GetRoomResultsDeps,
	actorId: string | null,
	roomId: string,
): Promise<RoomResults> => {
	const found = await loadRoom(deps.rooms, roomId);

	if (!isPublicRoomStatus(found.room.status) && found.room.hostId !== actorId) {
		const participation = await deps.participation.snapshot(roomId, actorId);

		if (participation.viewerRole === null) {
			throw new ApplicationError(APPLICATION_ERROR_CODE.RESOURCE_NOT_FOUND, "Room not found");
		}
	}

	const clock = deps.clock ?? systemClock;
	const now = clock.now();
	const rounds = await deps.rounds.listByRoom(roomId);
	const results = await deps.results.listRoundResults(roomId);
	const resultByRound = new Map(results.map((result) => [result.roundId, result] as const));
	const roomResult = await deps.results.findRoomResult(roomId);

	return {
		rounds: rounds.map((summary) => {
			const result = resultByRound.get(summary.round.id);

			return {
				roundId: summary.round.id,
				roundNumber: summary.round.roundNumber,
				status: effectiveRoundStatus(summary.round, now),
				result: result ? toRoundResultDto(result, summary.round.roundNumber) : null,
			};
		}),
		roomResult: roomResult ? toRoomResultDto(roomResult) : null,
	};
};
