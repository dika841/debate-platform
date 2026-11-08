import type { Redis } from "@upstash/redis";
import type { RateLimiter } from "./memory-rate-limiter.ts";

export type UpstashRateLimiterOptions = {
	readonly redis: Redis;
	readonly limit: number;
	readonly windowMs: number;
	readonly now?: () => Date;
};

export const createUpstashRateLimiter = (options: UpstashRateLimiterOptions): RateLimiter => {
	const now = options.now ?? (() => new Date());

	return {
		async consume(key) {
			const redisKey = `ratelimit:${key}`;
			const count = await options.redis.incr(redisKey);

			if (count === 1) {
				await options.redis.expire(redisKey, Math.ceil(options.windowMs / 1000));
			}

			const ttl = Math.max(await options.redis.ttl(redisKey), 1);
			const resetAt = new Date(now().getTime() + ttl * 1000);

			return {
				allowed: count <= options.limit,
				limit: options.limit,
				remaining: Math.max(0, options.limit - count),
				resetAt,
			};
		},
	};
};
