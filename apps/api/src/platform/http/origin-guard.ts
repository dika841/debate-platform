import type { MiddlewareHandler } from "hono";

const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const normalizeOrigin = (value: string): string => value.replace(/\/$/, "");

/**
 * Rejects state-changing browser requests from origins other than the
 * configured web origin. Requests without Origin/Referer are allowed so
 * non-browser clients and server-to-server calls keep working.
 */
export const originGuard = (allowedOrigins: readonly string[]): MiddlewareHandler => {
	const allowed = new Set(allowedOrigins.map(normalizeOrigin));

	return async (context, next) => {
		if (SAFE_METHODS.has(context.req.method)) {
			return next();
		}

		const origin = context.req.header("origin");

		if (origin) {
			if (!allowed.has(normalizeOrigin(origin))) {
				return context.json(
					{ error: "INVALID_ORIGIN", message: "Request origin is not allowed" },
					403,
				);
			}

			return next();
		}

		const referer = context.req.header("referer");

		if (referer) {
			try {
				if (!allowed.has(new URL(referer).origin)) {
					return context.json(
						{ error: "INVALID_ORIGIN", message: "Request origin is not allowed" },
						403,
					);
				}
			} catch {
				return context.json(
					{ error: "INVALID_ORIGIN", message: "Request origin is not allowed" },
					403,
				);
			}
		}

		return next();
	};
};
