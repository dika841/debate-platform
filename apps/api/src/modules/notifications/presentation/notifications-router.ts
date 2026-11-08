import { contract } from "@app/api-contract";
import { implement } from "@orpc/server";
import { requireUserId, toOrpcError } from "#/platform/orpc/errors.ts";
import type { OrpcContext } from "#/platform/orpc/context.ts";
import {
	listNotifications,
	markAllNotificationsRead,
	markNotificationRead,
} from "../application/use-cases/notifications.ts";
import { createDrizzleNotificationRepository } from "../infrastructure/persistence/drizzle-notification-repository.ts";

const os = implement(contract).$context<OrpcContext>();

const depsFrom = (context: OrpcContext) => ({
	repository: createDrizzleNotificationRepository(context.db),
});

export const notificationsRouter = {
	list: os.notifications.list.handler(async ({ context, input }) => {
		const userId = requireUserId(context);

		try {
			return await listNotifications(depsFrom(context), userId, input);
		} catch (error) {
			return toOrpcError(error);
		}
	}),

	markRead: os.notifications.markRead.handler(async ({ context, input }) => {
		const userId = requireUserId(context);

		try {
			return await markNotificationRead(depsFrom(context), userId, input.id);
		} catch (error) {
			return toOrpcError(error);
		}
	}),

	markAllRead: os.notifications.markAllRead.handler(async ({ context }) => {
		const userId = requireUserId(context);

		try {
			return await markAllNotificationsRead(depsFrom(context), userId);
		} catch (error) {
			return toOrpcError(error);
		}
	}),
};
