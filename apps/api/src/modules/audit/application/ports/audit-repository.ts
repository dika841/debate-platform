export type AuditEventInput = {
	readonly actorId: string | null;
	readonly actorRole: string;
	readonly action: string;
	readonly entityType: string;
	readonly entityId: string | null;
	readonly metadata?: Record<string, unknown> | null;
};

export type NewAuditEvent = AuditEventInput & {
	readonly id: string;
	readonly createdAt: Date;
};

export interface AuditRepository {
	create(input: NewAuditEvent): Promise<void>;
}
