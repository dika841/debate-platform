import { MEMBERSHIP_ROLE, ROUND_STATUS, ROOM_STATUS, TEAM_SIDE, type TeamSide } from "@app/shared";
import { describe, expect, it } from "vitest";
import type {
	RoundRepository,
	RoundSummaryRecord,
} from "#/modules/debate-execution/application/ports/round-repository.ts";
import type {
	RoomRepository,
	RoomWithHost,
} from "#/modules/debate-room/application/ports/room-repository.ts";
import type {
	MembershipRepository,
	MembershipWithUser,
} from "#/modules/membership/application/ports/membership-repository.ts";
import type { VoteRepository, VoteRecord } from "../ports/vote-repository.ts";
import { castVote } from "./cast-vote.ts";
import { getVoteSummary } from "./get-vote-summary.ts";

const HOST_ID = "host-1";

const createClock = (iso: string) => {
	let current = new Date(iso);

	return {
		clock: { now: () => new Date(current) },
		setNow: (nextIso: string) => {
			current = new Date(nextIso);
		},
	};
};

const roomWith = (overrides: Partial<RoomWithHost["room"]> = {}): RoomWithHost => ({
	room: {
		id: "room-1",
		hostId: HOST_ID,
		title: "Climate debate",
		motion: "This house would ban fossil fuels",
		description: null,
		status: ROOM_STATUS.IN_PROGRESS,
		teamSize: 1,
		roundCount: 1,
		submissionDurationMinutes: 30,
		votingDurationMinutes: 30,
		spectatorVotingEnabled: true,
		publishedAt: new Date("2026-04-01T08:00:00.000Z"),
		cancelledAt: null,
		assignmentFinalizedAt: new Date("2026-04-01T08:30:00.000Z"),
		createdAt: new Date("2026-04-01T07:00:00.000Z"),
		updatedAt: new Date("2026-04-01T07:00:00.000Z"),
		...overrides,
	},
	host: { id: HOST_ID, displayName: "Host", username: "host" },
});

const roundWith = (
	status: (typeof ROUND_STATUS)[keyof typeof ROUND_STATUS] = ROUND_STATUS.VOTING,
	votingDeadline: Date | null = new Date("2026-04-01T12:00:00.000Z"),
): RoundSummaryRecord => ({
	round: {
		id: "round-1",
		roomId: "room-1",
		roundNumber: 1,
		status,
		opensAt: new Date("2026-04-01T10:00:00.000Z"),
		submissionDeadline: new Date("2026-04-01T11:00:00.000Z"),
		votingDeadline,
		createdAt: new Date("2026-04-01T10:00:00.000Z"),
		updatedAt: new Date("2026-04-01T10:00:00.000Z"),
	},
	submissionCount: 2,
});

const membership = (role: MembershipWithUser["membership"]["role"]): MembershipWithUser => ({
	membership: {
		id: "membership-1",
		roomId: "room-1",
		userId: "user-1",
		role,
		team: role === MEMBERSHIP_ROLE.PARTICIPANT ? TEAM_SIDE.PRO : null,
		joinedAt: new Date("2026-04-01T09:00:00.000Z"),
	},
	user: { id: "user-1", displayName: "Member", username: "member", avatarUrl: null },
});

const createHarness = (
	options: {
		room?: RoomWithHost;
		round?: RoundSummaryRecord;
		membership?: MembershipWithUser | null;
		votes?: readonly VoteRecord[];
	} = {},
) => {
	const room = options.room ?? roomWith();
	const round = options.round ?? roundWith();
	const member = options.membership ?? null;
	const votes = [...(options.votes ?? [])];
	const { clock, setNow } = createClock("2026-04-01T11:15:00.000Z");

	const rooms: RoomRepository = {
		create: async () => {
			throw new Error("not used");
		},
		findById: async (id) => (id === room.room.id ? room : null),
		list: async () => ({ items: [], nextCursor: null }),
		update: async () => {
			throw new Error("not used");
		},
	};

	const rounds: RoundRepository = {
		listByRoom: async () => [round],
		findById: async (id) => (id === round.round.id ? round.round : null),
		createMany: async () => {},
		update: async () => {
			throw new Error("not used");
		},
	};

	const memberships: MembershipRepository = {
		join: async () => {
			throw new Error("not used");
		},
		leave: async () => true,
		list: async () => ({ items: [], nextCursor: null }),
		findById: async () => member,
		findByRoomAndUser: async () => member,
		listParticipants: async () => [],
		updateTeam: async () => {
			throw new Error("not used");
		},
		assignTeams: async () => {},
	};

	const voteRepo: VoteRepository = {
		cast: async (input) => {
			const existing = votes.find(
				(vote) => vote.roundId === input.roundId && vote.voterId === input.voterId,
			);

			if (existing) {
				return { kind: "duplicate" };
			}

			const vote: VoteRecord = {
				id: input.id,
				roundId: input.roundId,
				roomId: input.roomId,
				voterId: input.voterId,
				team: input.team,
				castAt: input.castAt,
			};

			votes.push(vote);
			return { kind: "created", vote };
		},
		findByRoundAndVoter: async (roundId, voterId) =>
			votes.find((vote) => vote.roundId === roundId && vote.voterId === voterId) ?? null,
		counts: async (roundId) => {
			const proCount = votes.filter(
				(vote) => vote.roundId === roundId && vote.team === TEAM_SIDE.PRO,
			).length;
			const contraCount = votes.filter(
				(vote) => vote.roundId === roundId && vote.team === TEAM_SIDE.CONTRA,
			).length;

			return { proCount, contraCount, totalCount: proCount + contraCount };
		},
	};

	return {
		deps: {
			rooms,
			rounds,
			memberships,
			votes: voteRepo,
			participation: {
				snapshot: async () => ({
					participantCount: 2,
					spectatorCount: 1,
					viewerRole: member?.membership.role ?? null,
					proCount: 1,
					contraCount: 1,
				}),
			},
			clock,
			generateId: () => "vote-1",
		},
		votes,
		setNow,
	};
};

