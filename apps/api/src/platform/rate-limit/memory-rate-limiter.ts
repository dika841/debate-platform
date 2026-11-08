export type RateLimitDecision = {
	readonly allowed: boolean;
	readonly limit: number;
	readonly remaining: number;
	readonly resetAt: Date;
};

export interface RateLimiter {
	consume(key: string): Promise<RateLimitDecision>;
}

export type MemoryRateLimiterOptions = {
	readonly limit: number;
	readonly windowMs: number;
	readonly now?: () => Date;
};

type Bucket = {
	count: number;
	resetAt: Date;
};

const MAX_BUCKETS = 10_000;

export const createMemoryRateLimiter = (options: MemoryRateLimiterOptions): RateLimiter => {
	const buckets = new Map<string, Bucket>();
	const now = options.now ?? (() => new Date());

	return {
		async consume(key) {
			const current = now();
			let bucket = buckets.get(key);

			if (!bucket || bucket.resetAt.getTime() <= current.getTime()) {
				bucket = {
					count: 0,
					resetAt: new Date(current.getTime() + options.windowMs),
				};
				buckets.set(key, bucket);
			}

			if (bucket.count >= options.limit) {
				return {
					allowed: false,
					limit: options.limit,
					remaining: 0,
					resetAt: bucket.resetAt,
				};
			}

			bucket.count += 1;

			if (buckets.size > MAX_BUCKETS) {
				for (const [bucketKey, entry] of buckets) {
					if (entry.resetAt.getTime() <= current.getTime()) {
						buckets.delete(bucketKey);
					}
				}
			}

			return {
				allowed: true,
				limit: options.limit,
				remaining: Math.max(0, options.limit - bucket.count),
				resetAt: bucket.resetAt,
			};
		},
	};
};
