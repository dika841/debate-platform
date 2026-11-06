import "dotenv/config";

import { defineConfig } from "drizzle-kit";

export default defineConfig({
	schema: "../../packages/database/src/schema.ts",
	out: "./drizzle",
	dialect: "postgresql",
	dbCredentials: {
		url: process.env.DATABASE_URL ?? "postgresql://app:app@localhost:5432/app",
	},
	verbose: true,
	strict: true,
});
