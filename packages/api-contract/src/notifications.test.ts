import { describe, expect, it } from "vitest";
import {
	listNotificationsOutputSchema,
	markAllNotificationsReadOutputSchema,
	notificationSchema,
} from "./notifications.ts";

const notification = {
	id: "notification-1",
	type: "ROUND_RESULT" as const,
	title: "Round 1 result",
	body: "PRO: PRO 3 · CONTRA 1 (4 votes).",
	roomId: "room-1",
	roundId: "round-1",
	readAt: null,
	createdAt: "2026-07-01T10:00:00.000Z",
};

describe("notifications contract", () => {
	it("accepts a notification payload", () => {
		expect(notificationSchema.parse(notification).type).toBe("ROUND_RESULT");
	});

	it("accepts a list with unread metadata", () => {
		const parsed = listNotificationsOutputSchema.parse({
			items: [notification],
			nextCursor: null,
			unreadCount: 1,
		});

		expect(parsed.unreadCount).toBe(1);
	});

	it("accepts a mark-all result", () => {
		expect(markAllNotificationsReadOutputSchema.parse({ updated: 4 }).updated).toBe(4);
	});

	it("rejects unknown notification types", () => {
		expect(() => notificationSchema.parse({ ...notification, type: "UNKNOWN" })).toThrow();
	});
});
