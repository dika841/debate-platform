import type { TeamSide } from "@app/shared";

export type VoteRecord = {
	readonly id: string;
	readonly roundId: string;
	readonly roomId: string;
	readonly voterId: string;
	readonly team: TeamSide;
	readonly castAt: Date;
};

export type NewVote = {
	readonly id: string;
	readonly roundId: string;
	readonly roomId: string;
	readonly voterId: string;
	readonly team: TeamSide;
	readonly castAt: Date;
};

export type CastVoteOutcome =
	| { readonly kind: "created"; readonly vote: VoteRecord }
	| { readonly kind: "duplicate" };

export type VoteCounts = {
	readonly proCount: number;
	readonly contraCount: number;
	readonly totalCount: number;
};

export interface VoteRepository {
	cast(input: NewVote): Promise<CastVoteOutcome>;
	findByRoundAndVoter(roundId: string, voterId: string): Promise<VoteRecord | null>;
	counts(roundId: string): Promise<VoteCounts>;
}
