import type { RoomResult, RoundResult } from "@app/api-contract";
import type { RoomResultRecord, RoundResultRecord } from "../ports/result-repository.ts";

export const toRoundResultDto = (result: RoundResultRecord, roundNumber: number): RoundResult => ({
	roundId: result.roundId,
	roundNumber,
	outcome: result.outcome,
	proCount: result.proCount,
	contraCount: result.contraCount,
	totalVotes: result.totalVotes,
	finalizedAt: result.finalizedAt.toISOString(),
});

export const toRoomResultDto = (result: RoomResultRecord): RoomResult => ({
	roomId: result.roomId,
	outcome: result.outcome,
	proWins: result.proWins,
	contraWins: result.contraWins,
	draws: result.draws,
	finalizedAt: result.finalizedAt.toISOString(),
});
