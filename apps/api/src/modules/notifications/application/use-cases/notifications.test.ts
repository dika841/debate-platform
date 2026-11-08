import { NOTIFICATION_TYPE, type NotificationType } from "@app/shared";
import { describe, expect, it } from "vitest";
import type { MembershipRepository } from "#/modules/membership/application/ports/membership-repository.ts";
import type { RoomRepository } from "#/modules/debate-room/application/ports/room-repository.ts";
import { createNotificationService } from "../notification-service.ts";
import type {
	NewNotification,
	NotificationRecord,
	NotificationRepository,
} from "../ports/notification-repository.ts";
import {
	listNotifications,
	markAllNotificationsRead,
	markNotificationRead,
} from "./notifications.ts";

const NOW = new Date("2026-07-01T10:00:00.000Z");

const notificationWith = (
	id: string,
	overrides: Partial<NotificationRecord> = {},
): NotificationRecord => ({
	id,
	userId: "user-1",
	type: NOTIFICATION_TYPE.ROUND_OPENED,
	title: "Round opened",
	body: "Round 1 is now open.",
	roomId: "room-1",
	roundId: "round-1",
	readAt: null,
	createdAt: NOW,
	...overrides,
});

const createRepository = (seed: readonly NotificationRecord[] = []) => {
	let items = [...seed];

	const repository: NotificationRepository = {
		create: async (input: NewNotification) => {
			const created: NotificationRecord = {
				id: input.id,
				userId: input.userId,
				type: input.type as NotificationType,
				title: input.title,
				body: input.body,
				roomId: input.roomId,
				roundId: input.roundId,
				readAt: null,
				createdAt: input.createdAt,
			};
			items.push(created);
			return created;
		},
		createMany: async (inputs) => {
			for (const input of inputs) {
				items.push({
					id: input.id,
					userId: input.userId,
					type: input.type,
					title: input.title,
					body: input.body,
					roomId: input.roomId,
					roundId: input.roundId,
					readAt: null,
					createdAt: input.createdAt,
				});
			}
		},
		list: async (filter) => ({
			items: items.filter((item) => item.userId === filter.userId).slice(0, filter.limit),
			nextCursor: null,
		}),
		unreadCount: async (userId) =>
			items.filter((item) => item.userId === userId && item.readAt === null).length,
		markRead: async (id, userId, readAt) => {
			const found = items.find((item) => item.id === id && item.userId === userId);

			if (!found) {
				return null;
			}

			const updated = { ...found, readAt: found.readAt ?? readAt };
			items = items.map((item) => (item.id === id ? updated : item));
			return updated;
		},
		markAllRead: async (userId, readAt) => {
			let updated = 0;
			items = items.map((item) => {
				if (item.userId === userId && item.readAt === null) {
					updated += 1;
					return { ...item, readAt };
				}
				return item;
			});
			return updated;
		},
	};

	return {
		repository,
		get items() {
			return items;
		},
	};
};

const clock = { now: () => new Date(NOW) };

describe("notification use cases", () => {
	it("lists notifications with an unread count", async () => {
		const harness = createRepository([
			notificationWith("n1"),
			notificationWith("n2", { readAt: NOW }),
			notificationWith("other", { userId: "user-2" }),
		]);

		const result = await listNotifications({ repository: harness.repository, clock }, "user-1", {});

		expect(result.items).toHaveLength(2);
		expect(result.unreadCount).toBe(1);
	});

	it("marks one notification and then all as read", async () => {
		const harness = createRepository([notificationWith("n1"), notificationWith("n2")]);

		const read = await markNotificationRead(
			{ repository: harness.repository, clock },
			"user-1",
			"n1",
		);
		expect(read.readAt).toBe(NOW.toISOString());

		const all = await markAllNotificationsRead({ repository: harness.repository, clock }, "user-1");
		expect(all.updated).toBe(1);
	});

	it("does not leak notifications from another user", async () => {
		const harness = createRepository([notificationWith("n1")]);

		await expect(
			markNotificationRead({ repository: harness.repository, clock }, "user-2", "n1"),
		).rejects.toMatchObject({ code: "RESOURCE_NOT_FOUND" });
	});
});

describe("notification service", () => {
	it("notifies room members while excluding the actor", async () => {
		const harness = createRepository();
		const rooms = {
			findById: async () => ({
				room: { id: "room-1", hostId: "host-1" },
				host: { id: "host-1", displayName: "Host", username: "host" },
			}),
		} as unknown as RoomRepository;
		const memberships = {
			listUserIds: async () => ["user-1", "user-2", "user-3"],
		} as unknown as MembershipRepository;

		const service = createNotificationService({
			repository: harness.repository,
			rooms,
			memberships,
			clock,
			generateId: (() => {
				let count = 0;
				return () => `notification-${++count}`;
			})(),
		});

		await service.notifyRoomMembers(
			"room-1",
			{
				type: NOTIFICATION_TYPE.ROUND_VOTING,
				title: "Voting opened",
				body: "Round 1 is open for voting.",
				roomId: "room-1",
				roundId: "round-1",
			},
			{ excludeUserId: "user-1" },
		);

		expect(harness.items.map((item) => item.userId)).toEqual(["user-2", "user-3"]);
	});

	it("notifies the room host", async () => {
		const harness = createRepository();
		const rooms = {
			findById: async () => ({
				room: { id: "room-1", hostId: "host-1" },
				host: { id: "host-1", displayName: "Host", username: "host" },
			}),
		} as unknown as RoomRepository;
		const memberships = {
			listUserIds: async () => [],
		} as unknown as MembershipRepository;

		const service = createNotificationService({
			repository: harness.repository,
			rooms,
			memberships,
			clock,
			generateId: () => "notification-1",
		});

		await service.notifyHost("room-1", {
			type: NOTIFICATION_TYPE.MEMBER_JOINED,
			title: "New member joined",
			body: "Aisha joined as participant.",
			roomId: "room-1",
		});

		expect(harness.items[0]?.userId).toBe("host-1");
	});
});
