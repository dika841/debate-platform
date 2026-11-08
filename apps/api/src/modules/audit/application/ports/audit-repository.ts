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

export type AuditActor = {
	readonly displayName: string;
	readonly username: string | null;
};

export type AuditEventRecord = NewAuditEvent & {
	readonly actor: AuditActor | null;
};

export type AuditListFilter = {
	readonly action?: string;
	readonly cursor?: string | null;
	readonly limit: number;
};

export type AuditPage = {
	readonly items: readonly AuditEventRecord[];
	readonly nextCursor: string | null;
};

export interface AuditRepository {
	create(input: NewAuditEvent): Promise<void>;
	list(filter: AuditListFilter): Promise<AuditPage>;
}
