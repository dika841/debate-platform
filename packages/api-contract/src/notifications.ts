import { NOTIFICATION_TYPE } from "@app/shared";
import { z } from "zod";

export const notificationTypeSchema = z.enum([
	NOTIFICATION_TYPE.MEMBER_JOINED,
	NOTIFICATION_TYPE.ASSIGNMENT_FINALIZED,
	NOTIFICATION_TYPE.DEBATE_STARTED,
	NOTIFICATION_TYPE.ROUND_OPENED,
	NOTIFICATION_TYPE.ROUND_VOTING,
	NOTIFICATION_TYPE.ROUND_RESULT,
	NOTIFICATION_TYPE.ROOM_RESULT,
	NOTIFICATION_TYPE.REPORT_RESOLVED,
]);

export const notificationSchema = z.object({
	id: z.string(),
	type: notificationTypeSchema,
	title: z.string(),
	body: z.string(),
	roomId: z.string().nullable(),
	roundId: z.string().nullable(),
	readAt: z.string().nullable(),
	createdAt: z.string(),
});

export const listNotificationsInputSchema = z.object({
	cursor: z.string().min(1).optional(),
	limit: z.number().int().min(1).max(50).optional(),
});

export const listNotificationsOutputSchema = z.object({
	items: z.array(notificationSchema),
	nextCursor: z.string().nullable(),
	unreadCount: z.number().int().nonnegative(),
});

export const markNotificationReadInputSchema = z.object({
	id: z.string().min(1),
});

export const markAllNotificationsReadOutputSchema = z.object({
	updated: z.number().int().nonnegative(),
});

export type Notification = z.infer<typeof notificationSchema>;
export type ListNotificationsResult = z.infer<typeof listNotificationsOutputSchema>;
