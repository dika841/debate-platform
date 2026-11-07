import { DomainError, ROOM_STATUS, TEAM_SIDE } from "@app/shared";
import { describe, expect, it } from "vitest";
import {
	assertAssignmentEditable,
	assertTeamHasSlot,
	assertTeamsReadyForFinalization,
	countTeams,
	emptyTeamCounts,
	planBalancedTeams,
} from "./assignment.ts";

describe("team assignment domain", () => {
	it("only allows hosts to assign teams in published, unfinalized rooms", () => {
		expect(() => assertAssignmentEditable(ROOM_STATUS.PUBLISHED, null)).not.toThrow();
		expect(() => assertAssignmentEditable(ROOM_STATUS.DRAFT, null)).toThrowError(DomainError);
		expect(() => assertAssignmentEditable(ROOM_STATUS.PUBLISHED, new Date())).toThrowError(
			DomainError,
		);
	});

	it("counts assigned teams", () => {
		expect(
			countTeams([
				{ team: TEAM_SIDE.PRO },
				{ team: TEAM_SIDE.PRO },
				{ team: TEAM_SIDE.CONTRA },
				{ team: null },
			]),
		).toEqual({ PRO: 2, CONTRA: 1 });
	});

	it("balances unassigned participants across teams", () => {
		const plan = planBalancedTeams(["a", "b", "c", "d", "e", "f"], emptyTeamCounts(), 3);

		expect(plan).toEqual([
			{ membershipId: "a", team: TEAM_SIDE.PRO },
			{ membershipId: "b", team: TEAM_SIDE.CONTRA },
			{ membershipId: "c", team: TEAM_SIDE.PRO },
			{ membershipId: "d", team: TEAM_SIDE.CONTRA },
			{ membershipId: "e", team: TEAM_SIDE.PRO },
			{ membershipId: "f", team: TEAM_SIDE.CONTRA },
		]);
	});

	it("fills the team with fewer members first", () => {
		const plan = planBalancedTeams(["a", "b"], { PRO: 1, CONTRA: 0 }, 3);

		expect(plan.map((assignment) => assignment.team)).toEqual([TEAM_SIDE.CONTRA, TEAM_SIDE.PRO]);
	});

	it("rejects assignments once a team is full", () => {
		expect(() => assertTeamHasSlot(TEAM_SIDE.PRO, 2, 3)).not.toThrow();
		expect(() => assertTeamHasSlot(TEAM_SIDE.PRO, 3, 3)).toThrowError(DomainError);
	});

	it("requires both teams to be full and balanced before finalizing", () => {
		expect(() => assertTeamsReadyForFinalization({ PRO: 3, CONTRA: 3 }, 3)).not.toThrow();
		expect(() => assertTeamsReadyForFinalization({ PRO: 2, CONTRA: 2 }, 3)).toThrowError(
			DomainError,
		);
		expect(() => assertTeamsReadyForFinalization({ PRO: 3, CONTRA: 2 }, 3)).toThrowError(
			DomainError,
		);
	});
});
