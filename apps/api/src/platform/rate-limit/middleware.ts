import type { MiddlewareHandler } from "hono";
import { resolveClientIp, type ProxyMode } from "./client-ip.ts";
import { applyRateLimit } from "./http.ts";
import type { RateLimiter } from "./memory-rate-limiter.ts";

export type RateLimitMiddlewareOptions = {
	readonly limiter: RateLimiter;
	readonly scope: string;
	readonly proxyMode: ProxyMode;
	readonly now?: () => Date;
};

export const rateLimitMiddleware = (options: RateLimitMiddlewareOptions): MiddlewareHandler => {
	return async (context, next) => {
		const identifier = resolveClientIp(context.req.raw.headers, options.proxyMode);
		const limited = await applyRateLimit(context, {
			limiter: options.limiter,
			scope: options.scope,
			identifier,
			now: options.now,
		});

		if (limited) {
			return limited;
		}

		await next();
	};
};
