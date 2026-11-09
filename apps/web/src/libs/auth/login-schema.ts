import { AUTH } from "@app/messages";
import { z } from "zod";

export const loginSchema = z.object({
	email: z.string().trim().min(1, AUTH.emailRequired).email(AUTH.emailInvalid),
	password: z.string().min(1, AUTH.passwordRequired),
});

export const twoFactorSchema = z.object({
	code: z
		.string()
		.trim()
		.regex(/^\d{6}$/, AUTH.invalidCode),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type TwoFactorInput = z.infer<typeof twoFactorSchema>;
