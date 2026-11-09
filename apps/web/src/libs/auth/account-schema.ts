import { USERNAME_PATTERN } from "@app/api-contract";
import { AUTH } from "@app/messages";
import { z } from "zod";

export const profileFormSchema = z.object({
	displayName: z.string().trim().min(1, AUTH.nameRequired).max(80, AUTH.nameRequired),
	username: z.union([
		z.literal(""),
		z.string().trim().toLowerCase().regex(USERNAME_PATTERN, AUTH.usernameInvalid),
	]),
	bio: z.string().max(500, AUTH.bioTooLong),
	avatarUrl: z.union([z.literal(""), z.string().url(AUTH.avatarUrlInvalid).max(2048)]),
});

export const twoFactorCodeSchema = z.object({
	code: z
		.string()
		.trim()
		.regex(/^\d{6}$/, AUTH.invalidCode),
});

export const twoFactorPasswordSchema = z.object({
	currentPassword: z.string().min(1, AUTH.currentPasswordRequired),
});

export const deleteAccountSchema = z.object({
	password: z.string().min(1, AUTH.passwordRequired),
	confirmation: z
		.string()
		.refine((value): boolean => value === AUTH.deleteConfirmationValue, AUTH.deleteConfirmation),
});

export type ProfileFormInput = z.infer<typeof profileFormSchema>;
export type TwoFactorCodeInput = z.infer<typeof twoFactorCodeSchema>;
export type TwoFactorPasswordInput = z.infer<typeof twoFactorPasswordSchema>;
export type DeleteAccountInput = z.infer<typeof deleteAccountSchema>;
