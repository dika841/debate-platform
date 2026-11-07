import { z } from "zod";
import { teamSideSchema } from "./memberships.ts";

export const assignmentSummarySchema = z.object({
	assigned: z.number().int().nonnegative(),
	proCount: z.number().int().nonnegative(),
	contraCount: z.number().int().nonnegative(),
	finalizedAt: z.string().nullable(),
});

export const assignRoomInputSchema = z.object({
	roomId: z.string().min(1),
});

export const setTeamInputSchema = z.object({
	roomId: z.string().min(1),
	membershipId: z.string().min(1),
	team: teamSideSchema.nullable(),
});

export type AssignmentSummary = z.infer<typeof assignmentSummarySchema>;
export type AssignRoomInput = z.infer<typeof assignRoomInputSchema>;
export type SetTeamInput = z.infer<typeof setTeamInputSchema>;
