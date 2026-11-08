import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { fileURLToPath } from "node:url";
import { Pool } from "pg";
import { env } from "#/platform/config/env.ts";
import { redactError } from "@app/logger";
import { logger } from "#/platform/observability/logger.ts";

const migrationsFolder = fileURLToPath(new URL("../../drizzle", import.meta.url));

const databaseUrl = process.env.MIGRATION_DATABASE_URL ?? env.DATABASE_URL;
const pool = new Pool({ connectionString: databaseUrl });

try {
	logger.info({ migrationsFolder }, "migrate.start");
	await migrate(drizzle({ client: pool }), { migrationsFolder });
	logger.info({}, "migrate.complete");
} catch (error) {
	logger.error({ err: redactError(error) }, "migrate.failed");
	process.exitCode = 1;
} finally {
	await pool.end();
}
