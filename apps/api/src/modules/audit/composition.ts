import type { Database } from "@app/database";
import { redactError } from "@app/logger";
import { logger } from "#/platform/observability/logger.ts";
import { createAuditLogger, type AuditLogger } from "./application/audit-logger.ts";
import { createDrizzleAuditRepository } from "./infrastructure/persistence/drizzle-audit-repository.ts";

export const auditLoggerFor = (database: Database): AuditLogger =>
	createAuditLogger({ repository: createDrizzleAuditRepository(database) });

export const safeAudit = async (work: Promise<unknown>): Promise<void> => {
	try {
		await work;
	} catch (error) {
		logger.warn({ err: redactError(error) }, "audit.record_failed");
	}
};
