export const ROUND_STATUS = {
	PENDING: "PENDING",
	OPEN: "OPEN",
	CLOSED: "CLOSED",
} as const;

export type RoundStatus = (typeof ROUND_STATUS)[keyof typeof ROUND_STATUS];
