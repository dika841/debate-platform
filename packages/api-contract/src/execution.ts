import { ROUND_STATUS } from "@app/shared";
import { z } from "zod";
import { teamSideSchema } from "./memberships.ts";

export const SUBMISSION_CONTENT_MIN = 50;
export const SUBMISSION_CONTENT_MAX = 5000;

export const roundStatusSchema = z.enum([
	ROUND_STATUS.PENDING,
	ROUND_STATUS.OPEN,
	ROUND_STATUS.CLOSED,
]);

export const roundSchema = z.object({
	id: z.string(),
	roomId: z.string(),
	roundNumber: z.number().int().positive(),
	status: roundStatusSchema,
	opensAt: z.string().nullable(),
	submissionDeadline: z.string().nullable(),
	submissionCount: z.number().int().nonnegative(),
});

export const listRoundsInputSchema = z.object({
	roomId: z.string().min(1),
});

export const listRoundsOutputSchema = z.object({
	items: z.array(roundSchema),
});

export const startDebateInputSchema = z.object({
	roomId: z.string().min(1),
});

export const advanceRoundInputSchema = z.object({
	roomId: z.string().min(1),
});

export const submissionAuthorSchema = z.object({
	id: z.string(),
	displayName: z.string(),
	username: z.string().nullable(),
});

export const submissionSchema = z.object({
	id: z.string(),
	roundId: z.string(),
	roomId: z.string(),
	authorId: z.string(),
	author: submissionAuthorSchema,
	team: teamSideSchema,
	content: z.string(),
	submittedAt: z.string(),
});

export const createSubmissionInputSchema = z.object({
	roundId: z.string().min(1),
	content: z.string().trim().min(SUBMISSION_CONTENT_MIN).max(SUBMISSION_CONTENT_MAX),
});

export const listSubmissionsInputSchema = z.object({
	roundId: z.string().min(1),
});

export const listSubmissionsOutputSchema = z.object({
	items: z.array(submissionSchema),
});

export type RoundStatusValue = z.infer<typeof roundStatusSchema>;
export type Round = z.infer<typeof roundSchema>;
export type ListRoundsResult = z.infer<typeof listRoundsOutputSchema>;
export type Submission = z.infer<typeof submissionSchema>;
export type CreateSubmissionInput = z.infer<typeof createSubmissionInputSchema>;
export type ListSubmissionsResult = z.infer<typeof listSubmissionsOutputSchema>;
