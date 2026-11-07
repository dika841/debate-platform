import {
	DOMAIN_ERROR_CODE,
	DomainError,
	ROUND_STATUS,
	ROOM_STATUS,
	type RoundStatus,
	type RoomStatus,
	type TeamSide,
} from "@app/shared";

export const SUBMISSION_LIMITS = {
	MIN: 50,
	MAX: 5000,
} as const;

export type RoundState = {
	readonly status: RoundStatus;
	readonly opensAt: Date | null;
	readonly submissionDeadline: Date | null;
	readonly votingDeadline: Date | null;
};

export type RoomExecutionState = {
	readonly status: RoomStatus;
	readonly assignmentFinalizedAt: Date | null;
	readonly submissionDurationMinutes: number;
	readonly votingDurationMinutes: number;
	readonly roundCount: number;
};

export const effectiveRoundStatus = (round: RoundState, now: Date): RoundStatus => {
	if (
		round.status === ROUND_STATUS.OPEN &&
		round.submissionDeadline !== null &&
		round.submissionDeadline.getTime() <= now.getTime()
	) {
		return round.votingDeadline !== null && round.votingDeadline.getTime() <= now.getTime()
			? ROUND_STATUS.CLOSED
			: ROUND_STATUS.VOTING;
	}

	if (
		round.status === ROUND_STATUS.VOTING &&
		round.votingDeadline !== null &&
		round.votingDeadline.getTime() <= now.getTime()
	) {
		return ROUND_STATUS.CLOSED;
	}

	return round.status;
};

export const submissionDeadlineFor = (now: Date, durationMinutes: number): Date =>
	new Date(now.getTime() + durationMinutes * 60_000);

export const votingDeadlineFor = (submissionDeadline: Date, durationMinutes: number): Date =>
	new Date(submissionDeadline.getTime() + durationMinutes * 60_000);

export const assertDebateStartable = (room: RoomExecutionState, existingRounds: number): void => {
	if (room.status !== ROOM_STATUS.PUBLISHED) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.INVALID_ROOM_STATE,
			"Debate can only start from a published room",
		);
	}

	if (room.assignmentFinalizedAt === null) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.ROOM_NOT_READY,
			"Finalize team assignment before starting the debate",
		);
	}

	if (room.roundCount < 1) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.INVALID_ROOM_CONFIGURATION,
			"Room must define at least one round",
		);
	}

	if (existingRounds > 0) {
		throw new DomainError(DOMAIN_ERROR_CODE.INVALID_ROOM_STATE, "Debate has already started");
	}
};

export const assertRoomInProgress = (status: RoomStatus): void => {
	if (status !== ROOM_STATUS.IN_PROGRESS) {
		throw new DomainError(DOMAIN_ERROR_CODE.INVALID_ROUND_STATE, "Debate is not in progress");
	}
};

export const assertRoundSubmittable = (
	round: RoundState,
	roomStatus: RoomStatus,
	now: Date,
): void => {
	if (roomStatus !== ROOM_STATUS.IN_PROGRESS) {
		throw new DomainError(DOMAIN_ERROR_CODE.INVALID_ROUND_STATE, "Debate is not in progress");
	}

	if (round.status !== ROUND_STATUS.OPEN) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.INVALID_ROUND_STATE,
			"This round is not accepting submissions",
		);
	}

	if (round.submissionDeadline !== null && round.submissionDeadline.getTime() <= now.getTime()) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.SUBMISSION_DEADLINE_PASSED,
			"The submission deadline has passed",
		);
	}
};

export const assertRoundAdvanceable = (
	round: RoundState,
	now: Date,
	submissionCount: number,
	participantCount: number,
): void => {
	if (effectiveRoundStatus(round, now) !== ROUND_STATUS.OPEN) {
		return;
	}

	if (submissionCount >= participantCount) {
		return;
	}

	throw new DomainError(
		DOMAIN_ERROR_CODE.INVALID_ROUND_STATE,
		"Round is still collecting submissions",
	);
};

export const validateSubmissionContent = (value: string): string => {
	const trimmed = value.trim();

	if (trimmed.length < SUBMISSION_LIMITS.MIN) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.INVALID_SUBMISSION,
			`Argument must be at least ${SUBMISSION_LIMITS.MIN} characters`,
		);
	}

	if (trimmed.length > SUBMISSION_LIMITS.MAX) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.INVALID_SUBMISSION,
			`Argument must be at most ${SUBMISSION_LIMITS.MAX} characters`,
		);
	}

	return trimmed;
};

export const assertParticipantTeam = (team: TeamSide | null): TeamSide => {
	if (team === null) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.INVALID_MEMBERSHIP,
			"Participant is not assigned to a team",
		);
	}

	return team;
};
