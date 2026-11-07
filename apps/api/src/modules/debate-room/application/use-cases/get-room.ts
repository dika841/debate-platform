import type { RoomDetail } from "@app/api-contract";
import { APPLICATION_ERROR_CODE, ApplicationError, isPublicRoomStatus } from "@app/shared";
import { toRoomDetailDto } from "../mappers/room-mapper.ts";
import type { RoomParticipationReader } from "../ports/room-participation-reader.ts";
import type { RoomRepository } from "../ports/room-repository.ts";
import { loadRoom } from "../room-access.ts";

export type GetRoomDeps = {
	readonly repository: RoomRepository;
	readonly participation: RoomParticipationReader;
};

export const getRoom = async (
	deps: GetRoomDeps,
	roomId: string,
	actorId: string | null,
): Promise<RoomDetail> => {
	const found = await loadRoom(deps.repository, roomId);
	const participation = await deps.participation.snapshot(roomId, actorId);

	const visibleToActor = found.room.hostId === actorId || participation.viewerRole !== null;
	if (!isPublicRoomStatus(found.room.status) && !visibleToActor) {
		throw new ApplicationError(APPLICATION_ERROR_CODE.RESOURCE_NOT_FOUND, "Room not found");
	}

	return toRoomDetailDto(found, actorId, participation);
};
