import { sql } from "drizzle-orm";
import { Hono, type Context } from "hono";
import { bodyLimit } from "hono/body-limit";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { redactError } from "@app/logger";
import { auth } from "#/platform/auth/index.ts";
import { env, isCloudflare, isProduction } from "#/platform/config/env.ts";
import { db } from "#/platform/db/index.ts";
import { buildContext, rpcHandler } from "#/platform/http/orpc.ts";
import { originGuard } from "#/platform/http/origin-guard.ts";
import { exportUserData } from "#/modules/privacy/infrastructure/drizzle-user-data-export.ts";
import { logger } from "#/platform/observability/logger.ts";
import { isMetricsAuthorized } from "#/platform/observability/metrics-auth.ts";
import { metrics } from "#/platform/observability/metrics.ts";
import { requestLogging } from "#/platform/observability/request-logging.ts";
import { resolveClientIp, type ProxyMode } from "#/platform/rate-limit/client-ip.ts";
import { applyRateLimit } from "#/platform/rate-limit/http.ts";
import { createRateLimiters } from "#/platform/rate-limit/index.ts";
import { rateLimitMiddleware } from "#/platform/rate-limit/middleware.ts";

const rateLimiters = createRateLimiters();
const proxyMode: ProxyMode = isCloudflare ? "cloudflare" : "proxy";
const RPC_BODY_LIMIT = 256 * 1024;
const AUTH_BODY_LIMIT = 64 * 1024;

const tooLargeResponse = (context: Context): Response =>
	context.json(
		{
			error: "PAYLOAD_TOO_LARGE",
			message: "Request body exceeds the allowed size",
		},
		413,
	);

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
		secureHeaders({
			contentSecurityPolicy: {
				defaultSrc: ["'none'"],
				frameAncestors: ["'none'"],
			},
			crossOriginResourcePolicy: false,
			referrerPolicy: "no-referrer",
			strictTransportSecurity: isProduction ? "max-age=31536000; includeSubDomains" : false,
			xFrameOptions: "DENY",
			permissionsPolicy: {
				camera: [],
				microphone: [],
				geolocation: [],
			},
		}),
	);
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

	app.use("/api/auth/*", bodyLimit({ maxSize: AUTH_BODY_LIMIT, onError: tooLargeResponse }));
	app.use("/rpc/*", bodyLimit({ maxSize: RPC_BODY_LIMIT, onError: tooLargeResponse }));
	app.use("/rpc/*", originGuard([env.WEB_ORIGIN]));
	app.use(
		"/api/auth/*",
		rateLimitMiddleware({
			limiter: rateLimiters.auth,
			scope: "auth",
			proxyMode,
			keyByPath: true,
		}),
	);

	app.get("/health", async (context) => context.json(await healthPayload()));
	app.get("/healthz", async (context) => context.json(await healthPayload()));
	app.get("/metrics", (context) => {
		const authorized = isMetricsAuthorized({
			authorization: context.req.header("authorization"),
			token: env.METRICS_TOKEN,
			production: isProduction,
		});

		if (!authorized) {
			return context.notFound();
		}

		return context.text(metrics.render(), 200, {
			"content-type": "text/plain; version=0.0.4; charset=utf-8",
		});
	});

	app.on(["GET", "POST"], "/api/auth/*", (context) => auth.handler(context.req.raw));

	app.get(
		"/api/me/export",
		rateLimitMiddleware({
			limiter: rateLimiters.rpc,
			scope: "export",
			proxyMode,
		}),
		async (context) => {
			const session = await auth.api.getSession({
				headers: context.req.raw.headers,
			});

			if (!session) {
				return context.json({ error: "UNAUTHORIZED", message: "Authentication required" }, 401);
			}

			const data = await exportUserData(db, session.user.id);

			if (!data) {
				return context.notFound();
			}

			return context.json(data, 200, {
				"content-disposition": 'attachment; filename="debate-platform-export.json"',
			});
		},
	);

	app.all("/rpc/*", async (context) => {
		const orpcContext = await buildContext(context);
		const identifier = orpcContext.session
			? `user:${orpcContext.session.userId}`
			: `ip:${resolveClientIp(context.req.raw.headers, proxyMode)}`;
		const limited = await applyRateLimit(context, {
			limiter: rateLimiters.rpc,
			scope: "rpc",
			identifier,
		});

		if (limited) {
			return limited;
		}

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
		logger.error({ err: redactError(error), requestId: requestIdValue }, "http.unhandled_error");

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
