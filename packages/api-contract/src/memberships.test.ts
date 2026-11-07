import { describe, expect, it } from "vitest";
import {
	joinMembershipInputSchema,
	listMembersInputSchema,
	membershipSchema,
} from "./memberships.ts";
import { roomDetailSchema, roomSchema } from "./rooms.ts";

const room = {
	id: "room-1",
	host: { id: "user-1", displayName: "Host", username: "host_user" },
	title: "Climate debate",
	motion: "This house would ban fossil fuels",
	description: null,
	status: "PUBLISHED" as const,
	teamSize: 3,
	roundCount: 3,
	submissionDurationMinutes: 30,
	votingDurationMinutes: 30,
	spectatorVotingEnabled: true,
	publishedAt: "2026-01-02T00:00:00.000Z",
	cancelledAt: null,
	createdAt: "2026-01-01T00:00:00.000Z",
	updatedAt: "2026-01-01T00:00:00.000Z",
	isHost: false,
};

describe("membership contract", () => {
	it("accepts a membership payload", () => {
		const parsed = membershipSchema.parse({
			id: "membership-1",
			roomId: "room-1",
			userId: "user-2",
			role: "PARTICIPANT",
			team: null,
			user: {
				id: "user-2",
				displayName: "Member",
				username: "member",
				avatarUrl: null,
			},
			joinedAt: "2026-01-03T00:00:00.000Z",
		});

		expect(parsed.role).toBe("PARTICIPANT");
	});

	it("rejects the host role as a membership role", () => {
		expect(() => joinMembershipInputSchema.parse({ roomId: "room-1", role: "HOST" })).toThrow();
	});

	it("accepts optional roster filters", () => {
		expect(listMembersInputSchema.parse({ roomId: "room-1" }).role).toBeUndefined();
		expect(listMembersInputSchema.parse({ roomId: "room-1", role: "SPECTATOR" }).role).toBe(
			"SPECTATOR",
		);
	});

	it("adds participation fields to room details", () => {
		const detail = roomDetailSchema.parse({
			...room,
			participantCount: 2,
			spectatorCount: 4,
			viewerRole: "SPECTATOR",
			assignmentFinalizedAt: null,
			teamCounts: { pro: 1, contra: 1 },
		});

		expect(detail.participantCount).toBe(2);
		expect(detail.teamCounts.pro).toBe(1);
		expect(roomSchema.safeParse(room).success).toBe(true);
	});
});
