import type { NotificationType } from "@app/shared";

export type NotificationRecord = {
	readonly id: string;
	readonly userId: string;
	readonly type: NotificationType;
	readonly title: string;
	readonly body: string;
	readonly roomId: string | null;
	readonly roundId: string | null;
	readonly readAt: Date | null;
	readonly createdAt: Date;
};

export type NewNotification = {
	readonly id: string;
	readonly userId: string;
	readonly type: NotificationType;
	readonly title: string;
	readonly body: string;
	readonly roomId: string | null;
	readonly roundId: string | null;
	readonly createdAt: Date;
};

export type NotificationListFilter = {
	readonly userId: string;
	readonly cursor?: string | null;
	readonly limit: number;
};

export type NotificationPage = {
	readonly items: readonly NotificationRecord[];
	readonly nextCursor: string | null;
};

export interface NotificationRepository {
	create(input: NewNotification): Promise<NotificationRecord>;
	createMany(inputs: readonly NewNotification[]): Promise<void>;
	list(filter: NotificationListFilter): Promise<NotificationPage>;
	unreadCount(userId: string): Promise<number>;
	markRead(id: string, userId: string, readAt: Date): Promise<NotificationRecord | null>;
	markAllRead(userId: string, readAt: Date): Promise<number>;
}
