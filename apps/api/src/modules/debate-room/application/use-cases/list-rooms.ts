import type { ListRoomsInput, ListRoomsResult } from "@app/api-contract";
import {
	APPLICATION_ERROR_CODE,
	ApplicationError,
	pageRequest,
	PUBLIC_ROOM_STATUSES,
} from "@app/shared";
import { toRoomDto } from "../mappers/room-mapper.ts";
import type { RoomRepository } from "../ports/room-repository.ts";

export type ListRoomsDeps = {
	readonly repository: RoomRepository;
};

export const listRooms = async (
	deps: ListRoomsDeps,
	actorId: string | null,
	input: ListRoomsInput,
): Promise<ListRoomsResult> => {
	const scope = input.scope ?? "public";

	if (scope !== "public" && !actorId) {
		throw new ApplicationError(
			APPLICATION_ERROR_CODE.AUTHENTICATION_REQUIRED,
			"Authentication required",
		);
	}

	const page = pageRequest({ cursor: input.cursor, limit: input.limit });

	const result = await deps.repository.list({
		hostId: scope === "mine" ? (actorId ?? undefined) : undefined,
		memberId: scope === "joined" ? (actorId ?? undefined) : undefined,
		status: input.status,
		statuses: scope === "public" && !input.status ? PUBLIC_ROOM_STATUSES : undefined,
		cursor: page.cursor,
		limit: page.limit,
	});

	return {
		items: result.items.map((item) => toRoomDto(item, actorId)),
		nextCursor: result.nextCursor,
	};
};
