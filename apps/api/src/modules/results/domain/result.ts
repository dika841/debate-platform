import { DOMAIN_ERROR_CODE, DomainError, RESULT_OUTCOME, type ResultOutcome } from "@app/shared";

export const assertSufficientVotes = (totalVotes: number): void => {
	if (totalVotes < 1) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.INSUFFICIENT_VOTES,
			"A result requires at least one vote",
		);
	}
};

export const computeRoundOutcome = (proCount: number, contraCount: number): ResultOutcome => {
	assertSufficientVotes(proCount + contraCount);

	if (proCount === contraCount) {
		return RESULT_OUTCOME.DRAW;
	}

	return proCount > contraCount ? RESULT_OUTCOME.PRO : RESULT_OUTCOME.CONTRA;
};

export type RoomOutcome = {
	readonly outcome: ResultOutcome;
	readonly proWins: number;
	readonly contraWins: number;
	readonly draws: number;
};

export const computeRoomOutcome = (outcomes: readonly ResultOutcome[]): RoomOutcome => {
	if (outcomes.length === 0) {
		throw new DomainError(DOMAIN_ERROR_CODE.ROOM_NOT_READY, "No round results are available");
	}

	const proWins = outcomes.filter((outcome) => outcome === RESULT_OUTCOME.PRO).length;
	const contraWins = outcomes.filter((outcome) => outcome === RESULT_OUTCOME.CONTRA).length;
	const draws = outcomes.filter((outcome) => outcome === RESULT_OUTCOME.DRAW).length;

	const outcome =
		proWins === contraWins
			? RESULT_OUTCOME.DRAW
			: proWins > contraWins
				? RESULT_OUTCOME.PRO
				: RESULT_OUTCOME.CONTRA;

	return { outcome, proWins, contraWins, draws };
};

export const assertResultNotFinalized = (exists: boolean): void => {
	if (exists) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.RESULT_ALREADY_FINALIZED,
			"This result is already finalized",
		);
	}
};
