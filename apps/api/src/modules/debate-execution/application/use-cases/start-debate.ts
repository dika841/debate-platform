import type { ListRoundsResult } from "@app/api-contract";
import { type Clock, ROOM_STATUS, ROUND_STATUS, systemClock } from "@app/shared";
import type { RoomRepository } from "#/modules/debate-room/application/ports/room-repository.ts";
import { assertRoomHost, loadRoom } from "#/modules/debate-room/application/room-access.ts";
import { assertDebateStartable, submissionDeadlineFor } from "../../domain/round.ts";
import { toRoundDto } from "../mappers/execution-mapper.ts";
import type { NewRoundRecord, RoundRepository } from "../ports/round-repository.ts";

export type StartDebateDeps = {
	readonly rooms: RoomRepository;
	readonly rounds: RoundRepository;
	readonly clock?: Clock;
	readonly generateId?: () => string;
};

export const startDebate = async (
	deps: StartDebateDeps,
	actorId: string,
	roomId: string,
): Promise<ListRoundsResult> => {
	const found = await loadRoom(deps.rooms, roomId);
	assertRoomHost(found, actorId);

	const existing = await deps.rounds.listByRoom(roomId);
	assertDebateStartable(found.room, existing.length);

	const clock = deps.clock ?? systemClock;
	const generateId = deps.generateId ?? (() => crypto.randomUUID());
	const now = clock.now();
	const deadline = submissionDeadlineFor(now, found.room.submissionDurationMinutes);

	const rounds: NewRoundRecord[] = Array.from({ length: found.room.roundCount }, (_, index) => ({
		id: generateId(),
		roomId,
		roundNumber: index + 1,
		status: index === 0 ? ROUND_STATUS.OPEN : ROUND_STATUS.PENDING,
		opensAt: index === 0 ? now : null,
		submissionDeadline: index === 0 ? deadline : null,
		createdAt: now,
	}));

	await deps.rounds.createMany(rounds);
	await deps.rooms.update(roomId, {
		status: ROOM_STATUS.IN_PROGRESS,
		updatedAt: now,
	});

	const created = await deps.rounds.listByRoom(roomId);

	return {
		items: created.map((summary) => toRoundDto(summary, now)),
	};
};
