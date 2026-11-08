import type { UserProfile } from "@app/api-contract";
import type { IdentityUser, ProfileRecord } from "../ports/profile-repository.ts";

export const toUserProfile = (user: IdentityUser, profile: ProfileRecord): UserProfile => ({
	id: user.id,
	email: user.email,
	name: user.name,
	image: user.image,
	role: user.role,
	twoFactorEnabled: user.twoFactorEnabled,
	profile: {
		username: profile.username,
		displayName: profile.displayName,
		avatarUrl: profile.avatarUrl,
		bio: profile.bio,
	},
});
