import type { Room } from "@app/api-contract";
import { type Clock, ROOM_STATUS, systemClock } from "@app/shared";
import { assertRoomTransition } from "../../domain/room.ts";
import { toRoomDto } from "../mappers/room-mapper.ts";
import type { RoomRepository } from "../ports/room-repository.ts";
import { assertRoomHost, loadRoom } from "../room-access.ts";

export type CancelRoomDeps = {
	readonly repository: RoomRepository;
	readonly clock?: Clock;
};

export const cancelRoom = async (
	deps: CancelRoomDeps,
	actorId: string,
	roomId: string,
): Promise<Room> => {
	const found = await loadRoom(deps.repository, roomId);
	assertRoomHost(found, actorId);
	assertRoomTransition(found.room.status, ROOM_STATUS.CANCELLED);

	const clock = deps.clock ?? systemClock;
	const now = clock.now();

	const updated = await deps.repository.update(roomId, {
		status: ROOM_STATUS.CANCELLED,
		cancelledAt: now,
		updatedAt: now,
	});

	return toRoomDto(updated, actorId);
};
