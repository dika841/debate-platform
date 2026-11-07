const POSTGRES_UNIQUE_VIOLATION = "23505";
const MAX_CAUSE_DEPTH = 5;

const codeOf = (error: unknown): unknown =>
	typeof error === "object" && error !== null && "code" in error
		? (error as { code?: unknown }).code
		: undefined;

const causeOf = (error: unknown): unknown =>
	typeof error === "object" && error !== null && "cause" in error
		? (error as { cause?: unknown }).cause
		: undefined;

/**
 * Drizzle wraps driver errors (DrizzleQueryError), so the PostgreSQL SQLSTATE
 * can live on the error itself or on a nested `cause`.
 */
export const isUniqueViolation = (error: unknown): boolean => {
	let current = error;

	for (let depth = 0; depth < MAX_CAUSE_DEPTH; depth += 1) {
		if (codeOf(current) === POSTGRES_UNIQUE_VIOLATION) {
			return true;
		}

		current = causeOf(current);
		if (current === undefined || current === null || current === error) {
			return false;
		}
	}

	return false;
};
