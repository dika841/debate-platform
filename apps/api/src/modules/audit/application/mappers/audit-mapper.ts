import type { AuditEvent } from "@app/api-contract";
import type { AuditEventRecord } from "../ports/audit-repository.ts";

export const toAuditEventDto = (event: AuditEventRecord): AuditEvent => ({
	id: event.id,
	actorId: event.actorId,
	actorRole: event.actorRole,
	actor: event.actor,
	action: event.action,
	entityType: event.entityType,
	entityId: event.entityId,
	metadata: event.metadata ?? null,
	createdAt: event.createdAt.toISOString(),
});
