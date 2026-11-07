import type { JoinMembershipInput, Membership } from "@app/api-contract";
import {
	APPLICATION_ERROR_CODE,
	ApplicationError,
	type Clock,
	DOMAIN_ERROR_CODE,
	DomainError,
	MEMBERSHIP_ROLE,
	participantCapacity,
	systemClock,
} from "@app/shared";
import { loadRoom } from "#/modules/debate-room/application/room-access.ts";
import type { RoomRepository } from "#/modules/debate-room/application/ports/room-repository.ts";
import { assertNotRoomHost, assertRoomJoinable } from "../../domain/membership.ts";
import { toMembershipDto } from "../mappers/membership-mapper.ts";
import type { MembershipRepository } from "../ports/membership-repository.ts";

export type JoinRoomDeps = {
	readonly rooms: RoomRepository;
	readonly memberships: MembershipRepository;
	readonly clock?: Clock;
	readonly generateId?: () => string;
};

export const joinRoom = async (
	deps: JoinRoomDeps,
	userId: string,
	input: JoinMembershipInput,
): Promise<Membership> => {
	if (!userId) {
		throw new ApplicationError(
			APPLICATION_ERROR_CODE.AUTHENTICATION_REQUIRED,
			"Authentication required",
		);
	}

	const found = await loadRoom(deps.rooms, input.roomId);
	assertRoomJoinable(found.room.status);
	assertNotRoomHost(found.room.hostId === userId);

	const clock = deps.clock ?? systemClock;
	const generateId = deps.generateId ?? (() => crypto.randomUUID());
	const capacity =
		input.role === MEMBERSHIP_ROLE.PARTICIPANT ? participantCapacity(found.room.teamSize) : null;

	const outcome = await deps.memberships.join({
		id: generateId(),
		roomId: input.roomId,
		userId,
		role: input.role,
		team: null,
		joinedAt: clock.now(),
		capacity,
	});

	switch (outcome.kind) {
		case "capacity_exceeded":
			throw new DomainError(
				DOMAIN_ERROR_CODE.PARTICIPANT_CAPACITY_EXCEEDED,
				"This room has no participant slots left",
			);
		case "role_conflict":
			throw new DomainError(
				DOMAIN_ERROR_CODE.INVALID_MEMBERSHIP,
				"Leave the room before joining with a different role",
			);
		default:
			return toMembershipDto(outcome.membership);
	}
};
