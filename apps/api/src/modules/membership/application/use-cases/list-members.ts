import type { ListMembersInput, ListMembersResult } from "@app/api-contract";
import {
	APPLICATION_ERROR_CODE,
	ApplicationError,
	isPublicRoomStatus,
	pageRequest,
} from "@app/shared";
import { loadRoom } from "#/modules/debate-room/application/room-access.ts";
import type { RoomParticipationReader } from "#/modules/debate-room/application/ports/room-participation-reader.ts";
import type { RoomRepository } from "#/modules/debate-room/application/ports/room-repository.ts";
import { toMembershipDto } from "../mappers/membership-mapper.ts";
import type { MembershipRepository } from "../ports/membership-repository.ts";

export type ListMembersDeps = {
	readonly rooms: RoomRepository;
	readonly memberships: MembershipRepository;
	readonly participation: RoomParticipationReader;
};

export const listMembers = async (
	deps: ListMembersDeps,
	actorId: string | null,
	input: ListMembersInput,
): Promise<ListMembersResult> => {
	const found = await loadRoom(deps.rooms, input.roomId);

	if (!isPublicRoomStatus(found.room.status) && found.room.hostId !== actorId) {
		const participation = await deps.participation.snapshot(input.roomId, actorId);

		if (participation.viewerRole === null) {
			throw new ApplicationError(APPLICATION_ERROR_CODE.RESOURCE_NOT_FOUND, "Room not found");
		}
	}

	const page = pageRequest({ cursor: input.cursor, limit: input.limit });
	const result = await deps.memberships.list({
		roomId: input.roomId,
		role: input.role,
		cursor: page.cursor,
		limit: page.limit,
	});

	return {
		items: result.items.map(toMembershipDto),
		nextCursor: result.nextCursor,
	};
};
