import { ROUND_STATUS, ROOM_STATUS, TEAM_SIDE, type TeamSide } from "@app/shared";
import { describe, expect, it } from "vitest";
import type {
	RoomPatch,
	RoomRecord,
	RoomRepository,
	RoomWithHost,
} from "#/modules/debate-room/application/ports/room-repository.ts";
import type {
	MembershipRepository,
	MembershipWithUser,
} from "#/modules/membership/application/ports/membership-repository.ts";
import type {
	RoundRecord,
	RoundRepository,
	RoundSummaryRecord,
} from "../ports/round-repository.ts";
import type { SubmissionRepository, SubmissionWithAuthor } from "../ports/submission-repository.ts";
import { advanceRound } from "./advance-round.ts";
import { createSubmission } from "./create-submission.ts";
import { listRounds } from "./list-rounds.ts";
import { listSubmissions } from "./list-submissions.ts";
import { startDebate } from "./start-debate.ts";

const CONTENT = "x".repeat(60);
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

const roomWith = (overrides: Partial<RoomRecord> = {}): RoomWithHost => ({
	room: {
		id: "room-1",
		hostId: HOST_ID,
		title: "Climate debate",
		motion: "This house would ban fossil fuels",
		description: null,
		status: ROOM_STATUS.PUBLISHED,
		teamSize: 1,
		roundCount: 2,
		submissionDurationMinutes: 30,
		votingDurationMinutes: 30,
		spectatorVotingEnabled: true,
		publishedAt: new Date("2026-03-30T00:00:00.000Z"),
		cancelledAt: null,
		assignmentFinalizedAt: new Date("2026-03-30T00:00:00.000Z"),
		createdAt: new Date("2026-03-29T00:00:00.000Z"),
		updatedAt: new Date("2026-03-29T00:00:00.000Z"),
		...overrides,
	},
	host: { id: HOST_ID, displayName: "Host", username: "host" },
});

const roundRecord = (
	roundNumber: number,
	status: (typeof ROUND_STATUS)[keyof typeof ROUND_STATUS],
	submissionDeadline: Date | null,
	submissionCount = 0,
): RoundSummaryRecord => ({
	round: {
		id: `round-${roundNumber}`,
		roomId: "room-1",
		roundNumber,
		status,
		opensAt: status === ROUND_STATUS.PENDING ? null : new Date("2026-04-01T09:00:00.000Z"),
		submissionDeadline,
		createdAt: new Date("2026-04-01T09:00:00.000Z"),
		updatedAt: new Date("2026-04-01T09:00:00.000Z"),
	},
	submissionCount,
});

const participant = (id: string, team: TeamSide | null): MembershipWithUser => ({
	membership: {
		id: `membership-${id}`,
		roomId: "room-1",
		userId: id,
		role: "PARTICIPANT",
		team,
		joinedAt: new Date("2026-03-30T00:00:00.000Z"),
	},
	user: {
		id,
		displayName: id,
		username: id,
		avatarUrl: null,
	},
});

const submissionFor = (id: string, authorId: string, team: TeamSide): SubmissionWithAuthor => ({
	submission: {
		id,
		roundId: "round-1",
		roomId: "room-1",
		authorId,
		team,
		content: CONTENT,
		submittedAt: new Date("2026-04-01T09:30:00.000Z"),
	},
	author: { id: authorId, displayName: authorId, username: authorId },
});

