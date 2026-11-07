import type { CastVoteInput, VoteSummary } from "@app/api-contract";
import {
	APPLICATION_ERROR_CODE,
	ApplicationError,
	type Clock,
	DOMAIN_ERROR_CODE,
	DomainError,
	systemClock,
} from "@app/shared";
import { effectiveRoundStatus } from "#/modules/debate-execution/domain/round.ts";
import type { RoundRepository } from "#/modules/debate-execution/application/ports/round-repository.ts";
import type { RoomRepository } from "#/modules/debate-room/application/ports/room-repository.ts";
import { loadRoom } from "#/modules/debate-room/application/room-access.ts";
import type { MembershipRepository } from "#/modules/membership/application/ports/membership-repository.ts";
import { areVoteTotalsRevealed, assertVoterEligible, assertVotingOpen } from "../../domain/vote.ts";
import { toVoteSummary } from "../mappers/vote-mapper.ts";
import type { VoteRepository } from "../ports/vote-repository.ts";

export type CastVoteDeps = {
	readonly rooms: RoomRepository;
	readonly rounds: RoundRepository;
	readonly memberships: MembershipRepository;
	readonly votes: VoteRepository;
	readonly clock?: Clock;
	readonly generateId?: () => string;
};

export const castVote = async (
	deps: CastVoteDeps,
	actorId: string,
	input: CastVoteInput,
): Promise<VoteSummary> => {
	const round = await deps.rounds.findById(input.roundId);

	if (!round) {
		throw new ApplicationError(APPLICATION_ERROR_CODE.RESOURCE_NOT_FOUND, "Round not found");
	}

	const room = await loadRoom(deps.rooms, round.roomId);
	const clock = deps.clock ?? systemClock;
	const now = clock.now();
	const effective = effectiveRoundStatus(round, now);

	assertVotingOpen(effective, room.room.status);

	const membership = await deps.memberships.findByRoomAndUser(round.roomId, actorId);
	const isHost = room.room.hostId === actorId;

	assertVoterEligible({
		isHost,
		membershipRole: membership?.membership.role ?? null,
		spectatorVotingEnabled: room.room.spectatorVotingEnabled,
	});

	const generateId = deps.generateId ?? (() => crypto.randomUUID());
	const outcome = await deps.votes.cast({
		id: generateId(),
		roundId: round.id,
		roomId: round.roomId,
		voterId: actorId,
		team: input.team,
		castAt: now,
	});

	if (outcome.kind === "duplicate") {
		throw new DomainError(DOMAIN_ERROR_CODE.DUPLICATE_VOTE, "You have already voted in this round");
	}

	const counts = await deps.votes.counts(round.id);

	return toVoteSummary(
		round.id,
		counts,
		areVoteTotalsRevealed(effective, isHost),
		outcome.vote.team,
	);
};
