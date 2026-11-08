import { type Clock, systemClock } from "@app/shared";
import type { AuditEventInput, AuditRepository } from "./ports/audit-repository.ts";

export type AuditLoggerDeps = {
	readonly repository: AuditRepository;
	readonly clock?: Clock;
	readonly generateId?: () => string;
};

export type AuditLogger = {
	record(input: AuditEventInput): Promise<void>;
};

export const createAuditLogger = (deps: AuditLoggerDeps): AuditLogger => {
	const clock = deps.clock ?? systemClock;
	const generateId = deps.generateId ?? (() => crypto.randomUUID());

	return {
		async record(input) {
			await deps.repository.create({
				...input,
				id: generateId(),
				createdAt: clock.now(),
			});
		},
	};
};
