import { DomainError, MEMBERSHIP_ROLE, participantCapacity, ROOM_STATUS } from "@app/shared";
import { describe, expect, it } from "vitest";
import {
	assertHostCannotLeave,
	assertNotRoomHost,
	assertParticipantCapacity,
	assertRoomJoinable,
	isRoomJoinable,
} from "./membership.ts";

describe("membership domain rules", () => {
	it("only accepts members in open rooms", () => {
		expect(isRoomJoinable(ROOM_STATUS.PUBLISHED)).toBe(true);
		expect(isRoomJoinable(ROOM_STATUS.IN_PROGRESS)).toBe(true);
		expect(isRoomJoinable(ROOM_STATUS.DRAFT)).toBe(false);
		expect(isRoomJoinable(ROOM_STATUS.CANCELLED)).toBe(false);

		expect(() => assertRoomJoinable(ROOM_STATUS.DRAFT)).toThrowError(DomainError);
	});

	it("rejects the host as a member or leaver", () => {
		expect(() => assertNotRoomHost(false)).not.toThrow();
		expect(() => assertNotRoomHost(true)).toThrowError(DomainError);
		expect(() => assertHostCannotLeave(false)).not.toThrow();
		expect(() => assertHostCannotLeave(true)).toThrowError(DomainError);
	});

	it("caps participants at two teams", () => {
		expect(participantCapacity(3)).toBe(6);
		expect(() => assertParticipantCapacity(5, 3)).not.toThrow();
		expect(() => assertParticipantCapacity(6, 3)).toThrowError(DomainError);
	});

	it("exposes the membership roles", () => {
		expect(MEMBERSHIP_ROLE.PARTICIPANT).toBe("PARTICIPANT");
		expect(MEMBERSHIP_ROLE.SPECTATOR).toBe("SPECTATOR");
	});
});
