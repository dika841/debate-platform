import { authCreate } from "@app/auth";
import { env, isProduction } from "#/platform/config/env.ts";
import { db } from "#/platform/db/index.ts";

export const auth = authCreate({
	database: db,
	baseURL: env.BETTER_AUTH_URL,
	secret: env.BETTER_AUTH_SECRET,
	trustedOrigins: [env.WEB_ORIGIN, "http://localhost:5173"],
	production: isProduction
});
