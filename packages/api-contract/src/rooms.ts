import { ROOM_STATUS } from "@app/shared";
import { z } from "zod";

export const ROOM_TITLE_MAX = 120;
export const ROOM_MOTION_MAX = 300;
export const ROOM_DESCRIPTION_MAX = 2000;
export const ROOM_TEAM_SIZE_MIN = 1;
export const ROOM_TEAM_SIZE_MAX = 5;
export const ROOM_ROUND_COUNT_MIN = 1;
export const ROOM_ROUND_COUNT_MAX = 5;
export const ROOM_DURATION_MIN = 5;
export const ROOM_DURATION_MAX = 120;

export const roomStatusSchema = z.enum([
	ROOM_STATUS.DRAFT,
	ROOM_STATUS.PUBLISHED,
	ROOM_STATUS.IN_PROGRESS,
	ROOM_STATUS.COMPLETED,
	ROOM_STATUS.CANCELLED,
]);

export const roomHostSchema = z.object({
	id: z.string(),
	displayName: z.string(),
	username: z.string().nullable(),
});

export const roomSchema = z.object({
	id: z.string(),
	host: roomHostSchema,
	title: z.string(),
	motion: z.string(),
	description: z.string().nullable(),
	status: roomStatusSchema,
	teamSize: z.number().int(),
	roundCount: z.number().int(),
	submissionDurationMinutes: z.number().int(),
	votingDurationMinutes: z.number().int(),
	spectatorVotingEnabled: z.boolean(),
	publishedAt: z.string().nullable(),
	cancelledAt: z.string().nullable(),
	createdAt: z.string(),
	updatedAt: z.string(),
	isHost: z.boolean(),
});

export const roomIdInputSchema = z.object({
	id: z.string().min(1),
});

export const listRoomsInputSchema = z.object({
	scope: z.enum(["public", "mine"]).default("public"),
	status: roomStatusSchema.optional(),
	cursor: z.string().min(1).optional(),
	limit: z.number().int().min(1).max(50).optional(),
});

export const listRoomsOutputSchema = z.object({
	items: z.array(roomSchema),
	nextCursor: z.string().nullable(),
});

const roomConfigurationSchema = z.object({
	title: z.string().trim().min(3).max(ROOM_TITLE_MAX),
	motion: z.string().trim().min(5).max(ROOM_MOTION_MAX),
	description: z.string().trim().max(ROOM_DESCRIPTION_MAX).nullable().optional(),
	teamSize: z.number().int().min(ROOM_TEAM_SIZE_MIN).max(ROOM_TEAM_SIZE_MAX).default(3),
	roundCount: z.number().int().min(ROOM_ROUND_COUNT_MIN).max(ROOM_ROUND_COUNT_MAX).default(3),
	submissionDurationMinutes: z
		.number()
		.int()
		.min(ROOM_DURATION_MIN)
		.max(ROOM_DURATION_MAX)
		.default(30),
	votingDurationMinutes: z.number().int().min(ROOM_DURATION_MIN).max(ROOM_DURATION_MAX).default(30),
	spectatorVotingEnabled: z.boolean().default(true),
});

export const createRoomInputSchema = roomConfigurationSchema;

export const updateRoomInputSchema = roomConfigurationSchema.partial().extend({
	id: z.string().min(1),
});

export type Room = z.infer<typeof roomSchema>;
export type RoomHost = z.infer<typeof roomHostSchema>;
export type RoomStatusValue = z.infer<typeof roomStatusSchema>;
export type ListRoomsInput = z.input<typeof listRoomsInputSchema>;
export type ListRoomsResult = z.infer<typeof listRoomsOutputSchema>;
export type CreateRoomInput = z.input<typeof createRoomInputSchema>;
export type CreateRoomPayload = z.infer<typeof createRoomInputSchema>;
export type UpdateRoomInput = z.input<typeof updateRoomInputSchema>;
export type UpdateRoomPayload = z.infer<typeof updateRoomInputSchema>;
export type RoomIdInput = z.infer<typeof roomIdInputSchema>;
