import { databaseCreate, type DatabaseTransaction } from "@app/database";
import { debateRooms, debateRounds, notifications, roomMemberships } from "@app/database/schema";
import { redactError } from "@app/logger";
import { createLogger } from "@app/logger";
import { NOTIFICATION_TYPE, ROUND_STATUS, ROOM_STATUS } from "@app/shared";
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

const notifyRoom = async (
	tx: DatabaseTransaction,
	input: {
		readonly roomId: string;
		readonly hostId: string;
		readonly type: (typeof NOTIFICATION_TYPE)[keyof typeof NOTIFICATION_TYPE];
		readonly title: string;
		readonly body: string;
		readonly roundId: string | null;
	},
	now: Date,
): Promise<void> => {
	const members = await tx
		.select({ userId: roomMemberships.userId })
		.from(roomMemberships)
		.where(eq(roomMemberships.roomId, input.roomId));
	const recipients = [...new Set([input.hostId, ...members.map((member) => member.userId)])];

	if (recipients.length === 0) {
		return;
	}

	await tx.insert(notifications).values(
		recipients.map((userId) => ({
			id: crypto.randomUUID(),
			userId,
			type: input.type,
			title: input.title,
			body: input.body,
			roomId: input.roomId,
			roundId: input.roundId,
			createdAt: now,
		})),
	);
};

const closeExpiredRounds = async (
	databaseUrl: string,
	now: Date,
): Promise<{ closed: number; voting: number }> => {
	const handle = databaseCreate(databaseUrl);

	try {
		return await handle.db.transaction(async (tx) => {
			const expiredSubmissions = await tx
				.select({
					id: debateRounds.id,
					roomId: debateRounds.roomId,
					hostId: debateRooms.hostId,
					roundNumber: debateRounds.roundNumber,
					submissionDeadline: debateRounds.submissionDeadline,
					votingDeadline: debateRounds.votingDeadline,
					votingDurationMinutes: debateRooms.votingDurationMinutes,
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

			let voting = 0;

			for (const round of expiredSubmissions) {
				const votingDeadline =
					round.votingDeadline ??
					new Date(
						(round.submissionDeadline?.getTime() ?? now.getTime()) +
							round.votingDurationMinutes * 60_000,
					);

				const updated = await tx
					.update(debateRounds)
					.set({
						status: ROUND_STATUS.VOTING,
						votingDeadline,
						updatedAt: now,
					})
					.where(and(eq(debateRounds.id, round.id), eq(debateRounds.status, ROUND_STATUS.OPEN)))
					.returning({ id: debateRounds.id });

				if (updated.length > 0) {
					voting += 1;

					await notifyRoom(
						tx,
						{
							roomId: round.roomId,
							hostId: round.hostId,
							type: NOTIFICATION_TYPE.ROUND_VOTING,
							title: "Voting opened",
							body: `Round ${round.roundNumber} is now open for voting.`,
							roundId: round.id,
						},
						now,
					);
				}
			}

			const expiredVoting = await tx
				.select({
					id: debateRounds.id,
					roomId: debateRounds.roomId,
					hostId: debateRooms.hostId,
					roundNumber: debateRounds.roundNumber,
					submissionDurationMinutes: debateRooms.submissionDurationMinutes,
					votingDurationMinutes: debateRooms.votingDurationMinutes,
				})
				.from(debateRounds)
				.innerJoin(debateRooms, eq(debateRounds.roomId, debateRooms.id))
				.where(
					and(
						eq(debateRounds.status, ROUND_STATUS.VOTING),
						eq(debateRooms.status, ROOM_STATUS.IN_PROGRESS),
						lte(debateRounds.votingDeadline, now),
					),
				);

			let closed = 0;

			for (const round of expiredVoting) {
				const updated = await tx
					.update(debateRounds)
					.set({ status: ROUND_STATUS.CLOSED, updatedAt: now })
					.where(and(eq(debateRounds.id, round.id), eq(debateRounds.status, ROUND_STATUS.VOTING)))
					.returning({ id: debateRounds.id });

				if (updated.length === 0) {
					continue;
				}

				closed += 1;

				const nextSubmissionDeadline = new Date(
					now.getTime() + round.submissionDurationMinutes * 60_000,
				);
				const nextVotingDeadline = new Date(
					nextSubmissionDeadline.getTime() + round.votingDurationMinutes * 60_000,
				);

				const opened = await tx
					.update(debateRounds)
					.set({
						status: ROUND_STATUS.OPEN,
						opensAt: now,
						submissionDeadline: nextSubmissionDeadline,
						votingDeadline: nextVotingDeadline,
						updatedAt: now,
					})
					.where(
						and(
							eq(debateRounds.roomId, round.roomId),
							eq(debateRounds.roundNumber, round.roundNumber + 1),
							eq(debateRounds.status, ROUND_STATUS.PENDING),
						),
					)
					.returning({ id: debateRounds.id });

				if (opened.length > 0) {
					await notifyRoom(
						tx,
						{
							roomId: round.roomId,
							hostId: round.hostId,
							type: NOTIFICATION_TYPE.ROUND_OPENED,
							title: "New round opened",
							body: `Round ${round.roundNumber + 1} is now open for submissions.`,
							roundId: opened[0]?.id ?? null,
						},
						now,
					);
				}
			}

			return { closed, voting };
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
			const outcome = await closeExpiredRounds(env.DATABASE_URL, now);

			results.push({
				name: JOBS.ROUND_DEADLINE,
				executed: outcome.closed > 0 || outcome.voting > 0,
				reason:
					outcome.closed > 0 || outcome.voting > 0
						? `${outcome.voting} round(s) entered voting, ${outcome.closed} round(s) closed`
						: "no expired rounds",
			});
		} catch (error) {
			logger.error({ err: redactError(error) }, "job.round_deadline.failed");
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
