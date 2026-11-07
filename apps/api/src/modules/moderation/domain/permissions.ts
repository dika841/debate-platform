import { hasPermission, PERMISSION, ROLE, type Role } from "@app/permissions";
import { APPLICATION_ERROR_CODE, ApplicationError } from "@app/shared";

export const toRole = (value: string): Role =>
	(Object.values(ROLE) as readonly string[]).includes(value) ? (value as Role) : ROLE.USER;

export const canModerate = (role: string): boolean =>
	hasPermission(toRole(role), PERMISSION.MODERATION_REVIEW);

export const canTakeModerationAction = (role: string): boolean =>
	hasPermission(toRole(role), PERMISSION.MODERATION_ACTION);

const assertPermission = (allowed: boolean): void => {
	if (!allowed) {
		throw new ApplicationError(
			APPLICATION_ERROR_CODE.AUTHORIZATION_DENIED,
			"Moderator access required",
		);
	}
};

export const assertCanModerate = (role: string): void => assertPermission(canModerate(role));

export const assertCanTakeModerationAction = (role: string): void =>
	assertPermission(canTakeModerationAction(role));
