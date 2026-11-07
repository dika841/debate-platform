import type { Round, Submission } from "@app/api-contract";
import { effectiveRoundStatus } from "../../domain/round.ts";
import type { RoundSummaryRecord } from "../ports/round-repository.ts";
import type { SubmissionWithAuthor } from "../ports/submission-repository.ts";

export const toRoundDto = (summary: RoundSummaryRecord, now: Date): Round => ({
	id: summary.round.id,
	roomId: summary.round.roomId,
	roundNumber: summary.round.roundNumber,
	status: effectiveRoundStatus(summary.round, now),
	opensAt: summary.round.opensAt?.toISOString() ?? null,
	submissionDeadline: summary.round.submissionDeadline?.toISOString() ?? null,
	submissionCount: summary.submissionCount,
});

export const toSubmissionDto = ({ submission, author }: SubmissionWithAuthor): Submission => ({
	id: submission.id,
	roundId: submission.roundId,
	roomId: submission.roomId,
	authorId: submission.authorId,
	author: {
		id: author.id,
		displayName: author.displayName,
		username: author.username,
	},
	team: submission.team,
	content: submission.content,
	submittedAt: submission.submittedAt.toISOString(),
});
