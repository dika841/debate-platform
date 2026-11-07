import { describe, expect, it } from "vitest";
import {
	createRoomInputSchema,
	listRoomsInputSchema,
	roomSchema,
	updateRoomInputSchema,
} from "./rooms.ts";

const room = {
	id: "room-1",
	host: { id: "user-1", displayName: "Host", username: "host_user" },
	title: "Climate debate",
	motion: "This house would ban fossil fuels",
	description: null,
	status: "DRAFT" as const,
	teamSize: 3,
	roundCount: 3,
	submissionDurationMinutes: 30,
	votingDurationMinutes: 30,
	spectatorVotingEnabled: true,
	publishedAt: null,
	cancelledAt: null,
	createdAt: "2026-01-01T00:00:00.000Z",
	updatedAt: "2026-01-01T00:00:00.000Z",
	isHost: true,
};

describe("room contract", () => {
	it("accepts a room payload", () => {
		expect(roomSchema.parse(room).status).toBe("DRAFT");
	});

	it("applies creation defaults", () => {
		const parsed = createRoomInputSchema.parse({
			title: "Climate debate",
			motion: "This house would ban fossil fuels",
		});

		expect(parsed.teamSize).toBe(3);
		expect(parsed.roundCount).toBe(3);
		expect(parsed.spectatorVotingEnabled).toBe(true);
	});

	it("rejects invalid room configuration", () => {
		expect(() =>
			createRoomInputSchema.parse({
				title: "ab",
				motion: "short",
				teamSize: 10,
			}),
		).toThrow();
	});

	it("allows partial updates", () => {
		const parsed = updateRoomInputSchema.parse({ id: "room-1", teamSize: 4 });
		expect(parsed.teamSize).toBe(4);
		expect(parsed.title).toBeUndefined();
	});

	it("defaults the list scope to public", () => {
		const parsed = listRoomsInputSchema.parse({});
		expect(parsed.scope).toBe("public");
	});

	it("rejects unknown room statuses", () => {
		expect(() => roomSchema.parse({ ...room, status: "ARCHIVED" })).toThrow();
	});
});
