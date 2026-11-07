import type { Room } from "@app/api-contract";
import { type Clock, ROOM_STATUS, systemClock } from "@app/shared";
import { assertRoomEditable, assertRoomReady, assertRoomTransition } from "../../domain/room.ts";
import { toRoomDto } from "../mappers/room-mapper.ts";
import type { RoomRepository } from "../ports/room-repository.ts";
import { assertRoomHost, loadRoom } from "../room-access.ts";

export type PublishRoomDeps = {
	readonly repository: RoomRepository;
	readonly clock?: Clock;
};

export const publishRoom = async (
	deps: PublishRoomDeps,
	actorId: string,
	roomId: string,
): Promise<Room> => {
	const found = await loadRoom(deps.repository, roomId);
	assertRoomHost(found, actorId);
	assertRoomEditable(found.room.status);
	assertRoomTransition(found.room.status, ROOM_STATUS.PUBLISHED);
	assertRoomReady(found.room);

	const clock = deps.clock ?? systemClock;
	const now = clock.now();

	const updated = await deps.repository.update(roomId, {
		status: ROOM_STATUS.PUBLISHED,
		publishedAt: now,
		updatedAt: now,
	});

	return toRoomDto(updated, actorId);
};
