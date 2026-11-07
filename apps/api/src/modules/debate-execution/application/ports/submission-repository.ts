import type { TeamSide } from "@app/shared";

export type SubmissionAuthor = {
	readonly id: string;
	readonly displayName: string;
	readonly username: string | null;
};

export type SubmissionRecord = {
	readonly id: string;
	readonly roundId: string;
	readonly roomId: string;
	readonly authorId: string;
	readonly team: TeamSide;
	readonly content: string;
	readonly submittedAt: Date;
};

export type SubmissionWithAuthor = {
	readonly submission: SubmissionRecord;
	readonly author: SubmissionAuthor;
};

export type NewSubmission = {
	readonly id: string;
	readonly roundId: string;
	readonly roomId: string;
	readonly authorId: string;
	readonly team: TeamSide;
	readonly content: string;
	readonly submittedAt: Date;
};

export interface SubmissionRepository {
	create(input: NewSubmission): Promise<SubmissionWithAuthor>;
	findByRoundAndAuthor(roundId: string, authorId: string): Promise<SubmissionWithAuthor | null>;
	listByRound(roundId: string, authorId?: string | null): Promise<readonly SubmissionWithAuthor[]>;
	countByRound(roundId: string): Promise<number>;
}
