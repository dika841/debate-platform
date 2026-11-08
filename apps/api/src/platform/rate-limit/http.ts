import type { Context } from "hono";
import { metrics } from "#/platform/observability/metrics.ts";
import type { RateLimiter } from "./memory-rate-limiter.ts";

export type ApplyRateLimitOptions = {
	readonly limiter: RateLimiter;
	readonly scope: string;
	readonly identifier: string;
	readonly now?: () => Date;
};

export const applyRateLimit = async (
	context: Context,
	options: ApplyRateLimitOptions,
): Promise<Response | null> => {
	const now = options.now ?? (() => new Date());
	const decision = await options.limiter.consume(`${options.scope}:${options.identifier}`);

	context.header("x-ratelimit-limit", String(decision.limit));
	context.header("x-ratelimit-remaining", String(decision.remaining));
	context.header("x-ratelimit-reset", decision.resetAt.toISOString());

	if (decision.allowed) {
		return null;
	}

	metrics.increment("rate_limit_rejections_total", { scope: options.scope });

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
};
