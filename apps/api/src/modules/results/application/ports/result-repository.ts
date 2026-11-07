import type { ResultOutcome } from "@app/shared";

export type RoundResultRecord = {
	readonly id: string;
	readonly roundId: string;
	readonly roomId: string;
	readonly outcome: ResultOutcome;
	readonly proCount: number;
	readonly contraCount: number;
	readonly totalVotes: number;
	readonly finalizedById: string;
	readonly finalizedAt: Date;
};

export type NewRoundResult = Omit<RoundResultRecord, "id" | "finalizedAt"> & {
	readonly id: string;
	readonly finalizedAt: Date;
};

export type RoomResultRecord = {
	readonly id: string;
	readonly roomId: string;
	readonly outcome: ResultOutcome;
	readonly proWins: number;
	readonly contraWins: number;
	readonly draws: number;
	readonly finalizedById: string;
	readonly finalizedAt: Date;
};

export type NewRoomResult = RoomResultRecord;

export interface ResultRepository {
	findRoundResult(roundId: string): Promise<RoundResultRecord | null>;
	listRoundResults(roomId: string): Promise<readonly RoundResultRecord[]>;
	saveRoundResult(input: NewRoundResult): Promise<RoundResultRecord>;
	findRoomResult(roomId: string): Promise<RoomResultRecord | null>;
	saveRoomResult(input: NewRoomResult): Promise<RoomResultRecord>;
}
