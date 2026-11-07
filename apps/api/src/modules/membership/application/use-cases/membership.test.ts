import { APPLICATION_ERROR_CODE, DomainError, fixedClock, ROOM_STATUS } from "@app/shared";
import { describe, expect, it } from "vitest";
import type {
	RoomRepository,
	RoomWithHost,
} from "#/modules/debate-room/application/ports/room-repository.ts";
import type {
	JoinMembershipCommand,
	MembershipRepository,
	MembershipWithUser,
} from "../ports/membership-repository.ts";
import { joinRoom } from "./join-room.ts";
import { leaveRoom } from "./leave-room.ts";
import { listMembers } from "./list-members.ts";

const CLOCK = fixedClock("2026-02-01T09:00:00.000Z");

const hostedRoom = (
	hostId: string,
	status: (typeof ROOM_STATUS)[keyof typeof ROOM_STATUS] = ROOM_STATUS.PUBLISHED,
): RoomWithHost => ({
	room: {
		id: "room-1",
		hostId,
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
		assignmentFinalizedAt: null,
		createdAt: new Date("2026-01-01T00:00:00.000Z"),
		updatedAt: new Date("2026-01-01T00:00:00.000Z"),
	},
	host: { id: hostId, displayName: "Host", username: "host_user" },
});

const roomRepository = (found: RoomWithHost): RoomRepository => ({
	create: async () => {
		throw new Error("not used");
	},
	findById: async (id) => (id === found.room.id ? found : null),
	list: async () => ({ items: [], nextCursor: null }),
	update: async () => {
		throw new Error("not used");
	},
});

const membership: MembershipWithUser = {
	membership: {
		id: "membership-1",
		roomId: "room-1",
		userId: "member-1",
		role: "PARTICIPANT",
		team: null,
		joinedAt: new Date("2026-02-01T09:00:00.000Z"),
	},
	user: {
		id: "member-1",
		displayName: "Member One",
		username: "member_one",
		avatarUrl: null,
	},
};

const membershipRepository = (
	overrides: Partial<MembershipRepository> = {},
): MembershipRepository => ({
	join: async () => ({ kind: "joined", membership }),
	leave: async () => true,
	list: async () => ({ items: [membership], nextCursor: null }),
	findById: async () => membership,
	findByRoomAndUser: async () => membership,
	listParticipants: async () => [membership],
	updateTeam: async (_id, team) => ({
		...membership,
		membership: { ...membership.membership, team },
	}),
	assignTeams: async () => {},
	...overrides,
});

const participation = {
	snapshot: async () => ({
		participantCount: 0,
		spectatorCount: 0,
		viewerRole: null,
		proCount: 0,
		contraCount: 0,
	}),
};

const participantParticipation = {
	snapshot: async () => ({
		participantCount: 1,
		spectatorCount: 0,
		viewerRole: "PARTICIPANT" as const,
		proCount: 1,
		contraCount: 0,
	}),
};

const deps = (found: RoomWithHost, memberships: MembershipRepository = membershipRepository()) => ({
	rooms: roomRepository(found),
	memberships,
	clock: CLOCK,
	generateId: () => "membership-new",
});

describe("membership use cases", () => {
	it("joins an open room as a participant with two-team capacity", async () => {
		let command: JoinMembershipCommand | null = null;

		const result = await joinRoom(
			deps(
				hostedRoom("host-1"),
				membershipRepository({
					join: async (input) => {
						command = input;
						return { kind: "joined", membership };
					},
				}),
			),
			"member-1",
			{ roomId: "room-1", role: "PARTICIPANT" },
		);

		expect(result.role).toBe("PARTICIPANT");
		expect(result.user.displayName).toBe("Member One");
		expect(command).toMatchObject({ capacity: 4, team: null });
	});

	it("joins as a spectator without a capacity limit", async () => {
		let command: JoinMembershipCommand | null = null;

		await joinRoom(
			deps(
				hostedRoom("host-1"),
				membershipRepository({
					join: async (input) => {
						command = input;
						return { kind: "joined", membership };
					},
				}),
			),
			"member-1",
			{ roomId: "room-1", role: "SPECTATOR" },
		);

		expect(command).toMatchObject({ capacity: null });
	});

	it("rejects joining a draft room", async () => {
		await expect(
			joinRoom(deps(hostedRoom("host-1", ROOM_STATUS.DRAFT)), "member-1", {
				roomId: "room-1",
				role: "PARTICIPANT",
			}),
		).rejects.toBeInstanceOf(DomainError);
	});

	it("rejects the host joining their own room", async () => {
		await expect(
			joinRoom(deps(hostedRoom("host-1")), "host-1", {
				roomId: "room-1",
				role: "PARTICIPANT",
			}),
		).rejects.toBeInstanceOf(DomainError);
	});

	it("reports a full room", async () => {
		await expect(
			joinRoom(
				deps(
					hostedRoom("host-1"),
					membershipRepository({
						join: async () => ({ kind: "capacity_exceeded" }),
					}),
				),
				"member-1",
				{ roomId: "room-1", role: "PARTICIPANT" },
			),
		).rejects.toMatchObject({ code: "PARTICIPANT_CAPACITY_EXCEEDED" });
	});

	it("rejects changing role without leaving", async () => {
		await expect(
			joinRoom(
				deps(
					hostedRoom("host-1"),
					membershipRepository({
						join: async () => ({ kind: "role_conflict", membership }),
					}),
				),
				"member-1",
				{ roomId: "room-1", role: "SPECTATOR" },
			),
		).rejects.toBeInstanceOf(DomainError);
	});

	it("lets members leave but not hosts", async () => {
		const memberResult = await leaveRoom(
			{ rooms: roomRepository(hostedRoom("host-1")), memberships: membershipRepository() },
			"member-1",
			"room-1",
		);
		expect(memberResult.left).toBe(true);

		await expect(
			leaveRoom(
				{ rooms: roomRepository(hostedRoom("host-1")), memberships: membershipRepository() },
				"host-1",
				"room-1",
			),
		).rejects.toBeInstanceOf(DomainError);
	});

	it("hides the roster of draft rooms from non-hosts", async () => {
		await expect(
			listMembers(
				{
					rooms: roomRepository(hostedRoom("host-1", ROOM_STATUS.DRAFT)),
					memberships: membershipRepository(),
					participation,
				},
				"member-1",
				{ roomId: "room-1" },
			),
		).rejects.toMatchObject({ code: APPLICATION_ERROR_CODE.RESOURCE_NOT_FOUND });
	});

	it("returns the roster for public rooms and hosts", async () => {
		const publicResult = await listMembers(
			{
				rooms: roomRepository(hostedRoom("host-1")),
				memberships: membershipRepository(),
				participation,
			},
			null,
			{ roomId: "room-1" },
		);
		expect(publicResult.items[0]?.user.displayName).toBe("Member One");

		const hostResult = await listMembers(
			{
				rooms: roomRepository(hostedRoom("host-1", ROOM_STATUS.DRAFT)),
				memberships: membershipRepository(),
				participation,
			},
			"host-1",
			{ roomId: "room-1" },
		);
		expect(hostResult.items).toHaveLength(1);
	});

	it("lets members see the roster of a cancelled room", async () => {
		const result = await listMembers(
			{
				rooms: roomRepository(hostedRoom("host-1", ROOM_STATUS.CANCELLED)),
				memberships: membershipRepository(),
				participation: participantParticipation,
			},
			"member-1",
			{ roomId: "room-1" },
		);

		expect(result.items).toHaveLength(1);
	});
});
