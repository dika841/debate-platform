import { oc } from "@orpc/contract";
import { healthCheckOutputSchema } from "./health.ts";
import { getSessionOutputSchema } from "./session.ts";

export const contract = {
	health: {
		check: oc.output(healthCheckOutputSchema),
	},
	auth: {
		getSession: oc.output(getSessionOutputSchema),
	},
} as const;

export * from "./health.ts";
export * from "./session.ts";
