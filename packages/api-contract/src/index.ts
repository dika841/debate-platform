import { oc } from "@orpc/contract";
import { healthCheckOutputSchema } from "./health.ts";
import { getSessionOutputSchema } from "./session.ts";
import { updateProfileInputSchema, userProfileSchema } from "./users.ts";

export const contract = {
	health: {
		check: oc.output(healthCheckOutputSchema),
	},
	auth: {
		getSession: oc.output(getSessionOutputSchema),
	},
	users: {
		getProfile: oc.output(userProfileSchema),
		updateProfile: oc.input(updateProfileInputSchema).output(userProfileSchema),
	},
} as const;

export * from "./health.ts";
export * from "./session.ts";
export * from "./users.ts";
