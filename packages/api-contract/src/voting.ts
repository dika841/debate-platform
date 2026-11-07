import { z } from "zod";
import { teamSideSchema } from "./memberships.ts";

export const castVoteInputSchema = z.object({
	roundId: z.string().min(1),
	team: teamSideSchema,
});

export const voteSummaryInputSchema = z.object({
	roundId: z.string().min(1),
});

export const voteSummarySchema = z.object({
	roundId: z.string(),
	revealed: z.boolean(),
	proCount: z.number().int().nonnegative(),
	contraCount: z.number().int().nonnegative(),
	totalCount: z.number().int().nonnegative(),
	viewerVote: teamSideSchema.nullable(),
});

export type CastVoteInput = z.infer<typeof castVoteInputSchema>;
export type VoteSummaryInput = z.infer<typeof voteSummaryInputSchema>;
export type VoteSummary = z.infer<typeof voteSummarySchema>;
