import type { ListSubmissionsResult } from "@app/api-contract";
import {
	APPLICATION_ERROR_CODE,
	ApplicationError,
	type Clock,
	isPublicRoomStatus,
	ROUND_STATUS,
	systemClock,
} from "@app/shared";
import type { RoomParticipationReader } from "#/modules/debate-room/application/ports/room-participation-reader.ts";
import type { RoomRepository } from "#/modules/debate-room/application/ports/room-repository.ts";
import { loadRoom } from "#/modules/debate-room/application/room-access.ts";
import { effectiveRoundStatus } from "../../domain/round.ts";
import { toSubmissionDto } from "../mappers/execution-mapper.ts";
import type { RoundRepository } from "../ports/round-repository.ts";
import type { SubmissionRepository } from "../ports/submission-repository.ts";

export type ListSubmissionsDeps = {
	readonly rooms: RoomRepository;
	readonly rounds: RoundRepository;
	readonly submissions: SubmissionRepository;
	readonly participation: RoomParticipationReader;
	readonly clock?: Clock;
};

export const listSubmissions = async (
	deps: ListSubmissionsDeps,
	actorId: string | null,
	roundId: string,
): Promise<ListSubmissionsResult> => {
	const round = await deps.rounds.findById(roundId);

	if (!round) {
		throw new ApplicationError(APPLICATION_ERROR_CODE.RESOURCE_NOT_FOUND, "Round not found");
	}

	const room = await loadRoom(deps.rooms, round.roomId);
	const clock = deps.clock ?? systemClock;
	const now = clock.now();

	if (!isPublicRoomStatus(room.room.status) && room.room.hostId !== actorId) {
		const participation = await deps.participation.snapshot(round.roomId, actorId);

		if (participation.viewerRole === null) {
			throw new ApplicationError(APPLICATION_ERROR_CODE.RESOURCE_NOT_FOUND, "Room not found");
		}
	}

	const closed = effectiveRoundStatus(round, now) === ROUND_STATUS.CLOSED;
	const host = room.room.hostId === actorId;

	if (!closed && actorId === null) {
		return { items: [] };
	}

	const items = await deps.submissions.listByRound(roundId, closed || host ? null : actorId);

	return { items: items.map(toSubmissionDto) };
};
