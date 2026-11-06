import { databaseCreate } from "@app/database";
import { env } from "#/platform/config/env.ts";

export const databaseHandle = databaseCreate(env.DATABASE_URL);
export const db = databaseHandle.db;
