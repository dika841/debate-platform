import { RESULT_OUTCOME } from "@app/shared";
import { z } from "zod";
import { roundStatusSchema } from "./execution.ts";

export const resultOutcomeSchema = z.enum([
	RESULT_OUTCOME.PRO,
	RESULT_OUTCOME.CONTRA,
	RESULT_OUTCOME.DRAW,
]);

export const roundResultSchema = z.object({
	roundId: z.string(),
	roundNumber: z.number().int().positive(),
	outcome: resultOutcomeSchema,
	proCount: z.number().int().nonnegative(),
	contraCount: z.number().int().nonnegative(),
	totalVotes: z.number().int().nonnegative(),
	finalizedAt: z.string(),
});

export const roomRoundResultSchema = z.object({
	roundId: z.string(),
	roundNumber: z.number().int().positive(),
	status: roundStatusSchema,
	result: roundResultSchema.nullable(),
});

export const roomResultSchema = z.object({
	roomId: z.string(),
	outcome: resultOutcomeSchema,
	proWins: z.number().int().nonnegative(),
	contraWins: z.number().int().nonnegative(),
	draws: z.number().int().nonnegative(),
	finalizedAt: z.string(),
});

export const getRoomResultsInputSchema = z.object({
	roomId: z.string().min(1),
});

export const getRoomResultsOutputSchema = z.object({
	rounds: z.array(roomRoundResultSchema),
	roomResult: roomResultSchema.nullable(),
});

export const finalizeRoundInputSchema = z.object({
	roundId: z.string().min(1),
});

export const finalizeRoomInputSchema = z.object({
	roomId: z.string().min(1),
});

export type ResultOutcomeValue = z.infer<typeof resultOutcomeSchema>;
export type RoundResult = z.infer<typeof roundResultSchema>;
export type RoomRoundResult = z.infer<typeof roomRoundResultSchema>;
export type RoomResult = z.infer<typeof roomResultSchema>;
export type RoomResults = z.infer<typeof getRoomResultsOutputSchema>;
