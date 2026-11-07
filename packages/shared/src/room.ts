export const ROOM_STATUS = {
	DRAFT: "DRAFT",
	PUBLISHED: "PUBLISHED",
	IN_PROGRESS: "IN_PROGRESS",
	COMPLETED: "COMPLETED",
	CANCELLED: "CANCELLED",
} as const;

export type RoomStatus = (typeof ROOM_STATUS)[keyof typeof ROOM_STATUS];

/** Statuses that anonymous visitors may see on the explore page. */
export const PUBLIC_ROOM_STATUSES: readonly RoomStatus[] = [
	ROOM_STATUS.PUBLISHED,
	ROOM_STATUS.IN_PROGRESS,
	ROOM_STATUS.COMPLETED,
];

export const isPublicRoomStatus = (status: RoomStatus): boolean =>
	PUBLIC_ROOM_STATUSES.includes(status);
