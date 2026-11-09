import {
	ROOM_DESCRIPTION_MAX,
	ROOM_DURATION_MAX,
	ROOM_DURATION_MIN,
	ROOM_MOTION_MAX,
	ROOM_ROUND_COUNT_MAX,
	ROOM_ROUND_COUNT_MIN,
	ROOM_TEAM_SIZE_MAX,
	ROOM_TEAM_SIZE_MIN,
	ROOM_TITLE_MAX,
} from "@app/api-contract";
import { z } from "zod";

const numberRange = (label: string, min: number, max: number) =>
	z
		.number()
		.int(`${label} must be a whole number.`)
		.min(min, `${label} must be at least ${min}.`)
		.max(max, `${label} must be at most ${max}.`);

export const roomFormSchema = z.object({
	title: z
		.string()
		.trim()
		.min(3, "Title must be at least 3 characters.")
		.max(ROOM_TITLE_MAX, `Title must be at most ${ROOM_TITLE_MAX} characters.`),
	motion: z
		.string()
		.trim()
		.min(5, "Motion must be at least 5 characters.")
		.max(ROOM_MOTION_MAX, `Motion must be at most ${ROOM_MOTION_MAX} characters.`),
	description: z.string().max(ROOM_DESCRIPTION_MAX, "Description is too long."),
	teamSize: numberRange("Team size", ROOM_TEAM_SIZE_MIN, ROOM_TEAM_SIZE_MAX),
	roundCount: numberRange("Rounds", ROOM_ROUND_COUNT_MIN, ROOM_ROUND_COUNT_MAX),
	submissionDurationMinutes: numberRange("Submission window", ROOM_DURATION_MIN, ROOM_DURATION_MAX),
	votingDurationMinutes: numberRange("Voting window", ROOM_DURATION_MIN, ROOM_DURATION_MAX),
	spectatorVotingEnabled: z.boolean(),
});

export type RoomFormInput = z.infer<typeof roomFormSchema>;
