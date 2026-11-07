import { MEMBERSHIP_ROLE, TEAM_SIDE, VIEWER_ROLE } from "@app/shared";
import { z } from "zod";

export const membershipRoleSchema = z.enum([
	MEMBERSHIP_ROLE.PARTICIPANT,
	MEMBERSHIP_ROLE.SPECTATOR,
]);

export const viewerRoleSchema = z.enum([
	VIEWER_ROLE.HOST,
	VIEWER_ROLE.PARTICIPANT,
	VIEWER_ROLE.SPECTATOR,
]);

export const teamSideSchema = z.enum([TEAM_SIDE.PRO, TEAM_SIDE.CONTRA]);

export const membershipUserSchema = z.object({
	id: z.string(),
	displayName: z.string(),
	username: z.string().nullable(),
	avatarUrl: z.string().nullable(),
});

export const membershipSchema = z.object({
	id: z.string(),
	roomId: z.string(),
	userId: z.string(),
	role: membershipRoleSchema,
	team: teamSideSchema.nullable(),
	user: membershipUserSchema,
	joinedAt: z.string(),
});

export const joinMembershipInputSchema = z.object({
	roomId: z.string().min(1),
	role: membershipRoleSchema,
});

export const leaveMembershipInputSchema = z.object({
	roomId: z.string().min(1),
});

export const leaveMembershipOutputSchema = z.object({
	left: z.boolean(),
});

export const listMembersInputSchema = z.object({
	roomId: z.string().min(1),
	role: membershipRoleSchema.optional(),
	cursor: z.string().min(1).optional(),
	limit: z.number().int().min(1).max(50).optional(),
});

export const listMembersOutputSchema = z.object({
	items: z.array(membershipSchema),
	nextCursor: z.string().nullable(),
});

export type Membership = z.infer<typeof membershipSchema>;
export type MembershipRoleValue = z.infer<typeof membershipRoleSchema>;
export type ViewerRoleValue = z.infer<typeof viewerRoleSchema>;
export type TeamSideValue = z.infer<typeof teamSideSchema>;
export type JoinMembershipInput = z.infer<typeof joinMembershipInputSchema>;
export type LeaveMembershipInput = z.infer<typeof leaveMembershipInputSchema>;
export type LeaveMembershipResult = z.infer<typeof leaveMembershipOutputSchema>;
export type ListMembersInput = z.infer<typeof listMembersInputSchema>;
export type ListMembersResult = z.infer<typeof listMembersOutputSchema>;
