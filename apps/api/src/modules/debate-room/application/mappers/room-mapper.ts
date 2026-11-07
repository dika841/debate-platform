import type { Room, RoomDetail } from "@app/api-contract";
import type { RoomParticipationSnapshot } from "../ports/room-participation-reader.ts";
import type { RoomWithHost } from "../ports/room-repository.ts";

export const toRoomDto = ({ room, host }: RoomWithHost, actorId: string | null): Room => ({
	id: room.id,
	host: {
		id: host.id,
		displayName: host.displayName,
		username: host.username,
	},
	title: room.title,
	motion: room.motion,
	description: room.description,
	status: room.status,
	teamSize: room.teamSize,
	roundCount: room.roundCount,
	submissionDurationMinutes: room.submissionDurationMinutes,
	votingDurationMinutes: room.votingDurationMinutes,
	spectatorVotingEnabled: room.spectatorVotingEnabled,
	publishedAt: room.publishedAt?.toISOString() ?? null,
	cancelledAt: room.cancelledAt?.toISOString() ?? null,
	createdAt: room.createdAt.toISOString(),
	updatedAt: room.updatedAt.toISOString(),
	isHost: actorId !== null && room.hostId === actorId,
});

export const toRoomDetailDto = (
	found: RoomWithHost,
	actorId: string | null,
	participation: RoomParticipationSnapshot,
): RoomDetail => ({
	...toRoomDto(found, actorId),
	participantCount: participation.participantCount,
	spectatorCount: participation.spectatorCount,
	viewerRole: actorId !== null && found.room.hostId === actorId ? "HOST" : participation.viewerRole,
});
