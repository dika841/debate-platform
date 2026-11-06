import { z } from "zod";

export const NODE_ENV = {
	DEVELOPMENT: "development",
	TEST: "test",
	PRODUCTION: "production",
} as const;

export const LOG_LEVEL = {
	DEBUG: "debug",
	INFO: "info",
	WARN: "warn",
	ERROR: "error",
} as const;

export const nodeEnvSchema = z
	.enum([NODE_ENV.DEVELOPMENT, NODE_ENV.TEST, NODE_ENV.PRODUCTION])
	.default(NODE_ENV.DEVELOPMENT);

export const logLevelSchema = z
	.enum([LOG_LEVEL.DEBUG, LOG_LEVEL.INFO, LOG_LEVEL.WARN, LOG_LEVEL.ERROR])
	.default(LOG_LEVEL.INFO);

export const apiEnvSchema = z.object({
	NODE_ENV: nodeEnvSchema,
	PORT: z.coerce.number().int().positive().default(3001),
	DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
	BETTER_AUTH_URL: z.string().url(),
	BETTER_AUTH_SECRET: z.string().min(32, "BETTER_AUTH_SECRET must be at least 32 characters"),
	WEB_ORIGIN: z.string().url(),
	LOG_LEVEL: logLevelSchema,
	CLOUDFLARE: z.string().optional(),
});

export const workerEnvSchema = z.object({
	NODE_ENV: nodeEnvSchema,
	DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
	LOG_LEVEL: logLevelSchema,
	CLOUDFLARE: z.string().optional(),
});

export const webEnvSchema = z.object({
	VITE_API_URL: z.string().url().optional(),
	VITE_APP_NAME: z.string().default("Debate Platform"),
});

export type ApiEnv = z.infer<typeof apiEnvSchema>;
export type WorkerEnv = z.infer<typeof workerEnvSchema>;
export type WebEnv = z.infer<typeof webEnvSchema>;
