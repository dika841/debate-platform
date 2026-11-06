export const ROLE = {
	USER: "USER",
	MODERATOR: "MODERATOR",
	ADMIN: "ADMIN"
} as const;

export type Role = (typeof ROLE)[keyof typeof ROLE];

export const ROOM_ROLE = {
	HOST: "HOST",
	PARTICIPANT: "PARTICIPANT",
	SPECTATOR: "SPECTATOR"
} as const;

export type RoomRole = (typeof ROOM_ROLE)[keyof typeof ROOM_ROLE];

export const PERMISSION = {
	ROOM_READ: "room:read",
	ROOM_CREATE: "room:create",
	ROOM_UPDATE: "room:update",
	ROOM_PUBLISH: "room:publish",
	ROOM_START: "room:start",
	ROOM_CANCEL: "room:cancel",
	MEMBERSHIP_JOIN: "membership:join",
	MEMBERSHIP_LEAVE: "membership:leave",
	INVITATION_CREATE: "invitation:create",
	SUBMISSION_CREATE: "submission:create",
	VOTE_CAST: "vote:cast",
	RESULT_READ: "result:read",
	REPORT_CREATE: "report:create",
	MODERATION_REVIEW: "moderation:review",
	MODERATION_ACTION: "moderation:action",
	NOTIFICATION_READ: "notification:read"
} as const;

export type Permission = (typeof PERMISSION)[keyof typeof PERMISSION];

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
	[ROLE.USER]: [
		PERMISSION.ROOM_READ,
		PERMISSION.ROOM_CREATE,
		PERMISSION.MEMBERSHIP_JOIN,
		PERMISSION.MEMBERSHIP_LEAVE,
		PERMISSION.SUBMISSION_CREATE,
		PERMISSION.VOTE_CAST,
		PERMISSION.RESULT_READ,
		PERMISSION.REPORT_CREATE,
		PERMISSION.NOTIFICATION_READ
	],
	[ROLE.MODERATOR]: [
		PERMISSION.ROOM_READ,
		PERMISSION.RESULT_READ,
		PERMISSION.REPORT_CREATE,
		PERMISSION.MODERATION_REVIEW,
		PERMISSION.NOTIFICATION_READ
	],
	[ROLE.ADMIN]: Object.values(PERMISSION)
};

export const hasPermission = (role: Role, permission: Permission): boolean =>
	ROLE_PERMISSIONS[role].includes(permission);
