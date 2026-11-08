import { contract, type HealthCheckOutput } from "@app/api-contract";
import { sql } from "drizzle-orm";
import { implement } from "@orpc/server";
import { healthCheckOutputSchema, HEALTH_STATUS } from "@app/api-contract";
import type { OrpcContext } from "#/platform/orpc/context.ts";
import { usersRouter } from "#/modules/identity/index.ts";
import { membershipsRouter } from "#/modules/membership/index.ts";
import { assignmentsRouter } from "#/modules/team-assignment/index.ts";
import { roundsRouter, submissionsRouter } from "#/modules/debate-execution/index.ts";
import { votesRouter } from "#/modules/voting/index.ts";
import { resultsRouter } from "#/modules/results/index.ts";
import { reportsRouter } from "#/modules/moderation/index.ts";
import { notificationsRouter } from "#/modules/notifications/index.ts";
import { roomsRouter } from "#/modules/debate-room/index.ts";

const APP_VERSION = "0.1.0";

const os = implement(contract).$context<OrpcContext>();

const databaseStatus = async (context: OrpcContext): Promise<"up" | "down"> => {
	try {
		await context.db.execute(sql`select 1`);
		return "up";
	} catch {
		return "down";
	}
};

export const healthCheck = os.health.check.handler(
	async ({ context }): Promise<HealthCheckOutput> => {
		const database = await databaseStatus(context);

		const output: HealthCheckOutput = {
			status: database === "up" ? HEALTH_STATUS.OK : HEALTH_STATUS.DEGRADED,
			service: "debate-platform-api",
			version: APP_VERSION,
			time: new Date().toISOString(),
			database,
		};

		return healthCheckOutputSchema.parse(output);
	},
);

export const getSession = os.auth.getSession.handler(({ context }) => ({
	session: context.session,
}));

export const appRouter = os.router({
	health: {
		check: healthCheck,
	},
	auth: {
		getSession,
	},
	users: usersRouter,
	rooms: roomsRouter,
	memberships: membershipsRouter,
	assignments: assignmentsRouter,
	rounds: roundsRouter,
	submissions: submissionsRouter,
	votes: votesRouter,
	results: resultsRouter,
	reports: reportsRouter,
	notifications: notificationsRouter,
});
