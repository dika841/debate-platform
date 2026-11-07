import {
	DOMAIN_ERROR_CODE,
	DomainError,
	participantCapacity,
	ROOM_STATUS,
	type RoomStatus,
} from "@app/shared";

const JOINABLE_ROOM_STATUSES: readonly RoomStatus[] = [
	ROOM_STATUS.PUBLISHED,
	ROOM_STATUS.IN_PROGRESS,
];

export const isRoomJoinable = (status: RoomStatus): boolean =>
	JOINABLE_ROOM_STATUSES.includes(status);

export const assertRoomJoinable = (status: RoomStatus): void => {
	if (!isRoomJoinable(status)) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.INVALID_ROOM_STATE,
			"This room is not accepting members",
		);
	}
};

export const assertNotRoomHost = (isHost: boolean): void => {
	if (isHost) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.INVALID_MEMBERSHIP,
			"The host is already part of the room",
		);
	}
};

export const assertHostCannotLeave = (isHost: boolean): void => {
	if (isHost) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.INVALID_MEMBERSHIP,
			"The host cannot leave their own room",
		);
	}
};

export const assertMembershipOpen = (assignmentFinalizedAt: Date | null): void => {
	if (assignmentFinalizedAt !== null) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.INVALID_MEMBERSHIP,
			"Team assignment is already finalized",
		);
	}
};

export const assertParticipantCapacity = (current: number, teamSize: number): void => {
	if (current >= participantCapacity(teamSize)) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.PARTICIPANT_CAPACITY_EXCEEDED,
			"This room has no participant slots left",
		);
	}
};
