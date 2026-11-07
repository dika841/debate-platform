import {
	APPLICATION_ERROR_CODE,
	ApplicationError,
	DOMAIN_ERROR_CODE,
	DomainError,
} from "@app/shared";
import { ORPCError } from "@orpc/server";
import type { OrpcContext } from "./context.ts";

const CONFLICT_DOMAIN_CODES: ReadonlySet<string> = new Set([
	DOMAIN_ERROR_CODE.USERNAME_TAKEN,
	DOMAIN_ERROR_CODE.INVALID_ROOM_STATE,
	DOMAIN_ERROR_CODE.INVALID_MEMBERSHIP,
	DOMAIN_ERROR_CODE.ASSIGNMENT_ALREADY_FINALIZED,
	DOMAIN_ERROR_CODE.SUBMISSION_ALREADY_EXISTS,
	DOMAIN_ERROR_CODE.PARTICIPANT_CAPACITY_EXCEEDED,
	DOMAIN_ERROR_CODE.DUPLICATE_VOTE,
	DOMAIN_ERROR_CODE.RESULT_ALREADY_FINALIZED,
]);

export const requireUserId = (context: OrpcContext): string => {
	if (!context.session) {
		throw new ORPCError("UNAUTHORIZED", { message: "Authentication required" });
	}

	return context.session.userId;
};

export const toOrpcError = (error: unknown): never => {
	if (error instanceof DomainError) {
		if (CONFLICT_DOMAIN_CODES.has(error.code)) {
			throw new ORPCError("CONFLICT", { message: error.message, cause: error });
		}

		throw new ORPCError("BAD_REQUEST", { message: error.message, cause: error });
	}

	if (error instanceof ApplicationError) {
		switch (error.code) {
			case APPLICATION_ERROR_CODE.AUTHENTICATION_REQUIRED:
				throw new ORPCError("UNAUTHORIZED", { message: error.message, cause: error });
			case APPLICATION_ERROR_CODE.AUTHORIZATION_DENIED:
				throw new ORPCError("FORBIDDEN", { message: error.message, cause: error });
			case APPLICATION_ERROR_CODE.RESOURCE_NOT_FOUND:
				throw new ORPCError("NOT_FOUND", { message: error.message, cause: error });
			case APPLICATION_ERROR_CODE.CONFLICT:
			case APPLICATION_ERROR_CODE.CONCURRENCY_CONFLICT:
			case APPLICATION_ERROR_CODE.IDEMPOTENCY_CONFLICT:
				throw new ORPCError("CONFLICT", { message: error.message, cause: error });
			default:
				throw new ORPCError("INTERNAL_SERVER_ERROR", {
					message: error.message,
					cause: error,
				});
		}
	}

	throw error;
};
