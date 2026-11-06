import type { Database } from "@app/database";
import type { AppSession } from "@app/api-contract";
import type { Auth } from "@app/auth";
import type { SessionState } from "#/shared/session.ts";

export type OrpcContext = {
	readonly requestId: string;
	readonly session: AppSession | null;
	readonly sessionState: SessionState;
	readonly db: Database;
	readonly auth: Auth;
};
