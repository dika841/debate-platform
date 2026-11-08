export type IdentityUser = {
	readonly id: string;
	readonly email: string;
	readonly name: string;
	readonly image: string | null;
	readonly role: string;
	readonly twoFactorEnabled: boolean;
};

export type ProfileRecord = {
	readonly userId: string;
	readonly username: string | null;
	readonly displayName: string;
	readonly avatarUrl: string | null;
	readonly bio: string | null;
};

export type UserWithProfile = {
	readonly user: IdentityUser;
	readonly profile: ProfileRecord | null;
};

export type ProfilePatch = {
	readonly displayName?: string;
	readonly username?: string;
	readonly bio?: string | null;
	readonly avatarUrl?: string | null;
};

export interface ProfileRepository {
	findUserWithProfile(userId: string): Promise<UserWithProfile | null>;
	ensureProfile(user: IdentityUser): Promise<ProfileRecord>;
	isUsernameTaken(username: string, excludeUserId: string): Promise<boolean>;
	updateProfile(userId: string, patch: ProfilePatch): Promise<ProfileRecord>;
}
