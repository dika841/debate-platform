import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { resolveClientIp } from "./client-ip.ts";
import { createMemoryRateLimiter } from "./memory-rate-limiter.ts";
import { rateLimitMiddleware } from "./middleware.ts";

const buildApp = () => {
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
			proxyMode: "proxy",
			now: () => new Date("2026-06-01T10:00:00.000Z"),
		}),
	);
	app.get("/", (context) => context.text("ok"));
	return app;
};

describe("client ip resolution", () => {
	it("trusts nginx X-Real-IP and ignores a forged first X-Forwarded-For", () => {
		const headers = new Headers({
			"x-real-ip": "203.0.113.7",
			"x-forwarded-for": "10.0.0.99, 203.0.113.7",
		});

		expect(resolveClientIp(headers, "proxy")).toBe("203.0.113.7");
	});

	it("uses the last X-Forwarded-For entry when X-Real-IP is absent", () => {
		const headers = new Headers({
			"x-forwarded-for": "10.0.0.99, 198.51.100.4",
		});

		expect(resolveClientIp(headers, "proxy")).toBe("198.51.100.4");
	});

	it("uses CF-Connecting-IP in Cloudflare mode", () => {
		const headers = new Headers({
			"cf-connecting-ip": "192.0.2.10",
			"x-forwarded-for": "10.0.0.99",
		});

		expect(resolveClientIp(headers, "cloudflare")).toBe("192.0.2.10");
	});

	it("falls back to unknown for garbage", () => {
		expect(resolveClientIp(new Headers({ "x-real-ip": "not an ip" }), "proxy")).toBe("unknown");
	});
});

describe("rate limit middleware", () => {
	it("returns 429 with rate-limit headers after the limit", async () => {
		const app = buildApp();
		const headers = { "x-real-ip": "203.0.113.7" };

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
			headers: { "x-real-ip": "203.0.113.8" },
		});
		expect(otherClient.status).toBe(200);
	});
});
