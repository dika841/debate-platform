import { describe, expect, it } from "vitest";
import { castVoteInputSchema, voteSummarySchema } from "./voting.ts";

describe("voting contract", () => {
	it("accepts a vote input", () => {
		const parsed = castVoteInputSchema.parse({ roundId: "round-1", team: "PRO" });
		expect(parsed.team).toBe("PRO");
	});

	it("rejects unknown teams", () => {
		expect(() => castVoteInputSchema.parse({ roundId: "round-1", team: "NEUTRAL" })).toThrow();
	});

	it("accepts a hidden summary with a viewer vote", () => {
		const parsed = voteSummarySchema.parse({
			roundId: "round-1",
			revealed: false,
			proCount: 0,
			contraCount: 0,
			totalCount: 0,
			viewerVote: "CONTRA",
		});

		expect(parsed.revealed).toBe(false);
		expect(parsed.viewerVote).toBe("CONTRA");
	});
});
