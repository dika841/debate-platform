import type { UpdateProfileInput } from "@app/api-contract";
import {
	APPLICATION_ERROR_CODE,
	ApplicationError,
	DomainError,
	DOMAIN_ERROR_CODE,
	type Result,
} from "@app/shared";
import {
	validateAvatarUrl,
	validateBio,
	validateDisplayName,
	validateUsername,
} from "../../domain/profile.ts";
import { toUserProfile } from "../mappers/user-profile-mapper.ts";
import type { ProfilePatch, ProfileRepository } from "../ports/profile-repository.ts";

export type UpdateProfileDeps = {
	readonly repository: ProfileRepository;
};

const unwrap = <T>(result: Result<T, DomainError>): T => {
	if (!result.ok) {
		throw result.error;
	}
	return result.value;
};

export const updateProfile = async (
	deps: UpdateProfileDeps,
	userId: string,
	input: UpdateProfileInput,
): Promise<ReturnType<typeof toUserProfile>> => {
	const found = await deps.repository.findUserWithProfile(userId);

	if (!found) {
		throw new ApplicationError(APPLICATION_ERROR_CODE.RESOURCE_NOT_FOUND, "User not found");
	}

	const currentProfile = found.profile ?? (await deps.repository.ensureProfile(found.user));

	const patch: {
		displayName?: string;
		username?: string;
		bio?: string | null;
		avatarUrl?: string | null;
	} = {};

	if (input.displayName !== undefined) {
		patch.displayName = unwrap(validateDisplayName(input.displayName));
	}

	if (input.username !== undefined) {
		const username = unwrap(validateUsername(input.username));

		if (username !== currentProfile.username) {
			const taken = await deps.repository.isUsernameTaken(username, userId);
			if (taken) {
				throw new DomainError(DOMAIN_ERROR_CODE.USERNAME_TAKEN, "Username is already taken");
			}
		}

		patch.username = username;
	}

	if (input.bio !== undefined) {
		patch.bio = unwrap(validateBio(input.bio));
	}

	if (input.avatarUrl !== undefined) {
		patch.avatarUrl = unwrap(validateAvatarUrl(input.avatarUrl));
	}

	const nextProfile: ProfilePatch = { ...patch };

	if (Object.keys(nextProfile).length === 0) {
		return toUserProfile(found.user, currentProfile);
	}

	const updated = await deps.repository.updateProfile(userId, nextProfile);

	return toUserProfile({ ...found.user, name: updated.displayName }, updated);
};
