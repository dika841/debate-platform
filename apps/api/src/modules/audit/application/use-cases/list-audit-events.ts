import type { ListAuditEventsResult } from "@app/api-contract";
import { APPLICATION_ERROR_CODE, ApplicationError, pageRequest } from "@app/shared";
import { canTakeModerationAction } from "#/modules/moderation/domain/permissions.ts";
import { toAuditEventDto } from "../mappers/audit-mapper.ts";
import type { AuditRepository } from "../ports/audit-repository.ts";

export type ListAuditEventsDeps = {
	readonly repository: AuditRepository;
};

export const listAuditEvents = async (
	deps: ListAuditEventsDeps,
	actorRole: string,
	input: { readonly cursor?: string; readonly limit?: number; readonly action?: string },
): Promise<ListAuditEventsResult> => {
	if (!canTakeModerationAction(actorRole)) {
		throw new ApplicationError(
			APPLICATION_ERROR_CODE.AUTHORIZATION_DENIED,
			"Admin access required",
		);
	}

	const page = pageRequest({ cursor: input.cursor, limit: input.limit });
	const result = await deps.repository.list({
		action: input.action,
		cursor: page.cursor,
		limit: page.limit,
	});

	return {
		items: result.items.map(toAuditEventDto),
		nextCursor: result.nextCursor,
	};
};
