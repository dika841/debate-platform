import type { RoomStatus } from "@app/shared";
import type { RoomConfiguration } from "../../domain/room.ts";

export type RoomHost = {
	readonly id: string;
	readonly displayName: string;
	readonly username: string | null;
};

export type RoomRecord = RoomConfiguration & {
	readonly id: string;
	readonly hostId: string;
	readonly status: RoomStatus;
	readonly publishedAt: Date | null;
	readonly cancelledAt: Date | null;
	readonly createdAt: Date;
	readonly updatedAt: Date;
};

export type RoomWithHost = {
	readonly room: RoomRecord;
	readonly host: RoomHost;
};

export type NewRoomRecord = {
	readonly id: string;
	readonly hostId: string;
	readonly configuration: RoomConfiguration;
	readonly status: RoomStatus;
	readonly createdAt: Date;
};

export type RoomPatch = Partial<RoomConfiguration> & {
	readonly status?: RoomStatus;
	readonly publishedAt?: Date | null;
	readonly cancelledAt?: Date | null;
	readonly updatedAt: Date;
};

export type RoomListFilter = {
	readonly hostId?: string;
	readonly memberId?: string;
	readonly statuses?: readonly RoomStatus[];
	readonly status?: RoomStatus;
	readonly cursor?: string | null;
	readonly limit: number;
};

export type RoomPage = {
	readonly items: readonly RoomWithHost[];
	readonly nextCursor: string | null;
};

export interface RoomRepository {
	create(input: NewRoomRecord): Promise<RoomWithHost>;
	findById(id: string): Promise<RoomWithHost | null>;
	list(filter: RoomListFilter): Promise<RoomPage>;
	update(id: string, patch: RoomPatch): Promise<RoomWithHost>;
}
