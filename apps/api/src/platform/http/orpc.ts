import { RPCHandler } from "@orpc/server/fetch";
import { onError } from "@orpc/server";
import type { Context } from "hono";
import { appRouter } from "#/bootstrap/router.ts";
import { logger } from "#/platform/observability/logger.ts";
import { env } from "#/platform/config/env.ts";
import { auth } from "#/platform/auth/index.ts";
import { db } from "#/platform/db/index.ts";
import {
	sessionResolutionOf,
	unavailableResolution,
	type SessionResolution,
} from "#/shared/session.ts";
import type { OrpcContext } from "#/platform/orpc/context.ts";

export const rpcHandler = new RPCHandler(appRouter, {
	interceptors: [
		onError((error) => {
			logger.error({ err: error }, "orpc.error");
		}),
	],
});

const resolveSession = async (headers: Headers): Promise<SessionResolution> => {
	try {
		const session = await auth.api.getSession({ headers });
		return sessionResolutionOf(session);
	} catch (error) {
		logger.error({ err: error }, "session.resolve.failed");
		return unavailableResolution();
	}
};

export const buildContext = async (hono: Context): Promise<OrpcContext> => {
	const resolution = await resolveSession(hono.req.raw.headers);

	return {
		requestId: hono.get("requestId") ?? crypto.randomUUID(),
		session: resolution.session,
		sessionState: resolution.sessionState,
		db,
		auth,
	};
};

export const buildContextFromHeaders = async (headers: Headers): Promise<OrpcContext> => {
	const resolution = await resolveSession(headers);

	return {
		requestId: crypto.randomUUID(),
		session: resolution.session,
		sessionState: resolution.sessionState,
		db,
		auth,
	};
};

export const rpcHandle = async (request: Request): Promise<Response | null> => {
	const context = await buildContextFromHeaders(request.headers);
	const { matched, response } = await rpcHandler.handle(request, {
		prefix: "/rpc",
		context,
	});

	if (!matched) {
		return null;
	}

	return response;
};

export const corsOrigin = env.WEB_ORIGIN;
