import type { Membership, SetTeamInput } from "@app/api-contract";
import { APPLICATION_ERROR_CODE, ApplicationError, MEMBERSHIP_ROLE } from "@app/shared";
import type { RoomRepository } from "#/modules/debate-room/application/ports/room-repository.ts";
import { assertRoomHost, loadRoom } from "#/modules/debate-room/application/room-access.ts";
import { toMembershipDto } from "#/modules/membership/application/mappers/membership-mapper.ts";
import type { MembershipRepository } from "#/modules/membership/application/ports/membership-repository.ts";
import {
	assertAssignmentEditable,
	assertTeamHasSlot,
	countTeams,
} from "../../domain/assignment.ts";

export type SetTeamDeps = {
	readonly rooms: RoomRepository;
	readonly memberships: MembershipRepository;
};

export const setTeam = async (
	deps: SetTeamDeps,
	actorId: string,
	input: SetTeamInput,
): Promise<Membership> => {
	const found = await loadRoom(deps.rooms, input.roomId);
	assertRoomHost(found, actorId);
	assertAssignmentEditable(found.room.status, found.room.assignmentFinalizedAt);

	const participant = await deps.memberships.findById(input.membershipId);

	if (
		!participant ||
		participant.membership.roomId !== input.roomId ||
		participant.membership.role !== MEMBERSHIP_ROLE.PARTICIPANT
	) {
		throw new ApplicationError(
			APPLICATION_ERROR_CODE.RESOURCE_NOT_FOUND,
			"Participant not found in this room",
		);
	}

	if (input.team !== null && input.team !== participant.membership.team) {
		const participants = await deps.memberships.listParticipants(input.roomId);
		const counts = countTeams(participants.map((participant) => participant.membership));
		assertTeamHasSlot(input.team, counts[input.team], found.room.teamSize);
	}

	const updated = await deps.memberships.updateTeam(input.membershipId, input.team);

	return toMembershipDto(updated);
};
