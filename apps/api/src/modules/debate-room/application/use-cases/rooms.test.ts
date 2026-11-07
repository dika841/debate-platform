import type { CreateRoomInput } from "@app/api-contract";
import {
	APPLICATION_ERROR_CODE,
	ApplicationError,
	DomainError,
	fixedClock,
	ROOM_STATUS,
} from "@app/shared";
import { describe, expect, it } from "vitest";
import type {
	NewRoomRecord,
	RoomListFilter,
	RoomPatch,
	RoomRepository,
	RoomWithHost,
} from "../ports/room-repository.ts";
import { cancelRoom } from "./cancel-room.ts";
import { createRoom } from "./create-room.ts";
import { getRoom } from "./get-room.ts";
import { listRooms } from "./list-rooms.ts";
import { publishRoom } from "./publish-room.ts";
import { updateRoom } from "./update-room.ts";

const CLOCK = fixedClock("2026-01-01T10:00:00.000Z");

const participation = {
	snapshot: async () => ({
		participantCount: 0,
		spectatorCount: 0,
		viewerRole: null,
		proCount: 0,
		contraCount: 0,
	}),
};

const roomWith = (
	id: string,
	hostId: string,
	status: (typeof ROOM_STATUS)[keyof typeof ROOM_STATUS] = ROOM_STATUS.DRAFT,
): RoomWithHost => ({
	room: {
		id,
		hostId,
		title: "Climate debate",
		motion: "This house would ban fossil fuels",
		description: null,
		status,
		teamSize: 3,
		roundCount: 3,
		submissionDurationMinutes: 30,
		votingDurationMinutes: 30,
		spectatorVotingEnabled: true,
		publishedAt: status === ROOM_STATUS.DRAFT ? null : new Date("2025-12-31T00:00:00.000Z"),
		cancelledAt: null,
		assignmentFinalizedAt: null,
		createdAt: new Date("2025-12-01T00:00:00.000Z"),
		updatedAt: new Date("2025-12-01T00:00:00.000Z"),
	},
	host: {
		id: hostId,
		displayName: "Host User",
		username: "host_user",
	},
});

const createRepository = (seed: readonly RoomWithHost[] = []): RoomRepository => {
	let items = [...seed];

	const hostFor = (hostId: string) =>
		items.find((item) => item.room.hostId === hostId)?.host ?? {
			id: hostId,
			displayName: "Host User",
			username: "host_user",
		};

	return {
		async create(input: NewRoomRecord) {
			const created: RoomWithHost = {
				room: {
					...input.configuration,
					id: input.id,
					hostId: input.hostId,
					status: input.status,
					publishedAt: null,
					cancelledAt: null,
					assignmentFinalizedAt: null,
					createdAt: input.createdAt,
					updatedAt: input.createdAt,
				},
				host: hostFor(input.hostId),
			};

			items = [created, ...items];
			return created;
		},

		async findById(id: string) {
			return items.find((item) => item.room.id === id) ?? null;
		},

		async list(filter: RoomListFilter) {
			const filtered = items.filter((item) => {
				if (filter.hostId && item.room.hostId !== filter.hostId) {
					return false;
				}
				if (filter.status && item.room.status !== filter.status) {
					return false;
				}
				if (filter.statuses && !filter.statuses.includes(item.room.status)) {
					return false;
				}
				return true;
			});

			return {
				items: filtered.slice(0, filter.limit),
				nextCursor: null,
			};
		},

		async update(id: string, patch: RoomPatch) {
			const found = items.find((item) => item.room.id === id);

			if (!found) {
				throw new Error("Room not found");
			}

			const updated: RoomWithHost = {
				...found,
				room: { ...found.room, ...patch },
			};

			items = items.map((item) => (item.room.id === id ? updated : item));
			return updated;
		},
	};
};

const input: CreateRoomInput = {
	title: "  Climate debate  ",
	motion: "This house would ban fossil fuels",
};

const deps = (repository: RoomRepository) => ({
	repository,
	clock: CLOCK,
	generateId: () => "room-1",
});

