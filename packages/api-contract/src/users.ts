import { z } from "zod";

export const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;

export const profileSchema = z.object({
	username: z.string().nullable(),
	displayName: z.string(),
	avatarUrl: z.string().nullable(),
	bio: z.string().nullable(),
});

export const userProfileSchema = z.object({
	id: z.string(),
	email: z.string().email(),
	name: z.string(),
	image: z.string().nullable(),
	role: z.string(),
	twoFactorEnabled: z.boolean(),
	profile: profileSchema,
});

export const updateProfileInputSchema = z.object({
	displayName: z.string().trim().min(1).max(80).optional(),
	username: z
		.string()
		.trim()
		.toLowerCase()
		.regex(USERNAME_PATTERN, "Username must be 3-30 characters: a-z, 0-9, underscore")
		.optional(),
	bio: z.string().max(500).nullable().optional(),
	avatarUrl: z.string().url().max(2048).nullable().optional(),
});

export type UserProfile = z.infer<typeof userProfileSchema>;
export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;
