import type { Database } from "@app/database";
import { roomResults, roundResults } from "@app/database/schema";
import type { ResultOutcome } from "@app/shared";
import { eq } from "drizzle-orm";
import type {
	NewRoomResult,
	NewRoundResult,
	ResultRepository,
	RoomResultRecord,
	RoundResultRecord,
} from "../../application/ports/result-repository.ts";

const rowToRoundResult = (row: typeof roundResults.$inferSelect): RoundResultRecord => ({
	id: row.id,
	roundId: row.roundId,
	roomId: row.roomId,
	outcome: row.outcome as ResultOutcome,
	proCount: row.proCount,
	contraCount: row.contraCount,
	totalVotes: row.totalVotes,
	finalizedById: row.finalizedById,
	finalizedAt: row.finalizedAt,
});

const rowToRoomResult = (row: typeof roomResults.$inferSelect): RoomResultRecord => ({
	id: row.id,
	roomId: row.roomId,
	outcome: row.outcome as ResultOutcome,
	proWins: row.proWins,
	contraWins: row.contraWins,
	draws: row.draws,
	finalizedById: row.finalizedById,
	finalizedAt: row.finalizedAt,
});

export const createDrizzleResultRepository = (db: Database): ResultRepository => {
	return {
		async findRoundResult(roundId) {
			const [row] = await db
				.select()
				.from(roundResults)
				.where(eq(roundResults.roundId, roundId))
				.limit(1);

			return row ? rowToRoundResult(row) : null;
		},

		async listRoundResults(roomId) {
			const rows = await db.select().from(roundResults).where(eq(roundResults.roomId, roomId));

			return rows.map(rowToRoundResult);
		},

		async saveRoundResult(input: NewRoundResult) {
			const [row] = await db
				.insert(roundResults)
				.values({
					id: input.id,
					roundId: input.roundId,
					roomId: input.roomId,
					outcome: input.outcome,
					proCount: input.proCount,
					contraCount: input.contraCount,
					totalVotes: input.totalVotes,
					finalizedById: input.finalizedById,
					finalizedAt: input.finalizedAt,
				})
				.returning();

			if (!row) {
				throw new Error("Round result insert failed");
			}

			return rowToRoundResult(row);
		},

		async findRoomResult(roomId) {
			const [row] = await db
				.select()
				.from(roomResults)
				.where(eq(roomResults.roomId, roomId))
				.limit(1);

			return row ? rowToRoomResult(row) : null;
		},

		async saveRoomResult(input: NewRoomResult) {
			const [row] = await db
				.insert(roomResults)
				.values({
					id: input.id,
					roomId: input.roomId,
					outcome: input.outcome,
					proWins: input.proWins,
					contraWins: input.contraWins,
					draws: input.draws,
					finalizedById: input.finalizedById,
					finalizedAt: input.finalizedAt,
				})
				.returning();

			if (!row) {
				throw new Error("Room result insert failed");
			}

			return rowToRoomResult(row);
		},
	};
};
