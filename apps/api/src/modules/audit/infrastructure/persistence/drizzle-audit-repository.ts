import type { Database } from "@app/database";
import { auditEvents } from "@app/database/schema";
import type { NewAuditEvent, AuditRepository } from "../../application/ports/audit-repository.ts";

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
});
