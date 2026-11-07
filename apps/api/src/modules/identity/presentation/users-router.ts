import { contract } from "@app/api-contract";
import { implement } from "@orpc/server";
import type { OrpcContext } from "#/platform/orpc/context.ts";
import { requireUserId, toOrpcError } from "#/platform/orpc/errors.ts";
import { getProfile } from "../application/use-cases/get-profile.ts";
import { updateProfile } from "../application/use-cases/update-profile.ts";
import { createDrizzleProfileRepository } from "../infrastructure/persistence/drizzle-profile-repository.ts";

const os = implement(contract).$context<OrpcContext>();

export const usersRouter = {
	getProfile: os.users.getProfile.handler(async ({ context }) => {
		const userId = requireUserId(context);

		try {
			return await getProfile({ repository: createDrizzleProfileRepository(context.db) }, userId);
		} catch (error) {
			return toOrpcError(error);
		}
	}),

	updateProfile: os.users.updateProfile.handler(async ({ context, input }) => {
		const userId = requireUserId(context);

		try {
			return await updateProfile(
				{ repository: createDrizzleProfileRepository(context.db) },
				userId,
				input,
			);
		} catch (error) {
			return toOrpcError(error);
		}
	}),
};
