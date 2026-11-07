import type { Room, UpdateRoomInput } from "@app/api-contract";
import { type Clock, systemClock } from "@app/shared";
import { validateRoomConfiguration } from "../../domain/room.ts";
import { toRoomDto } from "../mappers/room-mapper.ts";
import type { RoomRepository } from "../ports/room-repository.ts";
import { assertRoomHost, loadRoom } from "../room-access.ts";

export type UpdateRoomDeps = {
	readonly repository: RoomRepository;
	readonly clock?: Clock;
};

export const updateRoom = async (
	deps: UpdateRoomDeps,
	actorId: string,
	input: UpdateRoomInput,
): Promise<Room> => {
	const found = await loadRoom(deps.repository, input.id);
	assertRoomHost(found, actorId);

	const current = found.room;
	const configuration = validateRoomConfiguration({
		title: input.title ?? current.title,
		motion: input.motion ?? current.motion,
		description: input.description !== undefined ? input.description : current.description,
		teamSize: input.teamSize ?? current.teamSize,
		roundCount: input.roundCount ?? current.roundCount,
		submissionDurationMinutes: input.submissionDurationMinutes ?? current.submissionDurationMinutes,
		votingDurationMinutes: input.votingDurationMinutes ?? current.votingDurationMinutes,
		spectatorVotingEnabled: input.spectatorVotingEnabled ?? current.spectatorVotingEnabled,
	});

	const clock = deps.clock ?? systemClock;
	const updated = await deps.repository.update(input.id, {
		...configuration,
		updatedAt: clock.now(),
	});

	return toRoomDto(updated, actorId);
};
