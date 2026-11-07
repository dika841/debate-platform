import type { VoteSummary } from "@app/api-contract";
import type { TeamSide } from "@app/shared";
import type { VoteCounts } from "../ports/vote-repository.ts";

export const toVoteSummary = (
	roundId: string,
	counts: VoteCounts,
	revealed: boolean,
	viewerVote: TeamSide | null,
): VoteSummary => ({
	roundId,
	revealed,
	proCount: revealed ? counts.proCount : 0,
	contraCount: revealed ? counts.contraCount : 0,
	totalCount: revealed ? counts.totalCount : 0,
	viewerVote,
});
