import type { Database } from "@app/database";
import { accounts, sessions, users, verifications } from "@app/database/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

export type AuthCreateOptions = {
	readonly database: Database;
	readonly baseURL: string;
	readonly secret: string;
	readonly trustedOrigins: readonly string[];
	readonly production: boolean;
};

export const authCreate = (options: AuthCreateOptions) =>
	betterAuth({
		baseURL: options.baseURL,
		secret: options.secret,
		trustedOrigins: [...options.trustedOrigins],
		database: drizzleAdapter(options.database, {
			provider: "pg",
			schema: {
				user: users,
				session: sessions,
				account: accounts,
				verification: verifications
			}
		}),
		advanced: {
			database: {
				generateId: (): string => crypto.randomUUID()
			},
			defaultCookieAttributes: {
				sameSite: options.production ? "none" : "lax",
				secure: options.production
			}
		},
		emailAndPassword: {
			enabled: true
		},
		user: {
			additionalFields: {
				role: {
					type: "string",
					defaultValue: "USER",
					input: false
				}
			}
		}
	});

export type Auth = ReturnType<typeof authCreate>;
