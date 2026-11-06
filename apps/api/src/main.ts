import { serve } from "@hono/node-server";
import { app } from "#/app.ts";
import { databaseHandle } from "#/platform/db/index.ts";
import { env } from "#/platform/config/env.ts";
import { logger } from "#/platform/observability/logger.ts";

const server = serve({ fetch: app.fetch, port: env.PORT }, (info) => {
	logger.info({ port: info.port }, "api listening");
});

const shutdown = async (signal: string): Promise<void> => {
	logger.info({ signal }, "api stopping");

	server.close(async () => {
		await databaseHandle.close();
		process.exit(0);
	});
};

process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("SIGINT", () => void shutdown("SIGINT"));
