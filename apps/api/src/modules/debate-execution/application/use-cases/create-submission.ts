import type { CreateSubmissionInput, Submission } from "@app/api-contract";
import {
	APPLICATION_ERROR_CODE,
	ApplicationError,
	type Clock,
	DOMAIN_ERROR_CODE,
	DomainError,
	MEMBERSHIP_ROLE,
	systemClock,
} from "@app/shared";
import type { RoomRepository } from "#/modules/debate-room/application/ports/room-repository.ts";
import { loadRoom } from "#/modules/debate-room/application/room-access.ts";
import type { MembershipRepository } from "#/modules/membership/application/ports/membership-repository.ts";
import {
	assertParticipantTeam,
	assertRoundSubmittable,
	validateSubmissionContent,
} from "../../domain/round.ts";
import { toSubmissionDto } from "../mappers/execution-mapper.ts";
import type { RoundRepository } from "../ports/round-repository.ts";
import type { SubmissionRepository } from "../ports/submission-repository.ts";

export type CreateSubmissionDeps = {
	readonly rooms: RoomRepository;
	readonly rounds: RoundRepository;
	readonly memberships: MembershipRepository;
	readonly submissions: SubmissionRepository;
	readonly clock?: Clock;
	readonly generateId?: () => string;
};

export const createSubmission = async (
	deps: CreateSubmissionDeps,
	actorId: string,
	input: CreateSubmissionInput,
): Promise<Submission> => {
	const round = await deps.rounds.findById(input.roundId);

	if (!round) {
		throw new ApplicationError(APPLICATION_ERROR_CODE.RESOURCE_NOT_FOUND, "Round not found");
	}

	const room = await loadRoom(deps.rooms, round.roomId);
	const clock = deps.clock ?? systemClock;
	const now = clock.now();

	assertRoundSubmittable(round, room.room.status, now);

	const participants = await deps.memberships.listParticipants(round.roomId);
	const participant = participants.find((entry) => entry.membership.userId === actorId);

	if (!participant || participant.membership.role !== MEMBERSHIP_ROLE.PARTICIPANT) {
		throw new ApplicationError(
			APPLICATION_ERROR_CODE.AUTHORIZATION_DENIED,
			"Only assigned participants can submit an argument",
		);
	}

	const team = assertParticipantTeam(participant.membership.team);
	const existing = await deps.submissions.findByRoundAndAuthor(round.id, actorId);

	if (existing) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.SUBMISSION_ALREADY_EXISTS,
			"You have already submitted an argument for this round",
		);
	}

	const content = validateSubmissionContent(input.content);
	const generateId = deps.generateId ?? (() => crypto.randomUUID());

	const created = await deps.submissions.create({
		id: generateId(),
		roundId: round.id,
		roomId: round.roomId,
		authorId: actorId,
		team,
		content,
		submittedAt: now,
	});

	return toSubmissionDto(created);
};
