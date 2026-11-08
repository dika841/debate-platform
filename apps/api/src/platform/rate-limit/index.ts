import { Redis } from "@upstash/redis";
import { env, isProduction } from "#/platform/config/env.ts";
import { logger } from "#/platform/observability/logger.ts";
import { createMemoryRateLimiter, type RateLimiter } from "./memory-rate-limiter.ts";
import { createUpstashRateLimiter } from "./upstash-rate-limiter.ts";

const WINDOW_MS = 60_000;

const createLimiter = (redis: Redis | null, limit: number): RateLimiter => {
	if (!redis) {
		return createMemoryRateLimiter({ limit, windowMs: WINDOW_MS });
	}

	return createUpstashRateLimiter({ redis, limit, windowMs: WINDOW_MS });
};

export const createRateLimiters = (): {
	readonly rpc: RateLimiter;
	readonly auth: RateLimiter;
} => {
	const redis =
		env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
			? new Redis({
					url: env.UPSTASH_REDIS_REST_URL,
					token: env.UPSTASH_REDIS_REST_TOKEN,
				})
			: null;

	if (isProduction && !redis) {
		logger.warn(
			{},
			"rate_limit.in_memory_production: set UPSTASH_REDIS_REST_URL/TOKEN for shared limits across instances",
		);
	}

	return {
		rpc: createLimiter(redis, env.RATE_LIMIT_RPC_PER_MINUTE),
		auth: createLimiter(redis, env.RATE_LIMIT_AUTH_PER_MINUTE),
	};
};

export type { RateLimitDecision, RateLimiter } from "./memory-rate-limiter.ts";
