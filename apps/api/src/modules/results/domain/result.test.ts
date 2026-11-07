import { DomainError, RESULT_OUTCOME } from "@app/shared";
import { describe, expect, it } from "vitest";
import { assertResultNotFinalized, computeRoomOutcome, computeRoundOutcome } from "./result.ts";

describe("result domain", () => {
	it("computes a round winner from votes", () => {
		expect(computeRoundOutcome(3, 1)).toBe(RESULT_OUTCOME.PRO);
		expect(computeRoundOutcome(1, 3)).toBe(RESULT_OUTCOME.CONTRA);
		expect(computeRoundOutcome(2, 2)).toBe(RESULT_OUTCOME.DRAW);
	});

	it("requires at least one vote", () => {
		expect(() => computeRoundOutcome(0, 0)).toThrowError(DomainError);
	});

	it("aggregates the room outcome from round results", () => {
		expect(
			computeRoomOutcome([RESULT_OUTCOME.PRO, RESULT_OUTCOME.PRO, RESULT_OUTCOME.CONTRA]),
		).toEqual({
			outcome: RESULT_OUTCOME.PRO,
			proWins: 2,
			contraWins: 1,
			draws: 0,
		});

		expect(computeRoomOutcome([RESULT_OUTCOME.PRO, RESULT_OUTCOME.CONTRA])).toMatchObject({
			outcome: RESULT_OUTCOME.DRAW,
		});

		expect(() => computeRoomOutcome([])).toThrowError(DomainError);
	});

	it("rejects finalizing twice", () => {
		expect(() => assertResultNotFinalized(false)).not.toThrow();
		expect(() => assertResultNotFinalized(true)).toThrowError(DomainError);
	});
});
