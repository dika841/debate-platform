import type { Database } from "@app/database";
import { userProfiles, users } from "@app/database/schema";
import { APPLICATION_ERROR_CODE, ApplicationError } from "@app/shared";
import { and, eq, ne } from "drizzle-orm";
import { usernameFromEmail } from "../../domain/profile.ts";
import type {
	IdentityUser,
	ProfileRecord,
	ProfileRepository,
} from "../../application/ports/profile-repository.ts";

type ProfileRow = {
	username: string | null;
	displayName: string | null;
	avatarUrl: string | null;
	bio: string | null;
};

const rowToProfile = (userId: string, row: ProfileRow): ProfileRecord | null => {
	if (row.displayName === null) {
		return null;
	}

	return {
		userId,
		username: row.username,
		displayName: row.displayName,
		avatarUrl: row.avatarUrl,
		bio: row.bio,
	};
};

const isUniqueViolation = (error: unknown): boolean => {
	return (
		typeof error === "object" &&
		error !== null &&
		"code" in error &&
		(error as { code?: unknown }).code === "23505"
	);
};

export const createDrizzleProfileRepository = (db: Database): ProfileRepository => {
	const findProfile = async (userId: string): Promise<ProfileRecord | null> => {
		const [row] = await db
			.select({
				username: userProfiles.username,
				displayName: userProfiles.displayName,
				avatarUrl: userProfiles.avatarUrl,
				bio: userProfiles.bio,
			})
			.from(userProfiles)
			.where(eq(userProfiles.userId, userId))
			.limit(1);

		return row ? rowToProfile(userId, row) : null;
	};

	const insertProfile = async (user: IdentityUser, username: string): Promise<ProfileRecord> => {
		const [created] = await db
			.insert(userProfiles)
			.values({
				userId: user.id,
				username,
				displayName: user.name,
			})
			.onConflictDoNothing({ target: userProfiles.userId })
			.returning();

		if (created) {
			return {
				userId: created.userId,
				username: created.username,
				displayName: created.displayName,
				avatarUrl: created.avatarUrl,
				bio: created.bio,
			};
		}

		const existing = await findProfile(user.id);
		if (!existing) {
			throw new Error("Profile insert failed");
		}
		return existing;
	};

	return {
		async findUserWithProfile(userId) {
			const [row] = await db
				.select({
					id: users.id,
					email: users.email,
					name: users.name,
					image: users.image,
					role: users.role,
					username: userProfiles.username,
					displayName: userProfiles.displayName,
					avatarUrl: userProfiles.avatarUrl,
					bio: userProfiles.bio,
				})
				.from(users)
				.leftJoin(userProfiles, eq(users.id, userProfiles.userId))
				.where(eq(users.id, userId))
				.limit(1);

			if (!row) {
				return null;
			}

			return {
				user: {
					id: row.id,
					email: row.email,
					name: row.name,
					image: row.image,
					role: row.role,
				},
				profile: rowToProfile(userId, row),
			};
		},

		async ensureProfile(user) {
			const existing = await findProfile(user.id);
			if (existing) {
				return existing;
			}

			const base = usernameFromEmail(user.email, user.id);
			let candidate = base;

			for (let attempt = 0; attempt < 5; attempt += 1) {
				try {
					return await insertProfile(user, candidate);
				} catch (error) {
					if (!isUniqueViolation(error)) {
						throw error;
					}

					const suffix = user.id.replace(/-/g, "").slice(0, 6);
					candidate = `${base.slice(0, 20)}_${suffix}${attempt}`;
				}
			}

			throw new Error("Unable to allocate a unique username");
		},

		async isUsernameTaken(username, excludeUserId) {
			const [row] = await db
				.select({ userId: userProfiles.userId })
				.from(userProfiles)
				.where(and(eq(userProfiles.username, username), ne(userProfiles.userId, excludeUserId)))
				.limit(1);

			return Boolean(row);
		},

		async updateProfile(userId, patch) {
			try {
				if (patch.displayName !== undefined) {
					await db
						.update(users)
						.set({ name: patch.displayName, updatedAt: new Date() })
						.where(eq(users.id, userId));
				}

				const [updated] = await db
					.update(userProfiles)
					.set({
						...patch,
						updatedAt: new Date(),
					})
					.where(eq(userProfiles.userId, userId))
					.returning();

				if (!updated) {
					throw new Error("Profile not found");
				}

				return {
					userId: updated.userId,
					username: updated.username,
					displayName: updated.displayName,
					avatarUrl: updated.avatarUrl,
					bio: updated.bio,
				};
			} catch (error) {
				if (isUniqueViolation(error)) {
					throw new ApplicationError(APPLICATION_ERROR_CODE.CONFLICT, "Username is already taken");
				}
				throw error;
			}
		},
	};
};
