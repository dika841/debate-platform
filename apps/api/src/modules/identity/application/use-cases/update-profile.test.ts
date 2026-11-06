import { DomainError } from "@app/shared";
import { describe, expect, it } from "vitest";
import type {
	ProfileRecord,
	ProfileRepository,
	UserWithProfile,
} from "../ports/profile-repository.ts";
import { getProfile } from "./get-profile.ts";
import { updateProfile } from "./update-profile.ts";

const user = {
	id: "user-1",
	email: "demo@example.com",
	name: "Demo User",
	image: null,
	role: "USER",
};

const profile: ProfileRecord = {
	userId: user.id,
	username: "demo",
	displayName: "Demo User",
	avatarUrl: null,
	bio: null,
};

const repositoryWith = (found: UserWithProfile | null, taken = false): ProfileRepository => ({
	findUserWithProfile: async () => found,
	ensureProfile: async () => profile,
	isUsernameTaken: async () => taken,
	updateProfile: async (userId, patch) => ({
		...profile,
		...patch,
		userId,
	}),
});

describe("identity use cases", () => {
	it("returns the profile for the current user", async () => {
		const result = await getProfile({ repository: repositoryWith({ user, profile }) }, user.id);

		expect(result.profile.displayName).toBe("Demo User");
	});

	it("creates a profile lazily when it does not exist", async () => {
		const result = await getProfile(
			{ repository: repositoryWith({ user, profile: null }) },
			user.id,
		);

		expect(result.profile.username).toBe("demo");
	});

	it("updates valid profile fields", async () => {
		const result = await updateProfile({ repository: repositoryWith({ user, profile }) }, user.id, {
			displayName: "New Name",
			bio: "Hello",
		});

		expect(result.profile.displayName).toBe("New Name");
		expect(result.profile.bio).toBe("Hello");
	});

	it("rejects a username that is already taken", async () => {
		await expect(
			updateProfile({ repository: repositoryWith({ user, profile }, true) }, user.id, {
				username: "taken",
			}),
		).rejects.toBeInstanceOf(DomainError);
	});

	it("rejects invalid profile input", async () => {
		await expect(
			updateProfile({ repository: repositoryWith({ user, profile }) }, user.id, {
				displayName: "   ",
			}),
		).rejects.toBeInstanceOf(DomainError);
	});
});