const createHarness = (
	options: {
		room?: RoomWithHost;
		rounds?: readonly RoundSummaryRecord[];
		participants?: readonly MembershipWithUser[];
		submissions?: readonly SubmissionWithAuthor[];
		viewerRole?: MembershipWithUser["membership"]["role"] | null;
	} = {},
) => {
	const room = options.room ?? roomWith();
	const rounds: Array<{ round: RoundRecord; submissionCount: number }> = (options.rounds ?? []).map(
		(entry) => ({ round: entry.round, submissionCount: entry.submissionCount }),
	);
	const participants = [
		...(options.participants ?? [
			participant("user-1", TEAM_SIDE.PRO),
			participant("user-2", TEAM_SIDE.CONTRA),
		]),
	];
	const submissions = [...(options.submissions ?? [])];
	const roomUpdates: RoomPatch[] = [];
	let currentRoom = room;
	let counter = 0;
	const { clock, setNow } = createClock("2026-04-01T10:00:00.000Z");

	const rooms: RoomRepository = {
		create: async () => {
			throw new Error("not used");
		},
		findById: async (id) => (id === currentRoom.room.id ? currentRoom : null),
		list: async () => ({ items: [], nextCursor: null }),
		update: async (_id, patch) => {
			roomUpdates.push(patch);
			currentRoom = { ...currentRoom, room: { ...currentRoom.room, ...patch } };
			return currentRoom;
		},
	};

	const membershipRepo: MembershipRepository = {
		join: async () => {
			throw new Error("not used");
		},
		leave: async () => true,
		list: async () => ({ items: participants, nextCursor: null }),
		findById: async (id) => participants.find((entry) => entry.membership.id === id) ?? null,
		listParticipants: async () => participants,
		updateTeam: async () => {
			throw new Error("not used");
		},
		assignTeams: async () => {},
	};

	const roundRepo: RoundRepository = {
		listByRoom: async () => [...rounds].sort((a, b) => a.round.roundNumber - b.round.roundNumber),
		findById: async (id) => rounds.find((entry) => entry.round.id === id)?.round ?? null,
		createMany: async (created) => {
			for (const round of created) {
				rounds.push({
					round: { ...round, updatedAt: round.createdAt },
					submissionCount: 0,
				});
			}
		},
		update: async (id, patch) => {
			const entry = rounds.find((item) => item.round.id === id);

			if (!entry) {
				throw new Error("round missing");
			}

			entry.round = { ...entry.round, ...patch };
			return entry.round;
		},
	};

	const submissionRepo: SubmissionRepository = {
		create: async (input) => {
			const created: SubmissionWithAuthor = {
				submission: {
					id: input.id,
					roundId: input.roundId,
					roomId: input.roomId,
					authorId: input.authorId,
					team: input.team,
					content: input.content,
					submittedAt: input.submittedAt,
				},
				author: {
					id: input.authorId,
					displayName: input.authorId,
					username: input.authorId,
				},
			};

			submissions.push(created);
			return created;
		},
		findByRoundAndAuthor: async (roundId, authorId) =>
			submissions.find(
				(entry) => entry.submission.roundId === roundId && entry.submission.authorId === authorId,
			) ?? null,
		listByRound: async (roundId, authorId) =>
			submissions.filter(
				(entry) =>
					entry.submission.roundId === roundId &&
					(!authorId || entry.submission.authorId === authorId),
			),
		countByRound: async (roundId) =>
			submissions.filter((entry) => entry.submission.roundId === roundId).length,
	};

	return {
		deps: {
			rooms,
			rounds: roundRepo,
			memberships: membershipRepo,
			submissions: submissionRepo,
			participation: {
				snapshot: async () => ({
					participantCount: participants.length,
					spectatorCount: 0,
					viewerRole: options.viewerRole ?? null,
					proCount: participants.filter((entry) => entry.membership.team === TEAM_SIDE.PRO).length,
					contraCount: participants.filter((entry) => entry.membership.team === TEAM_SIDE.CONTRA)
						.length,
				}),
			},
			clock,
			generateId: () => `generated-${++counter}`,
		},
		roomUpdates,
		rounds,
		submissions,
		setNow,
	};
};

