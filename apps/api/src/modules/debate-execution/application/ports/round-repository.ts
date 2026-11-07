import type { RoundStatus } from "@app/shared";

export type RoundRecord = {
	readonly id: string;
	readonly roomId: string;
	readonly roundNumber: number;
	readonly status: RoundStatus;
	readonly opensAt: Date | null;
	readonly submissionDeadline: Date | null;
	readonly votingDeadline: Date | null;
	readonly createdAt: Date;
	readonly updatedAt: Date;
};

export type RoundSummaryRecord = {
	readonly round: RoundRecord;
	readonly submissionCount: number;
};

export type NewRoundRecord = {
	readonly id: string;
	readonly roomId: string;
	readonly roundNumber: number;
	readonly status: RoundStatus;
	readonly opensAt: Date | null;
	readonly submissionDeadline: Date | null;
	readonly votingDeadline: Date | null;
	readonly createdAt: Date;
};

export type RoundPatch = {
	readonly status?: RoundStatus;
	readonly opensAt?: Date | null;
	readonly submissionDeadline?: Date | null;
	readonly votingDeadline?: Date | null;
	readonly updatedAt: Date;
};

export interface RoundRepository {
	listByRoom(roomId: string): Promise<readonly RoundSummaryRecord[]>;
	findById(id: string): Promise<RoundRecord | null>;
	createMany(rounds: readonly NewRoundRecord[]): Promise<void>;
	update(id: string, patch: RoundPatch): Promise<RoundRecord>;
}
