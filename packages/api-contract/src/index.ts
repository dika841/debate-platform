import { oc } from "@orpc/contract";
import { healthCheckOutputSchema } from "./health.ts";
import {
	createRoomInputSchema,
	listRoomsInputSchema,
	listRoomsOutputSchema,
	roomIdInputSchema,
	roomSchema,
	updateRoomInputSchema,
} from "./rooms.ts";
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
	rooms: {
		list: oc.input(listRoomsInputSchema).output(listRoomsOutputSchema),
		get: oc.input(roomIdInputSchema).output(roomSchema),
		create: oc.input(createRoomInputSchema).output(roomSchema),
		update: oc.input(updateRoomInputSchema).output(roomSchema),
		publish: oc.input(roomIdInputSchema).output(roomSchema),
		cancel: oc.input(roomIdInputSchema).output(roomSchema),
	},
} as const;

export * from "./health.ts";
export * from "./rooms.ts";
export * from "./session.ts";
export * from "./users.ts";
