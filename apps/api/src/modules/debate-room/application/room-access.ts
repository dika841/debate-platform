import { APPLICATION_ERROR_CODE, ApplicationError } from "@app/shared";
import type { RoomRepository, RoomWithHost } from "./ports/room-repository.ts";

export const loadRoom = async (
	repository: RoomRepository,
	roomId: string,
): Promise<RoomWithHost> => {
	const found = await repository.findById(roomId);

	if (!found) {
		throw new ApplicationError(APPLICATION_ERROR_CODE.RESOURCE_NOT_FOUND, "Room not found");
	}

	return found;
};

export const assertRoomHost = (found: RoomWithHost, actorId: string): void => {
	if (found.room.hostId !== actorId) {
		throw new ApplicationError(
			APPLICATION_ERROR_CODE.AUTHORIZATION_DENIED,
			"Only the room host can perform this action",
		);
	}
};
