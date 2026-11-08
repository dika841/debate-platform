import { contract } from "@app/api-contract";
import { implement } from "@orpc/server";
import { requireTwoFactor, toOrpcError } from "#/platform/orpc/errors.ts";
import type { OrpcContext } from "#/platform/orpc/context.ts";
import { listAuditEvents } from "../application/use-cases/list-audit-events.ts";
import { createDrizzleAuditRepository } from "../infrastructure/persistence/drizzle-audit-repository.ts";

const os = implement(contract).$context<OrpcContext>();

export const auditRouter = {
	list: os.audit.list.handler(async ({ context, input }) => {
		requireTwoFactor(context);

		try {
			return await listAuditEvents(
				{ repository: createDrizzleAuditRepository(context.db) },
				context.session?.user.role ?? "USER",
				input,
			);
		} catch (error) {
			return toOrpcError(error);
		}
	}),
};
