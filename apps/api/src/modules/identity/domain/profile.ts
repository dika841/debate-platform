import { DOMAIN_ERROR_CODE, DomainError, err, ok, type Result } from "@app/shared";

export const USERNAME_PATTERN = /^[a-z0-9_]{3,30}$/;
export const DISPLAY_NAME_MAX = 80;
export const BIO_MAX = 500;
export const AVATAR_URL_MAX = 2048;

export const normalizeUsername = (value: string): string => value.trim().toLowerCase();

export const usernameFromEmail = (email: string, userId: string): string => {
	const localPart = email.split("@")[0] ?? "";
	const sanitized = localPart
		.toLowerCase()
		.replace(/[^a-z0-9_]/g, "_")
		.replace(/_+/g, "_")
		.replace(/^_|_$/g, "")
		.slice(0, 20);

	if (sanitized.length >= 3) {
		return sanitized;
	}

	return `user_${userId.replace(/-/g, "").slice(0, 8)}`;
};

export const validateDisplayName = (value: string): Result<string, DomainError> => {
	const trimmed = value.trim();

	if (trimmed.length === 0) {
		return err(new DomainError(DOMAIN_ERROR_CODE.INVALID_PROFILE, "Display name is required"));
	}

	if (trimmed.length > DISPLAY_NAME_MAX) {
		return err(
			new DomainError(
				DOMAIN_ERROR_CODE.INVALID_PROFILE,
				`Display name must be at most ${DISPLAY_NAME_MAX} characters`,
			),
		);
	}

	return ok(trimmed);
};

export const validateUsername = (value: string): Result<string, DomainError> => {
	const normalized = normalizeUsername(value);

	if (!USERNAME_PATTERN.test(normalized)) {
		return err(
			new DomainError(
				DOMAIN_ERROR_CODE.INVALID_PROFILE,
				"Username must be 3-30 characters using a-z, 0-9 or underscore",
			),
		);
	}

	return ok(normalized);
};

export const validateBio = (value: string | null): Result<string | null, DomainError> => {
	if (value === null) {
		return ok(null);
	}

	const trimmed = value.trim();

	if (trimmed.length > BIO_MAX) {
		return err(
			new DomainError(
				DOMAIN_ERROR_CODE.INVALID_PROFILE,
				`Bio must be at most ${BIO_MAX} characters`,
			),
		);
	}

	return ok(trimmed.length === 0 ? null : trimmed);
};

export const validateAvatarUrl = (value: string | null): Result<string | null, DomainError> => {
	if (value === null || value.trim().length === 0) {
		return ok(null);
	}

	const trimmed = value.trim();

	if (trimmed.length > AVATAR_URL_MAX) {
		return err(
			new DomainError(
				DOMAIN_ERROR_CODE.INVALID_PROFILE,
				`Avatar URL must be at most ${AVATAR_URL_MAX} characters`,
			),
		);
	}

	try {
		const parsed = new URL(trimmed);
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
			return err(
				new DomainError(DOMAIN_ERROR_CODE.INVALID_PROFILE, "Avatar URL must use http or https"),
			);
		}
	} catch {
		return err(new DomainError(DOMAIN_ERROR_CODE.INVALID_PROFILE, "Avatar URL is invalid"));
	}

	return ok(trimmed);
};
