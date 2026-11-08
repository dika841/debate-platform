import type { ListNotificationsResult, Notification } from "@app/api-contract";
import {
	APPLICATION_ERROR_CODE,
	ApplicationError,
	type Clock,
	pageRequest,
	systemClock,
} from "@app/shared";
import { toNotificationDto } from "../mappers/notification-mapper.ts";
import type { NotificationRepository } from "../ports/notification-repository.ts";

export type NotificationDeps = {
	readonly repository: NotificationRepository;
	readonly clock?: Clock;
};

export const listNotifications = async (
	deps: NotificationDeps,
	userId: string,
	input: { readonly cursor?: string; readonly limit?: number },
): Promise<ListNotificationsResult> => {
	const page = pageRequest({ cursor: input.cursor, limit: input.limit });
	const [result, unreadCount] = await Promise.all([
		deps.repository.list({ userId, cursor: page.cursor, limit: page.limit }),
		deps.repository.unreadCount(userId),
	]);

	return {
		items: result.items.map(toNotificationDto),
		nextCursor: result.nextCursor,
		unreadCount,
	};
};

export const markNotificationRead = async (
	deps: NotificationDeps,
	userId: string,
	notificationId: string,
): Promise<Notification> => {
	const clock = deps.clock ?? systemClock;
	const updated = await deps.repository.markRead(notificationId, userId, clock.now());

	if (!updated) {
		throw new ApplicationError(APPLICATION_ERROR_CODE.RESOURCE_NOT_FOUND, "Notification not found");
	}

	return toNotificationDto(updated);
};

export const markAllNotificationsRead = async (
	deps: NotificationDeps,
	userId: string,
): Promise<{ readonly updated: number }> => {
	const clock = deps.clock ?? systemClock;
	const updated = await deps.repository.markAllRead(userId, clock.now());

	return { updated };
};
