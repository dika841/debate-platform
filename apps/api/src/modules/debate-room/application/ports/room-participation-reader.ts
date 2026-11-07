import type { MembershipRole } from "@app/shared";

export type RoomParticipationSnapshot = {
	readonly participantCount: number;
	readonly spectatorCount: number;
	readonly viewerRole: MembershipRole | null;
	readonly proCount: number;
	readonly contraCount: number;
};

export interface RoomParticipationReader {
	snapshot(roomId: string, userId: string | null): Promise<RoomParticipationSnapshot>;
}
