import { describe, expect, it } from "vitest";
import {
	finalizeRoomInputSchema,
	getRoomResultsOutputSchema,
	roomResultSchema,
	roundResultSchema,
} from "./results.ts";

const roundResult = {
	roundId: "round-1",
	roundNumber: 1,
	outcome: "PRO" as const,
	proCount: 3,
	contraCount: 1,
	totalVotes: 4,
	finalizedAt: "2026-04-01T11:05:00.000Z",
};

describe("results contract", () => {
	it("accepts round and room results", () => {
		expect(roundResultSchema.parse(roundResult).outcome).toBe("PRO");
		expect(
			roomResultSchema.parse({
				roomId: "room-1",
				outcome: "DRAW",
				proWins: 1,
				contraWins: 1,
				draws: 0,
				finalizedAt: "2026-04-01T11:30:00.000Z",
			}).outcome,
		).toBe("DRAW");
	});

	it("accepts the room results payload with pending rounds", () => {
		const parsed = getRoomResultsOutputSchema.parse({
			rounds: [
				{ roundId: "round-1", roundNumber: 1, status: "CLOSED", result: roundResult },
				{ roundId: "round-2", roundNumber: 2, status: "OPEN", result: null },
			],
			roomResult: null,
		});

		expect(parsed.rounds[1]?.result).toBeNull();
	});

	it("requires a room id", () => {
		expect(() => finalizeRoomInputSchema.parse({})).toThrow();
	});
});
