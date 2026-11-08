import { describe, expect, it } from "vitest";
import { createMemoryRateLimiter } from "./memory-rate-limiter.ts";

describe("memory rate limiter", () => {
	it("allows requests up to the limit and resets after the window", async () => {
		let current = new Date("2026-06-01T10:00:00.000Z");
		const limiter = createMemoryRateLimiter({
			limit: 2,
			windowMs: 1_000,
			now: () => current,
		});

		expect(await limiter.consume("ip-1")).toMatchObject({
			allowed: true,
			remaining: 1,
		});
		expect(await limiter.consume("ip-1")).toMatchObject({
			allowed: true,
			remaining: 0,
		});
		expect(await limiter.consume("ip-1")).toMatchObject({
			allowed: false,
			remaining: 0,
		});
		expect(await limiter.consume("ip-2")).toMatchObject({ allowed: true });

		current = new Date("2026-06-01T10:00:02.000Z");
		expect(await limiter.consume("ip-1")).toMatchObject({ allowed: true });
	});
});
