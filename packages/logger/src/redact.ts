const SENSITIVE_KEY_PATTERN =
	/password|passwd|token|secret|cookie|authorization|api[-_]?key|email|username/i;

const DROPPED_ERROR_FIELDS = new Set([
	"params",
	"query",
	"detail",
	"hint",
	"where",
	"internalQuery",
	"message",
	"stack",
]);

const MAX_DEPTH = 4;

const redactString = (value: string): string =>
	value
		.replace(/[^\s@]+@[^\s@]+\.[^\s@]+/g, "[email]")
		.replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]");

const safeErrorCode = (error: unknown): string | undefined => {
	if (typeof error === "object" && error !== null && "code" in error) {
		const code = (error as { code?: unknown }).code;
		return typeof code === "string" ? code : undefined;
	}

	return undefined;
};

const safeErrorField = (error: unknown, field: string): string | undefined => {
	if (typeof error === "object" && error !== null && field in error) {
		const value = (error as Record<string, unknown>)[field];
		return typeof value === "string" ? redactString(value) : undefined;
	}

	return undefined;
};

const redactValue = (value: unknown, depth: number): unknown => {
	if (depth > MAX_DEPTH) {
		return "[truncated]";
	}

	if (value instanceof Error) {
		return redactError(value, depth + 1);
	}

	if (Array.isArray(value)) {
		return value.slice(0, 20).map((entry) => redactValue(entry, depth + 1));
	}

	if (typeof value === "string") {
		return redactString(value);
	}

	if (typeof value !== "object" || value === null) {
		return value;
	}

	const result: Record<string, unknown> = {};

	for (const [key, entry] of Object.entries(value)) {
		if (SENSITIVE_KEY_PATTERN.test(key) || DROPPED_ERROR_FIELDS.has(key)) {
			result[key] = "[redacted]";
			continue;
		}

		result[key] = redactValue(entry, depth + 1);
	}

	return result;
};

/**
 * Produces a log-safe error payload. Error messages, SQL params and pg
 * `detail` fields can contain emails/usernames, so only stable metadata and
 * stack frames are retained.
 */
export const redactError = (error: unknown, depth = 0): unknown => {
	if (!(error instanceof Error)) {
		return redactValue(error, depth);
	}

	const stackFrames = error.stack?.split("\n").slice(1).join("\n");
	const safe: Record<string, unknown> = {
		name: error.name,
	};

	const code = safeErrorCode(error) ?? safeErrorCode(error.cause);

	if (code) {
		safe.code = code;
	}

	for (const field of ["constraint", "table", "schema", "routine", "severity"]) {
		const value = safeErrorField(error, field) ?? safeErrorField(error.cause, field);

		if (value) {
			safe[field] = value;
		}
	}

	if (stackFrames) {
		safe.stack = stackFrames;
	}

	if (error.cause && error.cause !== error) {
		safe.cause = redactError(error.cause, depth + 1);
	}

	return safe;
};
