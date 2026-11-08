import type { Database } from "@app/database";
import { accounts, sessions, twoFactors, users, verifications } from "@app/database/schema";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { twoFactor } from "better-auth/plugins";

export type AuthEmailMessage = {
	readonly to: string;
	readonly subject: string;
	readonly text: string;
};

export type AuthCreateOptions = {
	readonly database: Database;
	readonly baseURL: string;
	readonly secret: string;
	readonly trustedOrigins: readonly string[];
	readonly production: boolean;
	readonly sendEmail?: (message: AuthEmailMessage) => Promise<void>;
	readonly requireEmailVerification?: boolean;
};

const textFor = (action: string, url: string): string =>
	`${action}\n\n${url}\n\nIf you did not request this, you can ignore this email.`;

export const authCreate = (options: AuthCreateOptions) => {
	const sendEmail = options.sendEmail;

	return betterAuth({
		baseURL: options.baseURL,
		secret: options.secret,
		trustedOrigins: [...options.trustedOrigins],
		database: drizzleAdapter(options.database, {
			provider: "pg",
			schema: {
				user: users,
				session: sessions,
				account: accounts,
				verification: verifications,
				twoFactor: twoFactors,
			},
		}),
		plugins: [
			twoFactor({
				issuer: "Debate Platform",
			}),
		],
		advanced: {
			database: {
				generateId: (): string => crypto.randomUUID(),
			},
			defaultCookieAttributes: {
				httpOnly: true,
				sameSite: options.production ? "none" : "lax",
				secure: options.production,
			},
		},
		session: {
			expiresIn: 60 * 60 * 24 * 7,
			updateAge: 60 * 60 * 24,
		},
		emailAndPassword: {
			enabled: true,
			minPasswordLength: 12,
			maxPasswordLength: 128,
			requireEmailVerification: options.requireEmailVerification ?? false,
			resetPasswordTokenExpiresIn: 60 * 60,
			...(sendEmail
				? {
						sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
							await sendEmail({
								to: user.email,
								subject: "Reset your Debate Platform password",
								text: textFor("Reset your password from this link:", url),
							});
						},
					}
				: {}),
		},
		...(sendEmail
			? {
					emailVerification: {
						sendOnSignUp: true,
						autoSignInAfterVerification: true,
						expiresIn: 60 * 60 * 24,
						sendVerificationEmail: async ({
							user,
							url,
						}: {
							user: { email: string };
							url: string;
						}) => {
							await sendEmail({
								to: user.email,
								subject: "Verify your Debate Platform email",
								text: textFor("Verify your email from this link:", url),
							});
						},
					},
				}
			: {}),
		user: {
			deleteUser: {
				enabled: true,
			},
			additionalFields: {
				role: {
					type: "string",
					defaultValue: "USER",
					input: false,
				},
			},
		},
	});
};

export type Auth = ReturnType<typeof authCreate>;
