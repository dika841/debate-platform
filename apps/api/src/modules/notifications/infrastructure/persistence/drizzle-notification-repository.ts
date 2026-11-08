import type { Database } from "@app/database";
import { notifications } from "@app/database/schema";
import type { NotificationType } from "@app/shared";
import { and, desc, eq, isNull, lt, or, sql, type SQL } from "drizzle-orm";
import { decodeCursor, encodeCursor } from "#/platform/persistence/cursor.ts";
import type {
	NewNotification,
	NotificationListFilter,
	NotificationPage,
	NotificationRecord,
	NotificationRepository,
} from "../../application/ports/notification-repository.ts";

const rowToNotification = (row: typeof notifications.$inferSelect): NotificationRecord => ({
	id: row.id,
	userId: row.userId,
	type: row.type as NotificationType,
	title: row.title,
	body: row.body,
	roomId: row.roomId,
	roundId: row.roundId,
	readAt: row.readAt,
	createdAt: row.createdAt,
});

export const createDrizzleNotificationRepository = (db: Database): NotificationRepository => {
	return {
		async create(input: NewNotification) {
			const [row] = await db
				.insert(notifications)
				.values({
					id: input.id,
					userId: input.userId,
					type: input.type,
					title: input.title,
					body: input.body,
					roomId: input.roomId,
					roundId: input.roundId,
					createdAt: input.createdAt,
				})
				.returning();

			if (!row) {
				throw new Error("Notification insert failed");
			}

			return rowToNotification(row);
		},

		async createMany(inputs: readonly NewNotification[]) {
			if (inputs.length === 0) {
				return;
			}

			await db.insert(notifications).values(
				inputs.map((input) => ({
					id: input.id,
					userId: input.userId,
					type: input.type,
					title: input.title,
					body: input.body,
					roomId: input.roomId,
					roundId: input.roundId,
					createdAt: input.createdAt,
				})),
			);
		},

		async list(filter: NotificationListFilter): Promise<NotificationPage> {
			const conditions: SQL[] = [eq(notifications.userId, filter.userId)];
			const cursor = decodeCursor(filter.cursor);

			if (cursor) {
				const cursorCondition = or(
					lt(notifications.createdAt, cursor.timestamp),
					and(eq(notifications.createdAt, cursor.timestamp), lt(notifications.id, cursor.id)),
				);

				if (cursorCondition) {
					conditions.push(cursorCondition);
				}
			}

			const rows = await db
				.select()
				.from(notifications)
				.where(and(...conditions))
				.orderBy(desc(notifications.createdAt), desc(notifications.id))
				.limit(filter.limit + 1);

			const hasMore = rows.length > filter.limit;
			const pageRows = hasMore ? rows.slice(0, filter.limit) : rows;
			const items = pageRows.map(rowToNotification);
			const lastItem = items.at(-1);

			return {
				items,
				nextCursor:
					hasMore && lastItem
						? encodeCursor({
								timestamp: lastItem.createdAt,
								id: lastItem.id,
							})
						: null,
			};
		},

		async unreadCount(userId: string) {
			const [row] = await db
				.select({ value: sql<number>`count(*)::int` })
				.from(notifications)
				.where(and(eq(notifications.userId, userId), isNull(notifications.readAt)));

			return Number(row?.value ?? 0);
		},

		async markRead(id: string, userId: string, readAt: Date) {
			const [updated] = await db
				.update(notifications)
				.set({ readAt })
				.where(
					and(
						eq(notifications.id, id),
						eq(notifications.userId, userId),
						isNull(notifications.readAt),
					),
				)
				.returning();

			if (updated) {
				return rowToNotification(updated);
			}

			const [existing] = await db
				.select()
				.from(notifications)
				.where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
				.limit(1);

			return existing ? rowToNotification(existing) : null;
		},

		async markAllRead(userId: string, readAt: Date) {
			const rows = await db
				.update(notifications)
				.set({ readAt })
				.where(and(eq(notifications.userId, userId), isNull(notifications.readAt)))
				.returning({ id: notifications.id });

			return rows.length;
		},
	};
};
