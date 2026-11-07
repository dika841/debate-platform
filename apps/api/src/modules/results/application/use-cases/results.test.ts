import { RESULT_OUTCOME, ROOM_STATUS, ROUND_STATUS, type ResultOutcome } from "@app/shared";
import { describe, expect, it } from "vitest";
import type {
	RoomPatch,
	RoomWithHost,
} from "#/modules/debate-room/application/ports/room-repository.ts";
import type {
	RoundRepository,
	RoundSummaryRecord,
} from "#/modules/debate-execution/application/ports/round-repository.ts";
import type { VoteRepository } from "#/modules/voting/application/ports/vote-repository.ts";
import type {
	ResultRepository,
	RoomResultRecord,
	RoundResultRecord,
} from "../ports/result-repository.ts";
import { finalizeRoom } from "./finalize-room.ts";
import { finalizeRound } from "./finalize-round.ts";
import { getRoomResults } from "./get-room-results.ts";
import type { RoomRepository } from "#/modules/debate-room/application/ports/room-repository.ts";

const HOST_ID = "host-1";

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
	status: (typeof ROUND_STATUS)[keyof typeof ROUND_STATUS] = ROUND_STATUS.CLOSED,
	roundNumber = 1,
	votingDeadline = new Date("2026-04-01T11:00:00.000Z"),
): RoundSummaryRecord => ({
	round: {
		id: `round-${roundNumber}`,
		roomId: "room-1",
		roundNumber,
		status,
		opensAt: new Date("2026-04-01T10:00:00.000Z"),
		submissionDeadline: new Date("2026-04-01T10:30:00.000Z"),
		votingDeadline,
		createdAt: new Date("2026-04-01T10:00:00.000Z"),
		updatedAt: new Date("2026-04-01T10:00:00.000Z"),
	},
	submissionCount: 2,
});

const roundResult = (outcome: ResultOutcome, id = "result-1"): RoundResultRecord => ({
	id,
	roundId: "round-1",
	roomId: "room-1",
	outcome,
	proCount: 2,
	contraCount: 1,
	totalVotes: 3,
	finalizedById: HOST_ID,
	finalizedAt: new Date("2026-04-01T11:05:00.000Z"),
});

const voteCounts = (proCount: number, contraCount: number) => ({
	proCount,
	contraCount,
	totalCount: proCount + contraCount,
});

const createHarness = (
	options: {
		room?: RoomWithHost;
		rounds?: readonly RoundSummaryRecord[];
		roundResults?: readonly RoundResultRecord[];
		roomResult?: RoomResultRecord | null;
		votes?: { pro: number; contra: number };
	} = {},
) => {
	let currentRoom = options.room ?? roomWith();
	const rounds = [...(options.rounds ?? [roundWith()])];
	const results = [...(options.roundResults ?? [])];
	let currentRoomResult = options.roomResult ?? null;
	const roomUpdates: RoomPatch[] = [];
	const votes = options.votes ?? { pro: 2, contra: 1 };

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

	const roundRepo: RoundRepository = {
		listByRoom: async () => rounds,
		findById: async (id) => rounds.find((entry) => entry.round.id === id)?.round ?? null,
		createMany: async () => {},
		update: async () => {
			throw new Error("not used");
		},
	};

	const voteRepo: VoteRepository = {
		cast: async () => {
			throw new Error("not used");
		},
		findByRoundAndVoter: async () => null,
		counts: async () => voteCounts(votes.pro, votes.contra),
	};

	const resultRepo: ResultRepository = {
		findRoundResult: async (roundId) =>
			results.find((result) => result.roundId === roundId) ?? null,
		listRoundResults: async () => results,
		saveRoundResult: async (input) => {
			const created: RoundResultRecord = {
				...input,
				id: input.id,
				finalizedAt: input.finalizedAt,
			};
			results.push(created);
			return created;
		},
		findRoomResult: async () => currentRoomResult,
		saveRoomResult: async (input) => {
			currentRoomResult = input;
			return input;
		},
	};

	return {
		deps: {
			rooms,
			rounds: roundRepo,
			votes: voteRepo,
			results: resultRepo,
			participation: {
				snapshot: async () => ({
					participantCount: 2,
					spectatorCount: 1,
					viewerRole: null,
					proCount: 1,
					contraCount: 1,
				}),
			},
			clock: { now: () => new Date("2026-04-01T11:05:00.000Z") },
			generateId: () => "generated-1",
		},
		roomUpdates,
		results,
		getRoomResult: () => currentRoomResult,
	};
};

describe("result use cases", () => {
	it("finalizes a closed round from its votes", async () => {
		const harness = createHarness();

		const result = await finalizeRound(harness.deps, HOST_ID, "round-1");

		expect(result.outcome).toBe(RESULT_OUTCOME.PRO);
		expect(result.proCount).toBe(2);
		expect(result.roundNumber).toBe(1);
	});

	it("refuses to finalize a round that is still voting", async () => {
		const harness = createHarness({
			rounds: [roundWith(ROUND_STATUS.VOTING, 1, new Date("2026-04-01T12:00:00.000Z"))],
		});

		await expect(finalizeRound(harness.deps, HOST_ID, "round-1")).rejects.toMatchObject({
			code: "INVALID_ROUND_STATE",
		});
	});

	it("refuses duplicate round finalization and empty votes", async () => {
		const duplicate = createHarness({ roundResults: [roundResult(RESULT_OUTCOME.PRO)] });
		await expect(finalizeRound(duplicate.deps, HOST_ID, "round-1")).rejects.toMatchObject({
			code: "RESULT_ALREADY_FINALIZED",
		});

		const empty = createHarness({ votes: { pro: 0, contra: 0 } });
		await expect(finalizeRound(empty.deps, HOST_ID, "round-1")).rejects.toMatchObject({
			code: "INSUFFICIENT_VOTES",
		});
	});

	it("finalizes the room when every round result exists", async () => {
		const harness = createHarness({
			rounds: [roundWith(ROUND_STATUS.CLOSED, 1), roundWith(ROUND_STATUS.CLOSED, 2)],
			roundResults: [
				roundResult(RESULT_OUTCOME.PRO, "result-1"),
				{ ...roundResult(RESULT_OUTCOME.PRO, "result-2"), roundId: "round-2" },
			],
		});

		const result = await finalizeRoom(harness.deps, HOST_ID, "room-1");

		expect(result.outcome).toBe(RESULT_OUTCOME.PRO);
		expect(result.proWins).toBe(2);
		expect(harness.roomUpdates[0]?.status).toBe(ROOM_STATUS.COMPLETED);
	});

	it("requires closed rounds and finalized round results", async () => {
		const openRound = createHarness({
			rounds: [roundWith(ROUND_STATUS.OPEN)],
		});
		await expect(finalizeRoom(openRound.deps, HOST_ID, "room-1")).rejects.toMatchObject({
			code: "ROOM_NOT_READY",
		});

		const missingResult = createHarness();
		await expect(finalizeRoom(missingResult.deps, HOST_ID, "room-1")).rejects.toMatchObject({
			code: "ROOM_NOT_READY",
		});
	});

	it("exposes round and room results with finalization state", async () => {
		const harness = createHarness({
			roundResults: [roundResult(RESULT_OUTCOME.CONTRA)],
		});

		const results = await getRoomResults(harness.deps, null, "room-1");

		expect(results.rounds[0]?.status).toBe(ROUND_STATUS.CLOSED);
		expect(results.rounds[0]?.result?.outcome).toBe(RESULT_OUTCOME.CONTRA);
		expect(results.roomResult).toBeNull();
	});
});
