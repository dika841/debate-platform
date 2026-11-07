import type { CreateRoomInput, Room } from "@app/api-contract";
import {
	APPLICATION_ERROR_CODE,
	ApplicationError,
	type Clock,
	ROOM_STATUS,
	systemClock,
} from "@app/shared";
import { validateRoomConfiguration } from "../../domain/room.ts";
import { toRoomDto } from "../mappers/room-mapper.ts";
import type { RoomRepository } from "../ports/room-repository.ts";

export type CreateRoomDeps = {
	readonly repository: RoomRepository;
	readonly clock?: Clock;
	readonly generateId?: () => string;
};

export const createRoom = async (
	deps: CreateRoomDeps,
	hostId: string,
	input: CreateRoomInput,
): Promise<Room> => {
	if (!hostId) {
		throw new ApplicationError(
			APPLICATION_ERROR_CODE.AUTHENTICATION_REQUIRED,
			"Authentication required",
		);
	}

	const clock = deps.clock ?? systemClock;
	const generateId = deps.generateId ?? (() => crypto.randomUUID());
	const configuration = validateRoomConfiguration(input);
	const createdAt = clock.now();

	const created = await deps.repository.create({
		id: generateId(),
		hostId,
		configuration,
		status: ROOM_STATUS.DRAFT,
		createdAt,
	});

	return toRoomDto(created, hostId);
};
