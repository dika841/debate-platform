import { DomainError, MEMBERSHIP_ROLE, ROOM_STATUS, ROUND_STATUS } from "@app/shared";
import { describe, expect, it } from "vitest";
import { areVoteTotalsRevealed, assertVoterEligible, assertVotingOpen } from "./vote.ts";

describe("vote domain", () => {
	it("only allows voting during the voting phase of an in-progress room", () => {
		expect(() => assertVotingOpen(ROUND_STATUS.VOTING, ROOM_STATUS.IN_PROGRESS)).not.toThrow();
		expect(() => assertVotingOpen(ROUND_STATUS.OPEN, ROOM_STATUS.IN_PROGRESS)).toThrowError(
			DomainError,
		);
		expect(() => assertVotingOpen(ROUND_STATUS.VOTING, ROOM_STATUS.PUBLISHED)).toThrowError(
			DomainError,
		);
	});

	it("lets the host vote and spectators when voting is enabled", () => {
		expect(() =>
			assertVoterEligible({
				isHost: true,
				membershipRole: null,
				spectatorVotingEnabled: false,
			}),
		).not.toThrow();

		expect(() =>
			assertVoterEligible({
				isHost: false,
				membershipRole: MEMBERSHIP_ROLE.SPECTATOR,
				spectatorVotingEnabled: true,
			}),
		).not.toThrow();

		expect(() =>
			assertVoterEligible({
				isHost: false,
				membershipRole: MEMBERSHIP_ROLE.SPECTATOR,
				spectatorVotingEnabled: false,
			}),
		).toThrowError(DomainError);

		expect(() =>
			assertVoterEligible({
				isHost: false,
				membershipRole: MEMBERSHIP_ROLE.PARTICIPANT,
				spectatorVotingEnabled: true,
			}),
		).toThrowError(DomainError);

		expect(() =>
			assertVoterEligible({
				isHost: false,
				membershipRole: null,
				spectatorVotingEnabled: true,
			}),
		).toThrowError(DomainError);
	});

	it("reveals totals to the host and after the round closes", () => {
		expect(areVoteTotalsRevealed(ROUND_STATUS.VOTING, true)).toBe(true);
		expect(areVoteTotalsRevealed(ROUND_STATUS.CLOSED, false)).toBe(true);
		expect(areVoteTotalsRevealed(ROUND_STATUS.VOTING, false)).toBe(false);
	});
});
