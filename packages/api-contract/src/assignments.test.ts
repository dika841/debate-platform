import { describe, expect, it } from "vitest";
import { assignmentSummarySchema, setTeamInputSchema } from "./assignments.ts";

describe("assignment contract", () => {
	it("accepts an assignment summary", () => {
		const parsed = assignmentSummarySchema.parse({
			assigned: 4,
			proCount: 2,
			contraCount: 2,
			finalizedAt: null,
		});

		expect(parsed.proCount).toBe(2);
	});

	it("accepts clearing a team", () => {
		const parsed = setTeamInputSchema.parse({
			roomId: "room-1",
			membershipId: "membership-1",
			team: null,
		});

		expect(parsed.team).toBeNull();
	});

	it("rejects unknown teams", () => {
		expect(() =>
			setTeamInputSchema.parse({
				roomId: "room-1",
				membershipId: "membership-1",
				team: "NEUTRAL",
			}),
		).toThrow();
	});
});
