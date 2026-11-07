import type { Database } from "@app/database";
import { roundSubmissions, userProfiles, users } from "@app/database/schema";
import type { TeamSide } from "@app/shared";
import { and, asc, eq, sql } from "drizzle-orm";
import type {
	NewSubmission,
	SubmissionRepository,
	SubmissionWithAuthor,
} from "../../application/ports/submission-repository.ts";

type SubmissionRow = {
	id: string;
	roundId: string;
	roomId: string;
	authorId: string;
	team: string;
	content: string;
	submittedAt: Date;
	name: string;
	displayName: string | null;
	username: string | null;
};

const submissionSelection = {
	id: roundSubmissions.id,
	roundId: roundSubmissions.roundId,
	roomId: roundSubmissions.roomId,
	authorId: roundSubmissions.authorId,
	team: roundSubmissions.team,
	content: roundSubmissions.content,
	submittedAt: roundSubmissions.submittedAt,
	name: users.name,
	displayName: userProfiles.displayName,
	username: userProfiles.username,
};

const rowToSubmission = (row: SubmissionRow): SubmissionWithAuthor => ({
	submission: {
		id: row.id,
		roundId: row.roundId,
		roomId: row.roomId,
		authorId: row.authorId,
		team: row.team as TeamSide,
		content: row.content,
		submittedAt: row.submittedAt,
	},
	author: {
		id: row.authorId,
		displayName: row.displayName ?? row.name,
		username: row.username,
	},
});

export const createDrizzleSubmissionRepository = (db: Database): SubmissionRepository => {
	const findById = async (id: string): Promise<SubmissionWithAuthor | null> => {
		const [row] = await db
			.select(submissionSelection)
			.from(roundSubmissions)
			.innerJoin(users, eq(roundSubmissions.authorId, users.id))
			.leftJoin(userProfiles, eq(userProfiles.userId, users.id))
			.where(eq(roundSubmissions.id, id))
			.limit(1);

		return row ? rowToSubmission(row) : null;
	};

	return {
		async create(input: NewSubmission) {
			await db.insert(roundSubmissions).values({
				id: input.id,
				roundId: input.roundId,
				roomId: input.roomId,
				authorId: input.authorId,
				team: input.team,
				content: input.content,
				submittedAt: input.submittedAt,
			});

			const created = await findById(input.id);

			if (!created) {
				throw new Error("Submission insert failed");
			}

			return created;
		},

		async findByRoundAndAuthor(roundId, authorId) {
			const [row] = await db
				.select(submissionSelection)
				.from(roundSubmissions)
				.innerJoin(users, eq(roundSubmissions.authorId, users.id))
				.leftJoin(userProfiles, eq(userProfiles.userId, users.id))
				.where(and(eq(roundSubmissions.roundId, roundId), eq(roundSubmissions.authorId, authorId)))
				.limit(1);

			return row ? rowToSubmission(row) : null;
		},

		async listByRound(roundId, authorId) {
			const conditions = [eq(roundSubmissions.roundId, roundId)];

			if (authorId) {
				conditions.push(eq(roundSubmissions.authorId, authorId));
			}

			const rows = await db
				.select(submissionSelection)
				.from(roundSubmissions)
				.innerJoin(users, eq(roundSubmissions.authorId, users.id))
				.leftJoin(userProfiles, eq(userProfiles.userId, users.id))
				.where(and(...conditions))
				.orderBy(asc(roundSubmissions.submittedAt), asc(roundSubmissions.id));

			return rows.map(rowToSubmission);
		},

		async countByRound(roundId) {
			const [row] = await db
				.select({ value: sql<number>`count(*)::int` })
				.from(roundSubmissions)
				.where(eq(roundSubmissions.roundId, roundId));

			return Number(row?.value ?? 0);
		},
	};
};
