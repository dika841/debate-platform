import type { Notification } from "@app/api-contract";
import type { NotificationRecord } from "../ports/notification-repository.ts";

export const toNotificationDto = (notification: NotificationRecord): Notification => ({
	id: notification.id,
	type: notification.type,
	title: notification.title,
	body: notification.body,
	roomId: notification.roomId,
	roundId: notification.roundId,
	readAt: notification.readAt?.toISOString() ?? null,
	createdAt: notification.createdAt.toISOString(),
});
