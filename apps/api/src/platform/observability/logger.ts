import { createLogger } from "@app/logger";
import { env } from "#/platform/config/env.ts";

export const logger = createLogger({
	level: env.LOG_LEVEL,
	base: { service: "api" },
});
