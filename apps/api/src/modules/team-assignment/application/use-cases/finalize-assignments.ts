import type { AssignmentSummary } from "@app/api-contract";
import { type Clock, systemClock } from "@app/shared";
import type { RoomRepository } from "#/modules/debate-room/application/ports/room-repository.ts";
import { assertRoomHost, loadRoom } from "#/modules/debate-room/application/room-access.ts";
import type { MembershipRepository } from "#/modules/membership/application/ports/membership-repository.ts";
import {
	assertAssignmentEditable,
	assertTeamsReadyForFinalization,
	countTeams,
} from "../../domain/assignment.ts";
import { toAssignmentSummary } from "../mappers/assignment-mapper.ts";

export type FinalizeAssignmentsDeps = {
	readonly rooms: RoomRepository;
	readonly memberships: MembershipRepository;
	readonly clock?: Clock;
};

export const finalizeAssignments = async (
	deps: FinalizeAssignmentsDeps,
	actorId: string,
	roomId: string,
): Promise<AssignmentSummary> => {
	const found = await loadRoom(deps.rooms, roomId);
	assertRoomHost(found, actorId);
	assertAssignmentEditable(found.room.status, found.room.assignmentFinalizedAt);

	const participants = await deps.memberships.listParticipants(roomId);
	const counts = countTeams(participants.map((participant) => participant.membership));
	assertTeamsReadyForFinalization(counts, found.room.teamSize);

	const clock = deps.clock ?? systemClock;
	const now = clock.now();

	await deps.rooms.update(roomId, {
		assignmentFinalizedAt: now,
		updatedAt: now,
	});

	return toAssignmentSummary(counts, 0, now);
};
