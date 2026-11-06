import { createLogger } from "@app/logger";

export const JOBS = {
	ROUND_DEADLINE: "round.deadline",
	VOTING_CLOSE: "voting.close",
	NOTIFICATION_DISPATCH: "notification.dispatch"
} as const;

export type JobName = (typeof JOBS)[keyof typeof JOBS];

export type JobResult = {
	readonly name: JobName;
	readonly executed: boolean;
	readonly reason: string;
};

/**
 * M0 keeps the scheduler contract in place without domain jobs yet.
 * Domain milestones (M4/M5) will replace the no-op implementations.
 */
export const runScheduledJobs = async (now: Date): Promise<readonly JobResult[]> => [
	{ name: JOBS.ROUND_DEADLINE, executed: false, reason: `no-op at ${now.toISOString()}` },
	{ name: JOBS.VOTING_CLOSE, executed: false, reason: `no-op at ${now.toISOString()}` },
	{ name: JOBS.NOTIFICATION_DISPATCH, executed: false, reason: `no-op at ${now.toISOString()}` }
];

export const logger = createLogger({
	base: { service: "worker" }
});
