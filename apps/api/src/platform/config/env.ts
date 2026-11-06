import { apiEnvSchema, envParse, type ApiEnv } from "@app/env";

export const env: ApiEnv = envParse(apiEnvSchema);

export const isProduction = env.NODE_ENV === "production";
export const isCloudflare = env.CLOUDFLARE === "true" || "WebSocketPair" in globalThis;
