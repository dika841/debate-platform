import type { Database } from "@app/database";
import { redactError } from "@app/logger";
import { logger } from "#/platform/observability/logger.ts";
import { createDrizzleRoomRepository } from "#/modules/debate-room/infrastructure/persistence/drizzle-room-repository.ts";
import { createDrizzleMembershipRepository } from "#/modules/membership/infrastructure/persistence/drizzle-membership-repository.ts";
import { createDrizzleNotificationRepository } from "./infrastructure/persistence/drizzle-notification-repository.ts";
import {
	createNotificationService,
	type NotificationService,
} from "./application/notification-service.ts";

export const notificationServiceFor = (database: Database): NotificationService =>
	createNotificationService({
		repository: createDrizzleNotificationRepository(database),
		rooms: createDrizzleRoomRepository(database),
		memberships: createDrizzleMembershipRepository(database),
	});

export const safeNotify = async (work: Promise<unknown>): Promise<void> => {
	try {
		await work;
	} catch (error) {
		logger.warn({ err: redactError(error) }, "notification.dispatch_failed");
	}
};
