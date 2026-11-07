import type { Database } from "@app/database";
import { debateRounds, roundSubmissions } from "@app/database/schema";
import type { RoundStatus } from "@app/shared";
import { asc, eq, inArray, sql } from "drizzle-orm";
import type {
	NewRoundRecord,
	RoundPatch,
	RoundRecord,
	RoundRepository,
	RoundSummaryRecord,
} from "../../application/ports/round-repository.ts";

const rowToRound = (row: typeof debateRounds.$inferSelect): RoundRecord => ({
	id: row.id,
	roomId: row.roomId,
	roundNumber: row.roundNumber,
	status: row.status as RoundStatus,
	opensAt: row.opensAt,
	submissionDeadline: row.submissionDeadline,
	createdAt: row.createdAt,
	updatedAt: row.updatedAt,
});

export const createDrizzleRoundRepository = (db: Database): RoundRepository => {
	const findById = async (id: string): Promise<RoundRecord | null> => {
		const [row] = await db.select().from(debateRounds).where(eq(debateRounds.id, id)).limit(1);

		return row ? rowToRound(row) : null;
	};

	return {
		async listByRoom(roomId: string): Promise<readonly RoundSummaryRecord[]> {
			const rows = await db
				.select()
				.from(debateRounds)
				.where(eq(debateRounds.roomId, roomId))
				.orderBy(asc(debateRounds.roundNumber));

			if (rows.length === 0) {
				return [];
			}

			const counts = await db
				.select({
					roundId: roundSubmissions.roundId,
					value: sql<number>`count(*)::int`,
				})
				.from(roundSubmissions)
				.where(
					inArray(
						roundSubmissions.roundId,
						rows.map((row) => row.id),
					),
				)
				.groupBy(roundSubmissions.roundId);

			const countByRound = new Map(counts.map((count) => [count.roundId, Number(count.value)]));

			return rows.map((row) => ({
				round: rowToRound(row),
				submissionCount: countByRound.get(row.id) ?? 0,
			}));
		},

		findById,

		async createMany(rounds: readonly NewRoundRecord[]) {
			if (rounds.length === 0) {
				return;
			}

			await db.insert(debateRounds).values(
				rounds.map((round) => ({
					id: round.id,
					roomId: round.roomId,
					roundNumber: round.roundNumber,
					status: round.status,
					opensAt: round.opensAt,
					submissionDeadline: round.submissionDeadline,
					createdAt: round.createdAt,
					updatedAt: round.createdAt,
				})),
			);
		},

		async update(id: string, patch: RoundPatch) {
			const [row] = await db
				.update(debateRounds)
				.set({ ...patch })
				.where(eq(debateRounds.id, id))
				.returning();

			if (!row) {
				throw new Error("Round not found");
			}

			return rowToRound(row);
		},
	};
};
