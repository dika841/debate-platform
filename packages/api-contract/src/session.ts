import { z } from "zod";

export const userIdSchema = z.string().min(1);

export const sessionUserSchema = z.object({
	id: userIdSchema,
	name: z.string(),
	email: z.string().email(),
	image: z.string().nullable(),
	role: z.string(),
	twoFactorEnabled: z.boolean(),
});

export const sessionSchema = z.object({
	id: z.string(),
	userId: userIdSchema,
	expiresAt: z.coerce.date(),
	user: sessionUserSchema,
});

export const getSessionOutputSchema = z.object({
	session: sessionSchema.nullable(),
});

export type SessionUser = z.infer<typeof sessionUserSchema>;
export type AppSession = z.infer<typeof sessionSchema>;
export type GetSessionOutput = z.infer<typeof getSessionOutputSchema>;
