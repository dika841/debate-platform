import type { Room } from "@app/api-contract";
import { APPLICATION_ERROR_CODE, ApplicationError, isPublicRoomStatus } from "@app/shared";
import { toRoomDto } from "../mappers/room-mapper.ts";
import { loadRoom } from "../room-access.ts";
import type { RoomRepository } from "../ports/room-repository.ts";

export type GetRoomDeps = {
	readonly repository: RoomRepository;
};

export const getRoom = async (
	deps: GetRoomDeps,
	roomId: string,
	actorId: string | null,
): Promise<Room> => {
	const found = await loadRoom(deps.repository, roomId);

	const visibleToActor = found.room.hostId === actorId;
	if (!isPublicRoomStatus(found.room.status) && !visibleToActor) {
		throw new ApplicationError(APPLICATION_ERROR_CODE.RESOURCE_NOT_FOUND, "Room not found");
	}

	return toRoomDto(found, actorId);
};
