import {
	DOMAIN_ERROR_CODE,
	DomainError,
	ROOM_STATUS,
	TEAM_SIDE,
	type RoomStatus,
	type TeamSide,
} from "@app/shared";

export type TeamCounts = Record<TeamSide, number>;

export type PlannedAssignment = {
	readonly membershipId: string;
	readonly team: TeamSide;
};

export const emptyTeamCounts = (): TeamCounts => ({
	[TEAM_SIDE.PRO]: 0,
	[TEAM_SIDE.CONTRA]: 0,
});

export const countTeams = (
	participants: readonly { readonly team: TeamSide | null }[],
): TeamCounts => {
	const counts = emptyTeamCounts();

	for (const participant of participants) {
		if (participant.team !== null) {
			counts[participant.team] += 1;
		}
	}

	return counts;
};

export const assertAssignmentEditable = (
	status: RoomStatus,
	assignmentFinalizedAt: Date | null,
): void => {
	if (assignmentFinalizedAt !== null) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.ASSIGNMENT_ALREADY_FINALIZED,
			"Team assignment is already finalized",
		);
	}

	if (status !== ROOM_STATUS.PUBLISHED) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.ROOM_NOT_READY,
			"Teams can only be assigned while the room is published",
		);
	}
};

export const assertTeamHasSlot = (team: TeamSide, current: number, teamSize: number): void => {
	if (current >= teamSize) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.UNBALANCED_TEAM_ASSIGNMENT,
			`Team ${team} already has ${teamSize} participants`,
		);
	}
};

export const assertTeamsReadyForFinalization = (counts: TeamCounts, teamSize: number): void => {
	const total = counts[TEAM_SIDE.PRO] + counts[TEAM_SIDE.CONTRA];

	if (total < teamSize * 2) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.ROOM_NOT_READY,
			"Both teams must be full before finalizing",
		);
	}

	if (counts[TEAM_SIDE.PRO] !== counts[TEAM_SIDE.CONTRA]) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.UNBALANCED_TEAM_ASSIGNMENT,
			"Both teams must have the same number of participants",
		);
	}
};

/**
 * Greedily assigns unassigned participants to the team with fewer members,
 * respecting each team's capacity. Odd participant counts leave one team with
 * an extra member, which finalization rejects.
 */
export const planBalancedTeams = (
	unassignedMembershipIds: readonly string[],
	counts: TeamCounts,
	teamSize: number,
): readonly PlannedAssignment[] => {
	const next: TeamCounts = { ...counts };
	const plan: PlannedAssignment[] = [];

	for (const membershipId of unassignedMembershipIds) {
		const proSlots = teamSize - next[TEAM_SIDE.PRO];
		const contraSlots = teamSize - next[TEAM_SIDE.CONTRA];

		if (proSlots <= 0 && contraSlots <= 0) {
			throw new DomainError(
				DOMAIN_ERROR_CODE.PARTICIPANT_CAPACITY_EXCEEDED,
				"Both teams are already full",
			);
		}

		const team: TeamSide =
			next[TEAM_SIDE.PRO] <= next[TEAM_SIDE.CONTRA] && proSlots > 0
				? TEAM_SIDE.PRO
				: TEAM_SIDE.CONTRA;

		next[team] += 1;
		plan.push({ membershipId, team });
	}

	return plan;
};
