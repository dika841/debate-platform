import {
	DOMAIN_ERROR_CODE,
	DomainError,
	MEMBERSHIP_ROLE,
	ROOM_STATUS,
	ROUND_STATUS,
	type MembershipRole,
	type RoomStatus,
	type RoundStatus,
} from "@app/shared";

export const assertVotingOpen = (roundStatus: RoundStatus, roomStatus: RoomStatus): void => {
	if (roomStatus !== ROOM_STATUS.IN_PROGRESS) {
		throw new DomainError(DOMAIN_ERROR_CODE.INVALID_ROUND_STATE, "Debate is not in progress");
	}

	if (roundStatus !== ROUND_STATUS.VOTING) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.INVALID_ROUND_STATE,
			"Voting is not open for this round",
		);
	}
};

export type VoterEligibility = {
	readonly isHost: boolean;
	readonly membershipRole: MembershipRole | null;
	readonly spectatorVotingEnabled: boolean;
};

export const assertVoterEligible = (eligibility: VoterEligibility): void => {
	if (eligibility.isHost) {
		return;
	}

	if (!eligibility.spectatorVotingEnabled) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.VOTER_NOT_ELIGIBLE,
			"Spectator voting is disabled for this room",
		);
	}

	if (eligibility.membershipRole !== MEMBERSHIP_ROLE.SPECTATOR) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.VOTER_NOT_ELIGIBLE,
			"Only spectators can vote in this room",
		);
	}
};

export const areVoteTotalsRevealed = (roundStatus: RoundStatus, isHost: boolean): boolean =>
	isHost || roundStatus === ROUND_STATUS.CLOSED;
