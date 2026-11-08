import type { MiddlewareHandler } from "hono";
import { metrics } from "#/platform/observability/metrics.ts";
import { logger } from "#/platform/observability/logger.ts";

const QUIET_PATHS = new Set(["/health", "/healthz", "/metrics"]);

export const requestLogging = (): MiddlewareHandler => async (context, next) => {
	const startedAt = performance.now();
	const requestIdValue = context.get("requestId") ?? "unknown";

	await next();

	const durationMs = performance.now() - startedAt;
	const method = context.req.method;
	const path = context.req.path;
	const route = context.req.routePath || path;
	const status = context.res.status;

	metrics.observeRequest({ method, route, status, durationMs });
	context.header("x-request-id", requestIdValue);

	const entry = {
		requestId: requestIdValue,
		method,
		path,
		route,
		status,
		durationMs: Math.round(durationMs),
	};

	if (QUIET_PATHS.has(path)) {
		logger.debug(entry, "http.request");
	} else {
		logger.info(entry, "http.request");
	}
};
