import { AUTH } from "@app/messages";
import { z } from "zod";

const newPassword = z.string().min(12, AUTH.passwordTooShort).max(128, AUTH.passwordTooLong);

export const forgotPasswordSchema = z.object({
	email: z.string().trim().min(1, AUTH.emailRequired).email(AUTH.emailInvalid),
});

export const resetPasswordSchema = z
	.object({
		password: newPassword,
		confirmPassword: z.string().min(1, AUTH.passwordRequired),
	})
	.refine((values) => values.password === values.confirmPassword, {
		path: ["confirmPassword"],
		message: AUTH.passwordsMismatch,
	});

export const changePasswordSchema = z
	.object({
		currentPassword: z.string().min(1, AUTH.currentPasswordRequired),
		newPassword,
		confirmPassword: z.string().min(1, AUTH.passwordRequired),
	})
	.refine((values) => values.newPassword === values.confirmPassword, {
		path: ["confirmPassword"],
		message: AUTH.passwordsMismatch,
	});

export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
