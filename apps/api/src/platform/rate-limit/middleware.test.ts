import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { createMemoryRateLimiter } from "./memory-rate-limiter.ts";
import { rateLimitMiddleware } from "./middleware.ts";

const buildApp = (keyBy: "ip" | "session" = "ip") => {
	const app = new Hono();
	app.use(
		"*",
		rateLimitMiddleware({
			limiter: createMemoryRateLimiter({
				limit: 1,
				windowMs: 60_000,
				now: () => new Date("2026-06-01T10:00:00.000Z"),
			}),
			scope: "test",
			keyBy,
			now: () => new Date("2026-06-01T10:00:00.000Z"),
		}),
	);
	app.get("/", (context) => context.text("ok"));
	return app;
};

describe("rate limit middleware", () => {
	it("returns 429 with rate-limit headers after the limit", async () => {
		const app = buildApp();
		const headers = { "x-forwarded-for": "203.0.113.7" };

		const first = await app.request("/", { headers });
		expect(first.status).toBe(200);
		expect(first.headers.get("x-ratelimit-limit")).toBe("1");
		expect(first.headers.get("x-ratelimit-remaining")).toBe("0");

		const second = await app.request("/", { headers });
		expect(second.status).toBe(429);
		expect(second.headers.get("retry-after")).toBe("60");

		const body = (await second.json()) as { error: string };
		expect(body.error).toBe("RATE_LIMITED");

		const otherClient = await app.request("/", {
			headers: { "x-forwarded-for": "203.0.113.8" },
		});
		expect(otherClient.status).toBe(200);
	});

	it("keys by session cookie when configured", async () => {
		const app = buildApp("session");

		expect((await app.request("/", { headers: { cookie: "session=one" } })).status).toBe(200);
		expect((await app.request("/", { headers: { cookie: "session=one" } })).status).toBe(429);
		expect((await app.request("/", { headers: { cookie: "session=two" } })).status).toBe(200);
	});
});
