import {
	DOMAIN_ERROR_CODE,
	DomainError,
	err,
	ok,
	ROOM_STATUS,
	type Result,
	type RoomStatus,
} from "@app/shared";

export const ROOM_LIMITS = {
	TITLE_MIN: 3,
	TITLE_MAX: 120,
	MOTION_MIN: 5,
	MOTION_MAX: 300,
	DESCRIPTION_MAX: 2000,
	TEAM_SIZE_MIN: 1,
	TEAM_SIZE_MAX: 5,
	ROUND_COUNT_MIN: 1,
	ROUND_COUNT_MAX: 5,
	DURATION_MIN: 5,
	DURATION_MAX: 120,
} as const;

export const ROOM_DEFAULTS = {
	teamSize: 3,
	roundCount: 3,
	submissionDurationMinutes: 30,
	votingDurationMinutes: 30,
	spectatorVotingEnabled: true,
} as const;

export type RoomConfigurationInput = {
	readonly title: string;
	readonly motion: string;
	readonly description?: string | null;
	readonly teamSize?: number;
	readonly roundCount?: number;
	readonly submissionDurationMinutes?: number;
	readonly votingDurationMinutes?: number;
	readonly spectatorVotingEnabled?: boolean;
};

export type RoomConfiguration = {
	readonly title: string;
	readonly motion: string;
	readonly description: string | null;
	readonly teamSize: number;
	readonly roundCount: number;
	readonly submissionDurationMinutes: number;
	readonly votingDurationMinutes: number;
	readonly spectatorVotingEnabled: boolean;
};

const invalid = (message: string): DomainError =>
	new DomainError(DOMAIN_ERROR_CODE.INVALID_ROOM_CONFIGURATION, message);

export const validateRoomTitle = (value: string): Result<string, DomainError> => {
	const trimmed = value.trim();

	if (trimmed.length < ROOM_LIMITS.TITLE_MIN) {
		return err(invalid(`Title must be at least ${ROOM_LIMITS.TITLE_MIN} characters`));
	}

	if (trimmed.length > ROOM_LIMITS.TITLE_MAX) {
		return err(invalid(`Title must be at most ${ROOM_LIMITS.TITLE_MAX} characters`));
	}

	return ok(trimmed);
};

export const validateRoomMotion = (value: string): Result<string, DomainError> => {
	const trimmed = value.trim();

	if (trimmed.length < ROOM_LIMITS.MOTION_MIN) {
		return err(invalid(`Motion must be at least ${ROOM_LIMITS.MOTION_MIN} characters`));
	}

	if (trimmed.length > ROOM_LIMITS.MOTION_MAX) {
		return err(invalid(`Motion must be at most ${ROOM_LIMITS.MOTION_MAX} characters`));
	}

	return ok(trimmed);
};

export const validateRoomDescription = (
	value: string | null | undefined,
): Result<string | null, DomainError> => {
	if (value === null || value === undefined) {
		return ok(null);
	}

	const trimmed = value.trim();

	if (trimmed.length > ROOM_LIMITS.DESCRIPTION_MAX) {
		return err(invalid(`Description must be at most ${ROOM_LIMITS.DESCRIPTION_MAX} characters`));
	}

	return ok(trimmed.length === 0 ? null : trimmed);
};

const validateBoundedInteger = (
	label: string,
	value: number,
	min: number,
	max: number,
): Result<number, DomainError> => {
	if (!Number.isInteger(value) || value < min || value > max) {
		return err(invalid(`${label} must be an integer between ${min} and ${max}`));
	}

	return ok(value);
};

export const validateTeamSize = (value: number): Result<number, DomainError> =>
	validateBoundedInteger("Team size", value, ROOM_LIMITS.TEAM_SIZE_MIN, ROOM_LIMITS.TEAM_SIZE_MAX);

export const validateRoundCount = (value: number): Result<number, DomainError> =>
	validateBoundedInteger(
		"Round count",
		value,
		ROOM_LIMITS.ROUND_COUNT_MIN,
		ROOM_LIMITS.ROUND_COUNT_MAX,
	);

export const validateSubmissionDuration = (value: number): Result<number, DomainError> =>
	validateBoundedInteger(
		"Submission duration",
		value,
		ROOM_LIMITS.DURATION_MIN,
		ROOM_LIMITS.DURATION_MAX,
	);

export const validateVotingDuration = (value: number): Result<number, DomainError> =>
	validateBoundedInteger(
		"Voting duration",
		value,
		ROOM_LIMITS.DURATION_MIN,
		ROOM_LIMITS.DURATION_MAX,
	);

const unwrap = <T>(result: Result<T, DomainError>): T => {
	if (!result.ok) {
		throw result.error;
	}

	return result.value;
};

export const validateRoomConfiguration = (input: RoomConfigurationInput): RoomConfiguration => ({
	title: unwrap(validateRoomTitle(input.title)),
	motion: unwrap(validateRoomMotion(input.motion)),
	description: unwrap(validateRoomDescription(input.description)),
	teamSize: unwrap(validateTeamSize(input.teamSize ?? ROOM_DEFAULTS.teamSize)),
	roundCount: unwrap(validateRoundCount(input.roundCount ?? ROOM_DEFAULTS.roundCount)),
	submissionDurationMinutes: unwrap(
		validateSubmissionDuration(
			input.submissionDurationMinutes ?? ROOM_DEFAULTS.submissionDurationMinutes,
		),
	),
	votingDurationMinutes: unwrap(
		validateVotingDuration(input.votingDurationMinutes ?? ROOM_DEFAULTS.votingDurationMinutes),
	),
	spectatorVotingEnabled: input.spectatorVotingEnabled ?? ROOM_DEFAULTS.spectatorVotingEnabled,
});

const TRANSITIONS: Record<RoomStatus, readonly RoomStatus[]> = {
	[ROOM_STATUS.DRAFT]: [ROOM_STATUS.PUBLISHED, ROOM_STATUS.CANCELLED],
	[ROOM_STATUS.PUBLISHED]: [ROOM_STATUS.IN_PROGRESS, ROOM_STATUS.CANCELLED],
	[ROOM_STATUS.IN_PROGRESS]: [ROOM_STATUS.COMPLETED, ROOM_STATUS.CANCELLED],
	[ROOM_STATUS.COMPLETED]: [],
	[ROOM_STATUS.CANCELLED]: [],
};

export const canTransitionRoom = (from: RoomStatus, to: RoomStatus): boolean =>
	TRANSITIONS[from].includes(to);

export const assertRoomTransition = (from: RoomStatus, to: RoomStatus): void => {
	if (!canTransitionRoom(from, to)) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.INVALID_ROOM_STATE,
			`Room cannot transition from ${from} to ${to}`,
		);
	}
};

export const isRoomEditable = (status: RoomStatus): boolean => status === ROOM_STATUS.DRAFT;

export const assertRoomEditable = (status: RoomStatus): void => {
	if (!isRoomEditable(status)) {
		throw new DomainError(DOMAIN_ERROR_CODE.INVALID_ROOM_STATE, "Only draft rooms can be edited");
	}
};

export const assertRoomReady = (configuration: RoomConfiguration): void => {
	try {
		validateRoomConfiguration(configuration);
	} catch (error) {
		if (error instanceof DomainError) {
			throw new DomainError(DOMAIN_ERROR_CODE.ROOM_NOT_READY, error.message, {
				cause: error.code,
			});
		}

		throw error;
	}
};
