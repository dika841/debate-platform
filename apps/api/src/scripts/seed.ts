import "dotenv/config";

import { auth } from "#/platform/auth/index.ts";
import { databaseHandle } from "#/platform/db/index.ts";
import { logger } from "#/platform/observability/logger.ts";

const email = process.env.SEED_EMAIL ?? "demo@example.com";
const password = process.env.SEED_PASSWORD ?? "DemoPassword123!";
const name = process.env.SEED_NAME ?? "Demo User";

try {
	await auth.api.signUpEmail({ body: { email, password, name } });
	logger.info({ email }, "seed.user_created");
} catch (error) {
	logger.warn({ err: error, email }, "seed.user_skipped");
} finally {
	await databaseHandle.close();
}
