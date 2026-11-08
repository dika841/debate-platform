const INTERNAL_PATH_PREFIX = "/";

/**
 * Only allows same-site absolute paths. Rejects protocol-relative URLs
 * (`//evil.example`), backslash tricks and absolute URLs.
 */
export const safeInternalPath = (value: string | undefined, fallback = "/"): string => {
	if (!value) {
		return fallback;
	}

	if (!value.startsWith(INTERNAL_PATH_PREFIX)) {
		return fallback;
	}

	if (value.startsWith("//") || value.includes("\\")) {
		return fallback;
	}

	return value;
};
