import type { LeaveMembershipResult } from "@app/api-contract";
import { loadRoom } from "#/modules/debate-room/application/room-access.ts";
import type { RoomRepository } from "#/modules/debate-room/application/ports/room-repository.ts";
import { assertHostCannotLeave, assertMembershipOpen } from "../../domain/membership.ts";
import type { MembershipRepository } from "../ports/membership-repository.ts";

export type LeaveRoomDeps = {
	readonly rooms: RoomRepository;
	readonly memberships: MembershipRepository;
};

export const leaveRoom = async (
	deps: LeaveRoomDeps,
	userId: string,
	roomId: string,
): Promise<LeaveMembershipResult> => {
	const found = await loadRoom(deps.rooms, roomId);
	assertHostCannotLeave(found.room.hostId === userId);
	assertMembershipOpen(found.room.assignmentFinalizedAt);

	const left = await deps.memberships.leave(roomId, userId);

	return { left };
};
