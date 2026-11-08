import type { Database } from "@app/database";
import { auditEvents, userProfiles, users } from "@app/database/schema";
import { and, desc, eq, lt, or, type SQL } from "drizzle-orm";
import { decodeCursor, encodeCursor } from "#/platform/persistence/cursor.ts";
import type {
	AuditEventRecord,
	AuditListFilter,
	AuditPage,
	AuditRepository,
	NewAuditEvent,
} from "../../application/ports/audit-repository.ts";

type AuditRow = typeof auditEvents.$inferSelect & {
	name: string | null;
	displayName: string | null;
	username: string | null;
};

const rowToRecord = (row: AuditRow): AuditEventRecord => ({
	id: row.id,
	actorId: row.actorId,
	actorRole: row.actorRole,
	action: row.action,
	entityType: row.entityType,
	entityId: row.entityId,
	metadata: row.metadata,
	createdAt: row.createdAt,
	actor:
		row.actorId && row.name
			? {
					displayName: row.displayName ?? row.name,
					username: row.username,
				}
			: null,
});

export const createDrizzleAuditRepository = (db: Database): AuditRepository => ({
	async create(input: NewAuditEvent) {
		await db.insert(auditEvents).values({
			id: input.id,
			actorId: input.actorId,
			actorRole: input.actorRole,
			action: input.action,
			entityType: input.entityType,
			entityId: input.entityId,
			metadata: input.metadata ?? null,
			createdAt: input.createdAt,
		});
	},

	async list(filter: AuditListFilter): Promise<AuditPage> {
		const conditions: SQL[] = [];

		if (filter.action) {
			conditions.push(eq(auditEvents.action, filter.action));
		}

		const cursor = decodeCursor(filter.cursor);
		if (cursor) {
			const cursorCondition = or(
				lt(auditEvents.createdAt, cursor.timestamp),
				and(eq(auditEvents.createdAt, cursor.timestamp), lt(auditEvents.id, cursor.id)),
			);

			if (cursorCondition) {
				conditions.push(cursorCondition);
			}
		}

		const rows = await db
			.select({
				id: auditEvents.id,
				actorId: auditEvents.actorId,
				actorRole: auditEvents.actorRole,
				action: auditEvents.action,
				entityType: auditEvents.entityType,
				entityId: auditEvents.entityId,
				metadata: auditEvents.metadata,
				createdAt: auditEvents.createdAt,
				name: users.name,
				displayName: userProfiles.displayName,
				username: userProfiles.username,
			})
			.from(auditEvents)
			.leftJoin(users, eq(auditEvents.actorId, users.id))
			.leftJoin(userProfiles, eq(userProfiles.userId, users.id))
			.where(conditions.length > 0 ? and(...conditions) : undefined)
			.orderBy(desc(auditEvents.createdAt), desc(auditEvents.id))
			.limit(filter.limit + 1);

		const hasMore = rows.length > filter.limit;
		const pageRows = hasMore ? rows.slice(0, filter.limit) : rows;
		const items = pageRows.map(rowToRecord);
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
});
