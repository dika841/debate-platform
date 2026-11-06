import { APPLICATION_ERROR_CODE, ApplicationError } from "@app/shared";
import { toUserProfile } from "../mappers/user-profile-mapper.ts";
import type { ProfileRepository } from "../ports/profile-repository.ts";

export type GetProfileDeps = {
	readonly repository: ProfileRepository;
};

export const getProfile = async (
	deps: GetProfileDeps,
	userId: string,
): Promise<ReturnType<typeof toUserProfile>> => {
	const found = await deps.repository.findUserWithProfile(userId);

	if (!found) {
		throw new ApplicationError(APPLICATION_ERROR_CODE.RESOURCE_NOT_FOUND, "User not found");
	}

	const profile = found.profile ?? (await deps.repository.ensureProfile(found.user));

	return toUserProfile(found.user, profile);
};
