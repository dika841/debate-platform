import { AUTH } from "@app/messages";
import { z } from "zod";

export const registerSchema = z
	.object({
		name: z.string().trim().min(1, AUTH.nameRequired).max(80, AUTH.nameRequired),
		email: z.string().trim().min(1, AUTH.emailRequired).email(AUTH.emailInvalid),
		password: z.string().min(12, AUTH.passwordTooShort).max(128, AUTH.passwordTooLong),
		confirmPassword: z.string().min(1, AUTH.passwordRequired),
	})
	.refine((values) => values.password === values.confirmPassword, {
		path: ["confirmPassword"],
		message: AUTH.passwordsMismatch,
	});

export type RegisterInput = z.infer<typeof registerSchema>;
