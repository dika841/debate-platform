export const RESULT_OUTCOME = {
	PRO: "PRO",
	CONTRA: "CONTRA",
	DRAW: "DRAW",
} as const;

export type ResultOutcome = (typeof RESULT_OUTCOME)[keyof typeof RESULT_OUTCOME];
