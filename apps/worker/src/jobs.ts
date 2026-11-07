import { databaseCreate } from "@app/database";
import { debateRooms, debateRounds } from "@app/database/schema";
import { createLogger } from "@app/logger";
import { ROUND_STATUS, ROOM_STATUS } from "@app/shared";
import { and, eq, lte } from "drizzle-orm";

export const JOBS = {
	ROUND_DEADLINE: "round.deadline",
	VOTING_CLOSE: "voting.close",
	NOTIFICATION_DISPATCH: "notification.dispatch",
} as const;

export type JobName = (typeof JOBS)[keyof typeof JOBS];

export type JobResult = {
	readonly name: JobName;
	readonly executed: boolean;
	readonly reason: string;
};

export type JobEnv = {
	readonly DATABASE_URL?: string;
};

export const logger = createLogger({
	base: { service: "worker" },
});

const closeExpiredRounds = async (databaseUrl: string, now: Date): Promise<number> => {
	const handle = databaseCreate(databaseUrl);

	try {
		return await handle.db.transaction(async (tx) => {
			const expired = await tx
				.select({
					id: debateRounds.id,
					roomId: debateRounds.roomId,
					roundNumber: debateRounds.roundNumber,
					submissionDurationMinutes: debateRooms.submissionDurationMinutes,
				})
				.from(debateRounds)
				.innerJoin(debateRooms, eq(debateRounds.roomId, debateRooms.id))
				.where(
					and(
						eq(debateRounds.status, ROUND_STATUS.OPEN),
						eq(debateRooms.status, ROOM_STATUS.IN_PROGRESS),
						lte(debateRounds.submissionDeadline, now),
					),
				);

			let closed = 0;

			for (const round of expired) {
				const updated = await tx
					.update(debateRounds)
					.set({ status: ROUND_STATUS.CLOSED, updatedAt: now })
					.where(and(eq(debateRounds.id, round.id), eq(debateRounds.status, ROUND_STATUS.OPEN)))
					.returning({ id: debateRounds.id });

				if (updated.length === 0) {
					continue;
				}

				closed += 1;

				const nextDeadline = new Date(now.getTime() + round.submissionDurationMinutes * 60_000);

				await tx
					.update(debateRounds)
					.set({
						status: ROUND_STATUS.OPEN,
						opensAt: now,
						submissionDeadline: nextDeadline,
						updatedAt: now,
					})
					.where(
						and(
							eq(debateRounds.roomId, round.roomId),
							eq(debateRounds.roundNumber, round.roundNumber + 1),
							eq(debateRounds.status, ROUND_STATUS.PENDING),
						),
					);
			}

			return closed;
		});
	} finally {
		await handle.close();
	}
};

export const runScheduledJobs = async (
	now: Date,
	env: JobEnv = { DATABASE_URL: process.env.DATABASE_URL },
): Promise<readonly JobResult[]> => {
	const results: JobResult[] = [];

	if (!env.DATABASE_URL) {
		results.push({
			name: JOBS.ROUND_DEADLINE,
			executed: false,
			reason: "DATABASE_URL is not configured",
		});
	} else {
		try {
			const closed = await closeExpiredRounds(env.DATABASE_URL, now);

			results.push({
				name: JOBS.ROUND_DEADLINE,
				executed: closed > 0,
				reason:
					closed > 0
						? `closed ${closed} expired round(s) and opened the next round`
						: "no expired rounds",
			});
		} catch (error) {
			logger.error({ err: error }, "job.round_deadline.failed");
			results.push({
				name: JOBS.ROUND_DEADLINE,
				executed: false,
				reason: "round deadline job failed",
			});
		}
	}

	results.push(
		{
			name: JOBS.VOTING_CLOSE,
			executed: false,
			reason: `no-op at ${now.toISOString()}`,
		},
		{
			name: JOBS.NOTIFICATION_DISPATCH,
			executed: false,
			reason: `no-op at ${now.toISOString()}`,
		},
	);

	return results;
};
