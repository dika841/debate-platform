import type { MiddlewareHandler } from "hono";
import { metrics } from "#/platform/observability/metrics.ts";
import type { RateLimiter } from "./memory-rate-limiter.ts";

export type RateLimitKey = "ip" | "session";

export type RateLimitMiddlewareOptions = {
	readonly limiter: RateLimiter;
	readonly scope: string;
	readonly keyBy?: RateLimitKey;
	readonly now?: () => Date;
};

const clientIdentifier = (headers: Headers): string =>
	headers.get("cf-connecting-ip") ??
	headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
	headers.get("x-real-ip") ??
	"unknown";

const hashIdentifier = (value: string): string => {
	let hash = 2_166_136_261;

	for (let index = 0; index < value.length; index += 1) {
		hash ^= value.charCodeAt(index);
		hash = Math.imul(hash, 16_777_619);
	}

	return (hash >>> 0).toString(36);
};

const rateLimitKey = (headers: Headers, keyBy: RateLimitKey): string => {
	if (keyBy === "session") {
		const cookie = headers.get("cookie");

		if (cookie && cookie.length > 0) {
			return `session:${hashIdentifier(cookie)}`;
		}
	}

	return `ip:${clientIdentifier(headers)}`;
};

export const rateLimitMiddleware = (options: RateLimitMiddlewareOptions): MiddlewareHandler => {
	const now = options.now ?? (() => new Date());
	const keyBy = options.keyBy ?? "ip";

	return async (context, next) => {
		const identifier = rateLimitKey(context.req.raw.headers, keyBy);
		const decision = await options.limiter.consume(`${options.scope}:${identifier}`);

		context.header("x-ratelimit-limit", String(decision.limit));
		context.header("x-ratelimit-remaining", String(decision.remaining));
		context.header("x-ratelimit-reset", decision.resetAt.toISOString());

		if (!decision.allowed) {
			metrics.increment("rate_limit_rejections_total", {
				scope: options.scope,
			});

			const retryAfterSeconds = Math.max(
				1,
				Math.ceil((decision.resetAt.getTime() - now().getTime()) / 1000),
			);

			return context.json(
				{
					error: "RATE_LIMITED",
					message: "Too many requests. Try again later.",
					retryAfterSeconds,
				},
				429,
				{ "retry-after": String(retryAfterSeconds) },
			);
		}

		await next();
	};
};
