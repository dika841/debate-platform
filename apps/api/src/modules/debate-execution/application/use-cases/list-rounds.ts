import type { ListRoundsResult } from "@app/api-contract";
import {
	APPLICATION_ERROR_CODE,
	ApplicationError,
	type Clock,
	isPublicRoomStatus,
	systemClock,
} from "@app/shared";
import type { RoomParticipationReader } from "#/modules/debate-room/application/ports/room-participation-reader.ts";
import type { RoomRepository } from "#/modules/debate-room/application/ports/room-repository.ts";
import { loadRoom } from "#/modules/debate-room/application/room-access.ts";
import { toRoundDto } from "../mappers/execution-mapper.ts";
import type { RoundRepository } from "../ports/round-repository.ts";

export type ListRoundsDeps = {
	readonly rooms: RoomRepository;
	readonly rounds: RoundRepository;
	readonly participation: RoomParticipationReader;
	readonly clock?: Clock;
};

export const listRounds = async (
	deps: ListRoundsDeps,
	actorId: string | null,
	roomId: string,
): Promise<ListRoundsResult> => {
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

	return {
		items: rounds.map((summary) => toRoundDto(summary, now)),
	};
};
