import { authCreate } from "@app/auth";
import { env, isProduction } from "#/platform/config/env.ts";
import { db } from "#/platform/db/index.ts";
import { sendEmail } from "#/platform/email/index.ts";
import { logger } from "#/platform/observability/logger.ts";

if (isProduction && !env.RESEND_API_KEY) {
	logger.warn(
		{},
		"auth.email_provider_missing: verification and password reset emails will not be delivered",
	);
}

export const auth = authCreate({
	database: db,
	baseURL: env.BETTER_AUTH_URL,
	secret: env.BETTER_AUTH_SECRET,
	trustedOrigins: [env.WEB_ORIGIN, ...(isProduction ? [] : ["http://localhost:5173"])],
	production: isProduction,
	sendEmail,
	requireEmailVerification: isProduction && Boolean(env.RESEND_API_KEY),
});
