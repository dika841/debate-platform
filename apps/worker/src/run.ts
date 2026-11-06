import { logger, runScheduledJobs } from "./jobs.ts";

const INTERVAL_MS = 60_000;

const tick = async (): Promise<void> => {
	const results = await runScheduledJobs(new Date());
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
