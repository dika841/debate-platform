import type { MembershipWithUser } from "#/modules/membership/application/ports/membership-repository.ts";
import { fixedClock, ROOM_STATUS, TEAM_SIDE, type TeamSide } from "@app/shared";
import { describe, expect, it } from "vitest";
import type {
	RoomPatch,
	RoomRepository,
	RoomWithHost,
} from "#/modules/debate-room/application/ports/room-repository.ts";
import type {
	MembershipRepository,
	TeamAssignment,
} from "#/modules/membership/application/ports/membership-repository.ts";
import { autoAssignTeams } from "./auto-assign-teams.ts";
import { finalizeAssignments } from "./finalize-assignments.ts";
import { setTeam } from "./set-team.ts";

const CLOCK = fixedClock("2026-03-01T12:00:00.000Z");

const roomWith = (
	status: (typeof ROOM_STATUS)[keyof typeof ROOM_STATUS] = ROOM_STATUS.PUBLISHED,
	assignmentFinalizedAt: Date | null = null,
): RoomWithHost => ({
	room: {
		id: "room-1",
		hostId: "host-1",
		title: "Climate debate",
		motion: "This house would ban fossil fuels",
		description: null,
		status,
		teamSize: 2,
		roundCount: 3,
		submissionDurationMinutes: 30,
		votingDurationMinutes: 30,
		spectatorVotingEnabled: true,
		publishedAt: null,
		cancelledAt: null,
		assignmentFinalizedAt,
		createdAt: new Date("2026-01-01T00:00:00.000Z"),
		updatedAt: new Date("2026-01-01T00:00:00.000Z"),
	},
	host: { id: "host-1", displayName: "Host", username: "host_user" },
});

const participant = (id: string, team: TeamSide | null): MembershipWithUser => ({
	membership: {
		id,
		roomId: "room-1",
		userId: id,
		role: "PARTICIPANT",
		team,
		joinedAt: new Date("2026-02-01T00:00:00.000Z"),
	},
	user: {
		id,
		displayName: id,
		username: id,
		avatarUrl: null,
	},
});

const createHarness = (participants: MembershipWithUser[], room = roomWith()) => {
	const updates: RoomPatch[] = [];
	let currentRoom = room;
	let currentParticipants = [...participants];
	const assignments: (readonly TeamAssignment[])[] = [];

	const rooms: RoomRepository = {
		create: async () => {
			throw new Error("not used");
		},
		findById: async (id) => (id === currentRoom.room.id ? currentRoom : null),
		list: async () => ({ items: [], nextCursor: null }),
		update: async (_id, patch) => {
			updates.push(patch);
			currentRoom = { ...currentRoom, room: { ...currentRoom.room, ...patch } };
			return currentRoom;
		},
	};

	const memberships: MembershipRepository = {
		join: async () => {
			throw new Error("not used");
		},
		leave: async () => true,
		list: async () => ({ items: currentParticipants, nextCursor: null }),
		findById: async (id) => currentParticipants.find((item) => item.membership.id === id) ?? null,
		findByRoomAndUser: async (_roomId, userId) =>
			currentParticipants.find((item) => item.membership.userId === userId) ?? null,
		listParticipants: async () => currentParticipants,
		updateTeam: async (id, team) => {
			currentParticipants = currentParticipants.map((item) =>
				item.membership.id === id ? { ...item, membership: { ...item.membership, team } } : item,
			);
			const updated = currentParticipants.find((item) => item.membership.id === id);

			if (!updated) {
				throw new Error("missing");
			}

			return updated;
		},
		assignTeams: async (plan) => {
			assignments.push(plan);
			for (const assignment of plan) {
				currentParticipants = currentParticipants.map((item) =>
					item.membership.id === assignment.membershipId
						? { ...item, membership: { ...item.membership, team: assignment.team } }
						: item,
				);
			}
		},
	};

	return {
		deps: { rooms, memberships, clock: CLOCK },
		get assignments() {
			return assignments;
		},
		get updates() {
			return updates;
		},
	};
};

describe("team assignment use cases", () => {
	it("auto-assigns unassigned participants in a balanced way", async () => {
		const harness = createHarness([
			participant("a", null),
			participant("b", null),
			participant("c", null),
			participant("d", null),
		]);

		const summary = await autoAssignTeams(harness.deps, "host-1", "room-1");

		expect(summary.assigned).toBe(4);
		expect(summary.proCount).toBe(2);
		expect(summary.contraCount).toBe(2);
		expect(harness.assignments[0]?.map((assignment) => assignment.team)).toEqual([
			TEAM_SIDE.PRO,
			TEAM_SIDE.CONTRA,
			TEAM_SIDE.PRO,
			TEAM_SIDE.CONTRA,
		]);
	});

	it("only allows the host to auto-assign", async () => {
		const harness = createHarness([participant("a", null)]);

		await expect(autoAssignTeams(harness.deps, "intruder", "room-1")).rejects.toMatchObject({
			code: "AUTHORIZATION_DENIED",
		});
	});

	it("moves a participant to a team when a slot exists", async () => {
		const harness = createHarness([participant("a", null), participant("b", null)]);

		const updated = await setTeam(harness.deps, "host-1", {
			roomId: "room-1",
			membershipId: "a",
			team: TEAM_SIDE.PRO,
		});

		expect(updated.team).toBe(TEAM_SIDE.PRO);
	});

	it("rejects filling a team beyond its size", async () => {
		const harness = createHarness([
			participant("a", TEAM_SIDE.PRO),
			participant("b", TEAM_SIDE.PRO),
			participant("c", null),
		]);

		await expect(
			setTeam(harness.deps, "host-1", {
				roomId: "room-1",
				membershipId: "c",
				team: TEAM_SIDE.PRO,
			}),
		).rejects.toMatchObject({ code: "UNBALANCED_TEAM_ASSIGNMENT" });
	});

	it("requires full teams before finalizing", async () => {
		const harness = createHarness([
			participant("a", TEAM_SIDE.PRO),
			participant("b", TEAM_SIDE.CONTRA),
		]);

		await expect(finalizeAssignments(harness.deps, "host-1", "room-1")).rejects.toMatchObject({
			code: "ROOM_NOT_READY",
		});
	});

	it("finalizes balanced full teams", async () => {
		const harness = createHarness([
			participant("a", TEAM_SIDE.PRO),
			participant("b", TEAM_SIDE.PRO),
			participant("c", TEAM_SIDE.CONTRA),
			participant("d", TEAM_SIDE.CONTRA),
		]);

		const summary = await finalizeAssignments(harness.deps, "host-1", "room-1");

		expect(summary.finalizedAt).toBe("2026-03-01T12:00:00.000Z");
		expect(harness.updates).toHaveLength(1);
		expect(harness.updates[0]?.assignmentFinalizedAt).toEqual(CLOCK.now());
	});

	it("rejects changes after finalization", async () => {
		const harness = createHarness(
			[participant("a", TEAM_SIDE.PRO)],
			roomWith(ROOM_STATUS.PUBLISHED, new Date("2026-02-01T00:00:00.000Z")),
		);

		await expect(
			setTeam(harness.deps, "host-1", {
				roomId: "room-1",
				membershipId: "a",
				team: TEAM_SIDE.CONTRA,
			}),
		).rejects.toMatchObject({ code: "ASSIGNMENT_ALREADY_FINALIZED" });
	});
});
