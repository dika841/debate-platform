import type { Database } from "@app/database";
import { roundVotes } from "@app/database/schema";
import { TEAM_SIDE, type TeamSide } from "@app/shared";
import { and, eq, sql } from "drizzle-orm";
import type {
	CastVoteOutcome,
	NewVote,
	VoteCounts,
	VoteRecord,
	VoteRepository,
} from "../../application/ports/vote-repository.ts";

const rowToVote = (row: typeof roundVotes.$inferSelect): VoteRecord => ({
	id: row.id,
	roundId: row.roundId,
	roomId: row.roomId,
	voterId: row.voterId,
	team: row.team as TeamSide,
	castAt: row.castAt,
});

export const createDrizzleVoteRepository = (db: Database): VoteRepository => {
	return {
		async cast(input: NewVote): Promise<CastVoteOutcome> {
			const [created] = await db
				.insert(roundVotes)
				.values({
					id: input.id,
					roundId: input.roundId,
					roomId: input.roomId,
					voterId: input.voterId,
					team: input.team,
					castAt: input.castAt,
				})
				.onConflictDoNothing({ target: [roundVotes.roundId, roundVotes.voterId] })
				.returning();

			if (!created) {
				return { kind: "duplicate" };
			}

			return { kind: "created", vote: rowToVote(created) };
		},

		async findByRoundAndVoter(roundId, voterId) {
			const [row] = await db
				.select()
				.from(roundVotes)
				.where(and(eq(roundVotes.roundId, roundId), eq(roundVotes.voterId, voterId)))
				.limit(1);

			return row ? rowToVote(row) : null;
		},

		async counts(roundId): Promise<VoteCounts> {
			const rows = await db
				.select({
					team: roundVotes.team,
					value: sql<number>`count(*)::int`,
				})
				.from(roundVotes)
				.where(eq(roundVotes.roundId, roundId))
				.groupBy(roundVotes.team);

			const countFor = (team: TeamSide): number =>
				Number(rows.find((row) => row.team === team)?.value ?? 0);

			const proCount = countFor(TEAM_SIDE.PRO);
			const contraCount = countFor(TEAM_SIDE.CONTRA);

			return {
				proCount,
				contraCount,
				totalCount: proCount + contraCount,
			};
		},
	};
};