const voteFor = (voterId: string, team: TeamSide): VoteRecord => ({
	id: `vote-${voterId}`,
	roundId: "round-1",
	roomId: "room-1",
	voterId,
	team,
	castAt: new Date("2026-04-01T11:10:00.000Z"),
});

describe("voting use cases", () => {
	it("lets a spectator vote and keeps totals hidden until close", async () => {
		const harness = createHarness({
			membership: membership(MEMBERSHIP_ROLE.SPECTATOR),
		});

		const summary = await castVote(harness.deps, "user-1", {
			roundId: "round-1",
			team: TEAM_SIDE.PRO,
		});

		expect(summary.viewerVote).toBe(TEAM_SIDE.PRO);
		expect(summary.revealed).toBe(false);
		expect(summary.proCount).toBe(0);
	});

	it("lets the host vote and see live totals", async () => {
		const harness = createHarness();

		const summary = await castVote(harness.deps, HOST_ID, {
			roundId: "round-1",
			team: TEAM_SIDE.CONTRA,
		});

		expect(summary.revealed).toBe(true);
		expect(summary.contraCount).toBe(1);
	});

	it("rejects participants and disabled spectator voting", async () => {
		const participantHarness = createHarness({
			membership: membership(MEMBERSHIP_ROLE.PARTICIPANT),
		});

		await expect(
			castVote(participantHarness.deps, "user-1", {
				roundId: "round-1",
				team: TEAM_SIDE.PRO,
			}),
		).rejects.toMatchObject({ code: "VOTER_NOT_ELIGIBLE" });

		const disabledHarness = createHarness({
			room: roomWith({ spectatorVotingEnabled: false }),
			membership: membership(MEMBERSHIP_ROLE.SPECTATOR),
		});

		await expect(
			castVote(disabledHarness.deps, "user-1", {
				roundId: "round-1",
				team: TEAM_SIDE.PRO,
			}),
		).rejects.toMatchObject({ code: "VOTER_NOT_ELIGIBLE" });
	});

	it("rejects duplicate votes", async () => {
		const harness = createHarness({
			membership: membership(MEMBERSHIP_ROLE.SPECTATOR),
			votes: [voteFor("user-1", TEAM_SIDE.PRO)],
		});

		await expect(
			castVote(harness.deps, "user-1", {
				roundId: "round-1",
				team: TEAM_SIDE.CONTRA,
			}),
		).rejects.toMatchObject({ code: "DUPLICATE_VOTE" });
	});

	it("rejects votes outside the voting phase", async () => {
		const harness = createHarness({
			round: roundWith(ROUND_STATUS.OPEN),
			membership: membership(MEMBERSHIP_ROLE.SPECTATOR),
		});
		harness.setNow("2026-04-01T10:30:00.000Z");

		await expect(
			castVote(harness.deps, "user-1", {
				roundId: "round-1",
				team: TEAM_SIDE.PRO,
			}),
		).rejects.toMatchObject({ code: "INVALID_ROUND_STATE" });
	});

	it("reveals totals after the round closes", async () => {
		const harness = createHarness({
			round: roundWith(ROUND_STATUS.VOTING, new Date("2026-04-01T11:00:00.000Z")),
			votes: [voteFor("user-1", TEAM_SIDE.PRO), voteFor("user-2", TEAM_SIDE.CONTRA)],
		});
		harness.setNow("2026-04-01T11:05:00.000Z");

		const summary = await getVoteSummary(harness.deps, null, "round-1");

		expect(summary.revealed).toBe(true);
		expect(summary.proCount).toBe(1);
		expect(summary.contraCount).toBe(1);
		expect(summary.totalCount).toBe(2);
		expect(summary.viewerVote).toBeNull();
	});

	it("hides totals before close but returns the viewer vote", async () => {
		const harness = createHarness({
			membership: membership(MEMBERSHIP_ROLE.SPECTATOR),
			votes: [voteFor("user-1", TEAM_SIDE.PRO)],
		});

		const summary = await getVoteSummary(harness.deps, "user-1", "round-1");

		expect(summary.revealed).toBe(false);
		expect(summary.totalCount).toBe(0);
		expect(summary.viewerVote).toBe(TEAM_SIDE.PRO);
	});
});
