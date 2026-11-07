import { oc } from "@orpc/contract";
import { healthCheckOutputSchema } from "./health.ts";
import {
	joinMembershipInputSchema,
	leaveMembershipInputSchema,
	leaveMembershipOutputSchema,
	listMembersInputSchema,
	listMembersOutputSchema,
	membershipSchema,
} from "./memberships.ts";
import {
	createRoomInputSchema,
	listRoomsInputSchema,
	listRoomsOutputSchema,
	roomDetailSchema,
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
		get: oc.input(roomIdInputSchema).output(roomDetailSchema),
		create: oc.input(createRoomInputSchema).output(roomSchema),
		update: oc.input(updateRoomInputSchema).output(roomSchema),
		publish: oc.input(roomIdInputSchema).output(roomSchema),
		cancel: oc.input(roomIdInputSchema).output(roomSchema),
	},
	memberships: {
		join: oc.input(joinMembershipInputSchema).output(membershipSchema),
		leave: oc.input(leaveMembershipInputSchema).output(leaveMembershipOutputSchema),
		list: oc.input(listMembersInputSchema).output(listMembersOutputSchema),
	},
} as const;

export * from "./health.ts";
export * from "./memberships.ts";
export * from "./rooms.ts";
export * from "./session.ts";
export * from "./users.ts";
