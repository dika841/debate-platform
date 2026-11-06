import { contract, type HealthCheckOutput } from "@app/api-contract";
import { sql } from "drizzle-orm";
import { implement } from "@orpc/server";
import { healthCheckOutputSchema, HEALTH_STATUS } from "@app/api-contract";
import type { OrpcContext } from "#/platform/orpc/context.ts";
import { usersRouter } from "#/modules/identity/index.ts";

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
});
