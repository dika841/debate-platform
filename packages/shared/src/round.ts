export const ROUND_STATUS = {
	PENDING: "PENDING",
	OPEN: "OPEN",
	VOTING: "VOTING",
	CLOSED: "CLOSED",
} as const;

export type RoundStatus = (typeof ROUND_STATUS)[keyof typeof ROUND_STATUS];
