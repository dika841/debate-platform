import { type Clock, type NotificationType, systemClock } from "@app/shared";
import type { RoomRepository } from "#/modules/debate-room/application/ports/room-repository.ts";
import type { MembershipRepository } from "#/modules/membership/application/ports/membership-repository.ts";
import type { NewNotification, NotificationRepository } from "./ports/notification-repository.ts";

export type NotificationDraft = {
	readonly type: NotificationType;
	readonly title: string;
	readonly body: string;
	readonly roomId?: string | null;
	readonly roundId?: string | null;
};

export type NotificationServiceDeps = {
	readonly repository: NotificationRepository;
	readonly rooms: RoomRepository;
	readonly memberships: MembershipRepository;
	readonly clock?: Clock;
	readonly generateId?: () => string;
};

export type NotifyRoomMembersOptions = {
	readonly excludeUserId?: string;
};

export type NotificationService = {
	notifyUser(userId: string, draft: NotificationDraft): Promise<void>;
	notifyHost(roomId: string, draft: NotificationDraft): Promise<void>;
	notifyRoomMembers(
		roomId: string,
		draft: NotificationDraft,
		options?: NotifyRoomMembersOptions,
	): Promise<void>;
};

export const createNotificationService = (deps: NotificationServiceDeps): NotificationService => {
	const clock = deps.clock ?? systemClock;
	const generateId = deps.generateId ?? (() => crypto.randomUUID());

	const build = (userId: string, draft: NotificationDraft, createdAt: Date): NewNotification => ({
		id: generateId(),
		userId,
		type: draft.type,
		title: draft.title,
		body: draft.body,
		roomId: draft.roomId ?? null,
		roundId: draft.roundId ?? null,
		createdAt,
	});

	const notifyUsers = async (
		userIds: readonly string[],
		draft: NotificationDraft,
		options: NotifyRoomMembersOptions = {},
	): Promise<void> => {
		const recipients = [...new Set(userIds.filter((userId) => userId !== options.excludeUserId))];

		if (recipients.length === 0) {
			return;
		}

		const createdAt = clock.now();
		await deps.repository.createMany(recipients.map((userId) => build(userId, draft, createdAt)));
	};

	return {
		async notifyUser(userId, draft) {
			await deps.repository.create(build(userId, draft, clock.now()));
		},

		async notifyHost(roomId, draft) {
			const room = await deps.rooms.findById(roomId);

			if (!room) {
				return;
			}

			await deps.repository.create(build(room.host.id, draft, clock.now()));
		},

		async notifyRoomMembers(roomId, draft, options = {}) {
			const userIds = await deps.memberships.listUserIds(roomId);
			await notifyUsers(userIds, draft, options);
		},
	};
};
