import { sql } from "drizzle-orm";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { auth } from "#/platform/auth/index.ts";
import { env } from "#/platform/config/env.ts";
import { db } from "#/platform/db/index.ts";
import { buildContext, rpcHandler } from "#/platform/http/orpc.ts";
import { logger } from "#/platform/observability/logger.ts";
import { metrics } from "#/platform/observability/metrics.ts";
import { requestLogging } from "#/platform/observability/request-logging.ts";
import { createRateLimiters } from "#/platform/rate-limit/index.ts";
import { rateLimitMiddleware } from "#/platform/rate-limit/middleware.ts";

const rateLimiters = createRateLimiters();

const databaseStatus = async (): Promise<"up" | "down"> => {
	try {
		await db.execute(sql`select 1`);
		return "up";
	} catch {
		return "down";
	}
};

const healthPayload = async (): Promise<{
	status: "ok" | "degraded";
	service: string;
	version: string;
	time: string;
	database: "up" | "down";
}> => {
	const database = await databaseStatus();

	return {
		status: database === "up" ? "ok" : "degraded",
		service: "debate-platform-api",
		version: "0.1.0",
		time: new Date().toISOString(),
		database,
	};
};

export const createApp = (): Hono => {
	const app = new Hono();

	app.use("*", requestId());
	app.use("*", requestLogging());
	app.use(
		"*",
		cors({
			origin: env.WEB_ORIGIN,
			credentials: true,
			allowMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS", "HEAD"],
			allowHeaders: ["Content-Type", "Authorization"],
			exposeHeaders: [
				"x-request-id",
				"x-ratelimit-limit",
				"x-ratelimit-remaining",
				"x-ratelimit-reset",
				"retry-after",
			],
		}),
	);

	app.use("/api/auth/*", rateLimitMiddleware({ limiter: rateLimiters.auth, scope: "auth" }));
	app.use(
		"/rpc/*",
		rateLimitMiddleware({
			limiter: rateLimiters.rpc,
			scope: "rpc",
			keyBy: "session",
		}),
	);

	app.get("/health", async (context) => context.json(await healthPayload()));
	app.get("/healthz", async (context) => context.json(await healthPayload()));
	app.get("/metrics", (context) =>
		context.text(metrics.render(), 200, {
			"content-type": "text/plain; version=0.0.4; charset=utf-8",
		}),
	);

	app.on(["GET", "POST"], "/api/auth/*", (context) => auth.handler(context.req.raw));

	app.all("/rpc/*", async (context) => {
		const orpcContext = await buildContext(context);
		const { matched, response } = await rpcHandler.handle(context.req.raw, {
			prefix: "/rpc",
			context: orpcContext,
		});

		if (matched) {
			return response;
		}

		return context.notFound();
	});

	app.notFound((context) =>
		context.json({ error: "NOT_FOUND", message: "Resource not found" }, 404),
	);

	app.onError((error, context) => {
		const requestIdValue = context.get("requestId") ?? "unknown";
		logger.error({ err: error, requestId: requestIdValue }, "http.unhandled_error");

		return context.json(
			{
				error: "INTERNAL_ERROR",
				message: "Unexpected server error",
				requestId: requestIdValue,
			},
			500,
		);
	});

	return app;
};

export const app = createApp();