describe("debate execution use cases", () => {
	it("starts a debate with the first round open", async () => {
		const harness = createHarness();

		const result = await startDebate(harness.deps, HOST_ID, "room-1");

		expect(result.items).toHaveLength(2);
		expect(result.items[0]).toMatchObject({
			roundNumber: 1,
			status: ROUND_STATUS.OPEN,
			submissionDeadline: "2026-04-01T10:30:00.000Z",
		});
		expect(result.items[1]?.status).toBe(ROUND_STATUS.PENDING);
		expect(harness.roomUpdates[0]?.status).toBe(ROOM_STATUS.IN_PROGRESS);
	});

	it("requires finalized teams before starting", async () => {
		const harness = createHarness({
			room: roomWith({ assignmentFinalizedAt: null }),
		});

		await expect(startDebate(harness.deps, HOST_ID, "room-1")).rejects.toMatchObject({
			code: "ROOM_NOT_READY",
		});
	});

	it("only lets the host start the debate", async () => {
		const harness = createHarness();

		await expect(startDebate(harness.deps, "user-1", "room-1")).rejects.toMatchObject({
			code: "AUTHORIZATION_DENIED",
		});
	});

	it("advances to the next round when everyone submitted", async () => {
		const harness = createHarness({
			room: roomWith({ status: ROOM_STATUS.IN_PROGRESS }),
			rounds: [
				roundRecord(1, ROUND_STATUS.OPEN, new Date("2026-04-01T11:00:00.000Z"), 2),
				roundRecord(2, ROUND_STATUS.PENDING, null),
			],
		});

		const result = await advanceRound(harness.deps, HOST_ID, "room-1");

		expect(result.items[0]?.status).toBe(ROUND_STATUS.CLOSED);
		expect(result.items[1]?.status).toBe(ROUND_STATUS.OPEN);
		expect(result.items[1]?.submissionDeadline).toBe("2026-04-01T10:30:00.000Z");
	});

	it("refuses to advance while submissions are missing", async () => {
		const harness = createHarness({
			room: roomWith({ status: ROOM_STATUS.IN_PROGRESS }),
			rounds: [
				roundRecord(1, ROUND_STATUS.OPEN, new Date("2026-04-01T11:00:00.000Z"), 1),
				roundRecord(2, ROUND_STATUS.PENDING, null),
			],
		});

		await expect(advanceRound(harness.deps, HOST_ID, "room-1")).rejects.toMatchObject({
			code: "INVALID_ROUND_STATE",
		});
	});

	it("accepts a submission from an assigned participant", async () => {
		const harness = createHarness({
			room: roomWith({ status: ROOM_STATUS.IN_PROGRESS }),
			rounds: [roundRecord(1, ROUND_STATUS.OPEN, new Date("2026-04-01T11:00:00.000Z"))],
		});

		const submission = await createSubmission(harness.deps, "user-1", {
			roundId: "round-1",
			content: CONTENT,
		});

		expect(submission.team).toBe(TEAM_SIDE.PRO);
		expect(submission.author.displayName).toBe("user-1");
	});

	it("rejects duplicate submissions", async () => {
		const harness = createHarness({
			room: roomWith({ status: ROOM_STATUS.IN_PROGRESS }),
			rounds: [roundRecord(1, ROUND_STATUS.OPEN, new Date("2026-04-01T11:00:00.000Z"))],
			submissions: [submissionFor("submission-1", "user-1", TEAM_SIDE.PRO)],
		});

		await expect(
			createSubmission(harness.deps, "user-1", {
				roundId: "round-1",
				content: CONTENT,
			}),
		).rejects.toMatchObject({ code: "SUBMISSION_ALREADY_EXISTS" });
	});

	it("rejects submissions after the deadline", async () => {
		const harness = createHarness({
			room: roomWith({ status: ROOM_STATUS.IN_PROGRESS }),
			rounds: [roundRecord(1, ROUND_STATUS.OPEN, new Date("2026-04-01T10:30:00.000Z"))],
		});
		harness.setNow("2026-04-01T10:31:00.000Z");

		await expect(
			createSubmission(harness.deps, "user-1", {
				roundId: "round-1",
				content: CONTENT,
			}),
		).rejects.toMatchObject({ code: "SUBMISSION_DEADLINE_PASSED" });
	});

	it("rejects unassigned participants and non-participants", async () => {
		const harness = createHarness({
			room: roomWith({ status: ROOM_STATUS.IN_PROGRESS }),
			rounds: [roundRecord(1, ROUND_STATUS.OPEN, new Date("2026-04-01T11:00:00.000Z"))],
			participants: [participant("user-1", null)],
		});

		await expect(
			createSubmission(harness.deps, "user-1", {
				roundId: "round-1",
				content: CONTENT,
			}),
		).rejects.toMatchObject({ code: "INVALID_MEMBERSHIP" });

		await expect(
			createSubmission(harness.deps, "user-9", {
				roundId: "round-1",
				content: CONTENT,
			}),
		).rejects.toMatchObject({ code: "AUTHORIZATION_DENIED" });
	});

	it("hides open-round submissions from anonymous users and other participants", async () => {
		const harness = createHarness({
			room: roomWith({ status: ROOM_STATUS.IN_PROGRESS }),
			rounds: [roundRecord(1, ROUND_STATUS.OPEN, new Date("2026-04-01T11:00:00.000Z"), 2)],
			submissions: [
				submissionFor("submission-1", "user-1", TEAM_SIDE.PRO),
				submissionFor("submission-2", "user-2", TEAM_SIDE.CONTRA),
			],
		});

		const anonymous = await listSubmissions(harness.deps, null, "round-1");
		expect(anonymous.items).toHaveLength(0);

		const own = await listSubmissions(harness.deps, "user-1", "round-1");
		expect(own.items.map((item) => item.authorId)).toEqual(["user-1"]);

		const host = await listSubmissions(harness.deps, HOST_ID, "round-1");
		expect(host.items).toHaveLength(2);
	});

	it("reveals submissions once the round is closed", async () => {
		const harness = createHarness({
			room: roomWith({ status: ROOM_STATUS.IN_PROGRESS }),
			rounds: [roundRecord(1, ROUND_STATUS.OPEN, new Date("2026-04-01T10:30:00.000Z"), 2)],
			submissions: [
				submissionFor("submission-1", "user-1", TEAM_SIDE.PRO),
				submissionFor("submission-2", "user-2", TEAM_SIDE.CONTRA),
			],
		});
		harness.setNow("2026-04-01T10:31:00.000Z");

		const result = await listSubmissions(harness.deps, null, "round-1");
		expect(result.items).toHaveLength(2);
	});

	it("lists rounds with an effective closed status after the deadline", async () => {
		const harness = createHarness({
			room: roomWith({ status: ROOM_STATUS.IN_PROGRESS }),
			rounds: [roundRecord(1, ROUND_STATUS.OPEN, new Date("2026-04-01T10:30:00.000Z"))],
		});
		harness.setNow("2026-04-01T10:31:00.000Z");

		const result = await listRounds(harness.deps, null, "room-1");
		expect(result.items[0]?.status).toBe(ROUND_STATUS.CLOSED);
	});
});
