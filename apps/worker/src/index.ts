import { logger, runScheduledJobs } from "./jobs.ts";

type ScheduledEvent = {
	readonly scheduledTime: number;
	readonly cron: string;
};

type ExecutionContext = {
	waitUntil(promise: Promise<unknown>): void;
};

const execute = async (event: ScheduledEvent): Promise<void> => {
	const now = new Date(event.scheduledTime);
	const results = await runScheduledJobs(now);

	logger.info({ cron: event.cron, results }, "worker.scheduled.complete");
};

export default {
	scheduled(event: ScheduledEvent, _env: unknown, context: ExecutionContext): void {
		context.waitUntil(execute(event));
	}
};
