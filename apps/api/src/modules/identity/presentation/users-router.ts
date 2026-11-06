import { contract } from "@app/api-contract";
import {
	APPLICATION_ERROR_CODE,
	ApplicationError,
	DOMAIN_ERROR_CODE,
	DomainError,
} from "@app/shared";
import { implement, ORPCError } from "@orpc/server";
import type { OrpcContext } from "#/platform/orpc/context.ts";
import { getProfile } from "../application/use-cases/get-profile.ts";
import { updateProfile } from "../application/use-cases/update-profile.ts";
import { createDrizzleProfileRepository } from "../infrastructure/persistence/drizzle-profile-repository.ts";

const os = implement(contract).$context<OrpcContext>();

const requireUserId = (context: OrpcContext): string => {
	if (!context.session) {
		throw new ORPCError("UNAUTHORIZED", { message: "Authentication required" });
	}

	return context.session.userId;
};

const toOrpcError = (error: unknown): never => {
	if (error instanceof DomainError) {
		if (error.code === DOMAIN_ERROR_CODE.USERNAME_TAKEN) {
			throw new ORPCError("CONFLICT", { message: error.message, cause: error });
		}

		throw new ORPCError("BAD_REQUEST", { message: error.message, cause: error });
	}

	if (error instanceof ApplicationError) {
		switch (error.code) {
			case APPLICATION_ERROR_CODE.RESOURCE_NOT_FOUND:
				throw new ORPCError("NOT_FOUND", { message: error.message, cause: error });
			case APPLICATION_ERROR_CODE.CONFLICT:
				throw new ORPCError("CONFLICT", { message: error.message, cause: error });
			case APPLICATION_ERROR_CODE.AUTHORIZATION_DENIED:
				throw new ORPCError("FORBIDDEN", { message: error.message, cause: error });
			default:
				throw error;
		}
	}

	throw error;
};

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
