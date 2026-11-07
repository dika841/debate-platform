import { oc } from "@orpc/contract";
import {
	assignRoomInputSchema,
	assignmentSummarySchema,
	setTeamInputSchema,
} from "./assignments.ts";
import { healthCheckOutputSchema } from "./health.ts";
import {
	advanceRoundInputSchema,
	createSubmissionInputSchema,
	listRoundsInputSchema,
	listRoundsOutputSchema,
	listSubmissionsInputSchema,
	listSubmissionsOutputSchema,
	startDebateInputSchema,
	submissionSchema,
} from "./execution.ts";
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
	assignments: {
		autoAssign: oc.input(assignRoomInputSchema).output(assignmentSummarySchema),
		setTeam: oc.input(setTeamInputSchema).output(membershipSchema),
		finalize: oc.input(assignRoomInputSchema).output(assignmentSummarySchema),
	},
	rounds: {
		list: oc.input(listRoundsInputSchema).output(listRoundsOutputSchema),
		start: oc.input(startDebateInputSchema).output(listRoundsOutputSchema),
		advance: oc.input(advanceRoundInputSchema).output(listRoundsOutputSchema),
	},
	submissions: {
		create: oc.input(createSubmissionInputSchema).output(submissionSchema),
		list: oc.input(listSubmissionsInputSchema).output(listSubmissionsOutputSchema),
	},
} as const;

export * from "./assignments.ts";
export * from "./execution.ts";
export * from "./health.ts";
export * from "./memberships.ts";
export * from "./rooms.ts";
export * from "./session.ts";
export * from "./users.ts";