describe("debate room use cases", () => {
	it("creates a draft room owned by the host", async () => {
		const result = await createRoom(deps(createRepository()), "host-1", input);

		expect(result.id).toBe("room-1");
		expect(result.title).toBe("Climate debate");
		expect(result.status).toBe(ROOM_STATUS.DRAFT);
		expect(result.teamSize).toBe(3);
		expect(result.isHost).toBe(true);
	});

	it("updates a draft room for its host", async () => {
		const repository = createRepository([roomWith("room-1", "host-1")]);

		const result = await updateRoom({ repository, clock: CLOCK }, "host-1", {
			id: "room-1",
			title: "Updated debate",
		});

		expect(result.title).toBe("Updated debate");
	});

	it("rejects updates from a different user", async () => {
		const repository = createRepository([roomWith("room-1", "host-1")]);

		await expect(
			updateRoom({ repository, clock: CLOCK }, "intruder", {
				id: "room-1",
				title: "Hijacked",
			}),
		).rejects.toMatchObject({
			code: APPLICATION_ERROR_CODE.AUTHORIZATION_DENIED,
		});
	});

	it("publishes a draft room once", async () => {
		const repository = createRepository([roomWith("room-1", "host-1")]);

		const published = await publishRoom({ repository, clock: CLOCK }, "host-1", "room-1");
		expect(published.status).toBe(ROOM_STATUS.PUBLISHED);
		expect(published.publishedAt).toBe("2026-01-01T10:00:00.000Z");

		await expect(
			publishRoom({ repository, clock: CLOCK }, "host-1", "room-1"),
		).rejects.toBeInstanceOf(DomainError);
	});

	it("cancels a published room", async () => {
		const repository = createRepository([roomWith("room-1", "host-1", ROOM_STATUS.PUBLISHED)]);

		const cancelled = await cancelRoom({ repository, clock: CLOCK }, "host-1", "room-1");
		expect(cancelled.status).toBe(ROOM_STATUS.CANCELLED);
		expect(cancelled.cancelledAt).toBe("2026-01-01T10:00:00.000Z");
	});

	it("hides drafts from other users", async () => {
		const repository = createRepository([roomWith("room-1", "host-1")]);

		await expect(getRoom({ repository, participation }, "room-1", "other")).rejects.toBeInstanceOf(
			ApplicationError,
		);

		const own = await getRoom({ repository, participation }, "room-1", "host-1");
		expect(own.isHost).toBe(true);
	});

	it("includes participation counts and the viewer role", async () => {
		const repository = createRepository([roomWith("room-1", "host-1", ROOM_STATUS.PUBLISHED)]);

		const detail = await getRoom(
			{
				repository,
				participation: {
					snapshot: async () => ({
						participantCount: 2,
						spectatorCount: 1,
						viewerRole: "PARTICIPANT" as const,
						proCount: 1,
						contraCount: 1,
					}),
				},
			},
			"room-1",
			"member-1",
		);

		expect(detail.participantCount).toBe(2);
		expect(detail.spectatorCount).toBe(1);
		expect(detail.viewerRole).toBe("PARTICIPANT");
		expect(detail.teamCounts).toEqual({ pro: 1, contra: 1 });
	});

	it("requires authentication to list owned rooms", async () => {
		const repository = createRepository([roomWith("room-1", "host-1")]);

		await expect(listRooms({ repository }, null, { scope: "mine" })).rejects.toMatchObject({
			code: APPLICATION_ERROR_CODE.AUTHENTICATION_REQUIRED,
		});
	});

	it("lists only public rooms on the explore page", async () => {
		const repository = createRepository([
			roomWith("draft", "host-1"),
			roomWith("published", "host-1", ROOM_STATUS.PUBLISHED),
			roomWith("cancelled", "host-1", ROOM_STATUS.CANCELLED),
		]);

		const result = await listRooms({ repository }, null, { scope: "public" });

		expect(result.items.map((room) => room.id)).toEqual(["published"]);
		expect(result.items[0]?.isHost).toBe(false);
	});
});
