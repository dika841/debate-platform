import { z } from "zod";

export const auditEventSchema = z.object({
	id: z.string(),
	actorId: z.string().nullable(),
	actorRole: z.string(),
	actor: z
		.object({
			displayName: z.string(),
			username: z.string().nullable(),
		})
		.nullable(),
	action: z.string(),
	entityType: z.string(),
	entityId: z.string().nullable(),
	metadata: z.record(z.string(), z.unknown()).nullable(),
	createdAt: z.string(),
});

export const listAuditEventsInputSchema = z.object({
	cursor: z.string().min(1).optional(),
	limit: z.number().int().min(1).max(100).optional(),
	action: z.string().min(1).optional(),
});

export const listAuditEventsOutputSchema = z.object({
	items: z.array(auditEventSchema),
	nextCursor: z.string().nullable(),
});

export type AuditEvent = z.infer<typeof auditEventSchema>;
export type ListAuditEventsResult = z.infer<typeof listAuditEventsOutputSchema>;
