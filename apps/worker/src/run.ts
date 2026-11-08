import { logger, runScheduledJobs } from "./jobs.ts";

const INTERVAL_MS = 60_000;

const tick = async (): Promise<void> => {
	const results = await runScheduledJobs(new Date(), {
		DATABASE_URL: process.env.DATABASE_URL,
		NOTIFICATION_RETENTION_DAYS: process.env.NOTIFICATION_RETENTION_DAYS,
		REPORT_RETENTION_DAYS: process.env.REPORT_RETENTION_DAYS,
		AUDIT_RETENTION_DAYS: process.env.AUDIT_RETENTION_DAYS,
	});
	logger.debug({ results }, "worker.local.tick");
};

logger.info({ intervalMs: INTERVAL_MS }, "worker.local.start");

const interval = setInterval(() => {
	void tick();
}, INTERVAL_MS);

const shutdown = (signal: string): void => {
	logger.info({ signal }, "worker.local.stop");
	clearInterval(interval);
	process.exit(0);
};

process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));
