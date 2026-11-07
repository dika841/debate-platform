import type { AssignmentSummary } from "@app/api-contract";
import type { Clock } from "@app/shared";
import type { RoomRepository } from "#/modules/debate-room/application/ports/room-repository.ts";
import { assertRoomHost, loadRoom } from "#/modules/debate-room/application/room-access.ts";
import type { MembershipRepository } from "#/modules/membership/application/ports/membership-repository.ts";
import {
	assertAssignmentEditable,
	countTeams,
	planBalancedTeams,
} from "../../domain/assignment.ts";
import { toAssignmentSummary } from "../mappers/assignment-mapper.ts";

export type AssignDeps = {
	readonly rooms: RoomRepository;
	readonly memberships: MembershipRepository;
	readonly clock?: Clock;
};

export const autoAssignTeams = async (
	deps: AssignDeps,
	actorId: string,
	roomId: string,
): Promise<AssignmentSummary> => {
	const found = await loadRoom(deps.rooms, roomId);
	assertRoomHost(found, actorId);
	assertAssignmentEditable(found.room.status, found.room.assignmentFinalizedAt);

	const participants = await deps.memberships.listParticipants(roomId);
	const counts = countTeams(participants.map((participant) => participant.membership));
	const unassigned = participants
		.filter((participant) => participant.membership.team === null)
		.map((participant) => participant.membership.id);

	const plan = planBalancedTeams(unassigned, counts, found.room.teamSize);
	await deps.memberships.assignTeams(plan);

	const nextCounts = { ...counts };
	for (const assignment of plan) {
		nextCounts[assignment.team] += 1;
	}

	return toAssignmentSummary(nextCounts, plan.length, found.room.assignmentFinalizedAt);
};
