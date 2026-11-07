import { DOMAIN_ERROR_CODE, DomainError, ROOM_STATUS } from "@app/shared";
import { describe, expect, it } from "vitest";
import {
	assertRoomEditable,
	assertRoomReady,
	assertRoomTransition,
	canTransitionRoom,
	ROOM_DEFAULTS,
	validateRoomConfiguration,
	validateRoomDescription,
	validateRoomMotion,
	validateRoomTitle,
} from "./room.ts";

describe("room value objects", () => {
	it("trims and validates text fields", () => {
		expect(validateRoomTitle("  Climate debate  ")).toEqual({
			ok: true,
			value: "Climate debate",
		});
		expect(validateRoomTitle("ab").ok).toBe(false);
		expect(validateRoomMotion("This house believes AI should be regulated").ok).toBe(true);
		expect(validateRoomMotion("AI").ok).toBe(false);
	});

	it("normalizes an empty description to null", () => {
		const result = validateRoomDescription("   ");
		expect(result.ok && result.value).toBeNull();
		expect(validateRoomDescription("x".repeat(2001)).ok).toBe(false);
	});

	it("applies defaults to a valid configuration", () => {
		const configuration = validateRoomConfiguration({
			title: "Climate debate",
			motion: "This house would ban fossil fuels",
		});

		expect(configuration.teamSize).toBe(ROOM_DEFAULTS.teamSize);
		expect(configuration.roundCount).toBe(ROOM_DEFAULTS.roundCount);
		expect(configuration.spectatorVotingEnabled).toBe(true);
	});

	it("rejects out-of-range configuration values", () => {
		expect(() =>
			validateRoomConfiguration({
				title: "Climate debate",
				motion: "This house would ban fossil fuels",
				teamSize: 9,
			}),
		).toThrow(DomainError);
	});

	it("enforces the room lifecycle", () => {
		expect(canTransitionRoom(ROOM_STATUS.DRAFT, ROOM_STATUS.PUBLISHED)).toBe(true);
		expect(canTransitionRoom(ROOM_STATUS.DRAFT, ROOM_STATUS.COMPLETED)).toBe(false);
		expect(canTransitionRoom(ROOM_STATUS.PUBLISHED, ROOM_STATUS.CANCELLED)).toBe(true);
		expect(canTransitionRoom(ROOM_STATUS.CANCELLED, ROOM_STATUS.PUBLISHED)).toBe(false);

		expect(() => assertRoomTransition(ROOM_STATUS.COMPLETED, ROOM_STATUS.CANCELLED)).toThrowError(
			DomainError,
		);
	});

	it("only allows drafts to be edited", () => {
		expect(() => assertRoomEditable(ROOM_STATUS.DRAFT)).not.toThrow();
		expect(() => assertRoomEditable(ROOM_STATUS.PUBLISHED)).toThrowError(DomainError);
	});

	it("reports not-ready rooms", () => {
		let caught: unknown;

		try {
			assertRoomReady({
				title: "Climate debate",
				motion: "",
				description: null,
				teamSize: 3,
				roundCount: 3,
				submissionDurationMinutes: 30,
				votingDurationMinutes: 30,
				spectatorVotingEnabled: true,
			});
		} catch (error) {
			caught = error;
		}

		expect(caught).toBeInstanceOf(DomainError);
		expect((caught as DomainError).code).toBe(DOMAIN_ERROR_CODE.ROOM_NOT_READY);
	});
});
