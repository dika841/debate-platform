import { DomainError, ROUND_STATUS, ROOM_STATUS, TEAM_SIDE } from "@app/shared";
import { describe, expect, it } from "vitest";
import {
	assertDebateStartable,
	assertParticipantTeam,
	assertRoomInProgress,
	assertRoundAdvanceable,
	assertRoundSubmittable,
	effectiveRoundStatus,
	submissionDeadlineFor,
	validateSubmissionContent,
} from "./round.ts";

const NOW = new Date("2026-04-01T10:00:00.000Z");
const OPEN_ROUND = {
	status: ROUND_STATUS.OPEN,
	opensAt: new Date("2026-04-01T09:00:00.000Z"),
	submissionDeadline: new Date("2026-04-01T11:00:00.000Z"),
	votingDeadline: new Date("2026-04-01T11:30:00.000Z"),
};

const STARTABLE_ROOM = {
	status: ROOM_STATUS.PUBLISHED,
	assignmentFinalizedAt: new Date("2026-04-01T09:00:00.000Z"),
	submissionDurationMinutes: 30,
	votingDurationMinutes: 30,
	roundCount: 3,
};

describe("round domain", () => {
	it("computes deadlines from the submission window", () => {
		expect(submissionDeadlineFor(NOW, 30).toISOString()).toBe("2026-04-01T10:30:00.000Z");
	});

	it("treats an open round past its deadline as voting or closed", () => {
		expect(effectiveRoundStatus(OPEN_ROUND, NOW)).toBe(ROUND_STATUS.OPEN);
		expect(effectiveRoundStatus(OPEN_ROUND, new Date("2026-04-01T11:15:00.000Z"))).toBe(
			ROUND_STATUS.VOTING,
		);
		expect(effectiveRoundStatus(OPEN_ROUND, new Date("2026-04-01T12:00:00.000Z"))).toBe(
			ROUND_STATUS.CLOSED,
		);
	});

	it("requires a published, finalized room to start", () => {
		expect(() => assertDebateStartable(STARTABLE_ROOM, 0)).not.toThrow();
		expect(() =>
			assertDebateStartable({ ...STARTABLE_ROOM, assignmentFinalizedAt: null }, 0),
		).toThrowError(DomainError);
		expect(() =>
			assertDebateStartable({ ...STARTABLE_ROOM, status: ROOM_STATUS.DRAFT }, 0),
		).toThrowError(DomainError);
		expect(() => assertDebateStartable(STARTABLE_ROOM, 2)).toThrowError(DomainError);
	});

	it("checks that a debate is in progress", () => {
		expect(() => assertRoomInProgress(ROOM_STATUS.IN_PROGRESS)).not.toThrow();
		expect(() => assertRoomInProgress(ROOM_STATUS.PUBLISHED)).toThrowError(DomainError);
	});

	it("rejects submissions outside an open window", () => {
		expect(() => assertRoundSubmittable(OPEN_ROUND, ROOM_STATUS.IN_PROGRESS, NOW)).not.toThrow();

		expect(() => assertRoundSubmittable(OPEN_ROUND, ROOM_STATUS.PUBLISHED, NOW)).toThrowError(
			DomainError,
		);
		expect(() =>
			assertRoundSubmittable(
				OPEN_ROUND,
				ROOM_STATUS.IN_PROGRESS,
				new Date("2026-04-01T12:00:00.000Z"),
			),
		).toThrowError(DomainError);
	});

	it("advances only when everyone submitted or the deadline passed", () => {
		expect(() => assertRoundAdvanceable(OPEN_ROUND, NOW, 2, 2)).not.toThrow();
		expect(() => assertRoundAdvanceable(OPEN_ROUND, NOW, 1, 2)).toThrowError(DomainError);
		expect(() =>
			assertRoundAdvanceable(OPEN_ROUND, new Date("2026-04-01T12:00:00.000Z"), 0, 2),
		).not.toThrow();
	});

	it("validates argument length and team assignment", () => {
		expect(validateSubmissionContent(`  ${"x".repeat(60)}  `)).toHaveLength(60);
		expect(() => validateSubmissionContent("too short")).toThrowError(DomainError);
		expect(() => validateSubmissionContent("x".repeat(5001))).toThrowError(DomainError);

		expect(assertParticipantTeam(TEAM_SIDE.PRO)).toBe(TEAM_SIDE.PRO);
		expect(() => assertParticipantTeam(null)).toThrowError(DomainError);
	});
});
