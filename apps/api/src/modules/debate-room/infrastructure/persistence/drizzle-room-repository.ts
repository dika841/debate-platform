import type { Database } from "@app/database";
import { debateRooms, roomMemberships, userProfiles, users } from "@app/database/schema";
import type { RoomStatus } from "@app/shared";
import { and, desc, eq, ilike, inArray, lt, or, type SQL } from "drizzle-orm";
import { decodeCursor, encodeCursor } from "#/platform/persistence/cursor.ts";
import type {
	RoomListFilter,
	RoomPage,
	RoomRepository,
	RoomWithHost,
} from "../../application/ports/room-repository.ts";

type RoomRow = {
	id: string;
	hostId: string;
	title: string;
	motion: string;
	description: string | null;
	status: string;
	teamSize: number;
	roundCount: number;
	submissionDurationMinutes: number;
	votingDurationMinutes: number;
	spectatorVotingEnabled: boolean;
	publishedAt: Date | null;
	cancelledAt: Date | null;
	assignmentFinalizedAt: Date | null;
	createdAt: Date;
	updatedAt: Date;
	hostUserId: string;
	hostName: string;
	hostDisplayName: string | null;
	hostUsername: string | null;
};

const escapeLike = (value: string): string => value.replace(/[\\%_]/g, "\\$&");

const roomSelection = {
	id: debateRooms.id,
	hostId: debateRooms.hostId,
	title: debateRooms.title,
	motion: debateRooms.motion,
	description: debateRooms.description,
	status: debateRooms.status,
	teamSize: debateRooms.teamSize,
	roundCount: debateRooms.roundCount,
	submissionDurationMinutes: debateRooms.submissionDurationMinutes,
	votingDurationMinutes: debateRooms.votingDurationMinutes,
	spectatorVotingEnabled: debateRooms.spectatorVotingEnabled,
	publishedAt: debateRooms.publishedAt,
	cancelledAt: debateRooms.cancelledAt,
	assignmentFinalizedAt: debateRooms.assignmentFinalizedAt,
	createdAt: debateRooms.createdAt,
	updatedAt: debateRooms.updatedAt,
	hostUserId: users.id,
	hostName: users.name,
	hostDisplayName: userProfiles.displayName,
	hostUsername: userProfiles.username,
};

const rowToRoom = (row: RoomRow): RoomWithHost => ({
	room: {
		id: row.id,
		hostId: row.hostId,
		title: row.title,
		motion: row.motion,
		description: row.description,
		status: row.status as RoomStatus,
		teamSize: row.teamSize,
		roundCount: row.roundCount,
		submissionDurationMinutes: row.submissionDurationMinutes,
		votingDurationMinutes: row.votingDurationMinutes,
		spectatorVotingEnabled: row.spectatorVotingEnabled,
		publishedAt: row.publishedAt,
		cancelledAt: row.cancelledAt,
		assignmentFinalizedAt: row.assignmentFinalizedAt,
		createdAt: row.createdAt,
		updatedAt: row.updatedAt,
	},
	host: {
		id: row.hostUserId,
		displayName: row.hostDisplayName ?? row.hostName,
		username: row.hostUsername,
	},
});

export const createDrizzleRoomRepository = (db: Database): RoomRepository => {
	const findById = async (id: string): Promise<RoomWithHost | null> => {
		const [row] = await db
			.select(roomSelection)
			.from(debateRooms)
			.innerJoin(users, eq(debateRooms.hostId, users.id))
			.leftJoin(userProfiles, eq(userProfiles.userId, users.id))
			.where(eq(debateRooms.id, id))
			.limit(1);

		return row ? rowToRoom(row) : null;
	};

	return {
		async create(input) {
			await db.insert(debateRooms).values({
				id: input.id,
				hostId: input.hostId,
				...input.configuration,
				status: input.status,
				createdAt: input.createdAt,
				updatedAt: input.createdAt,
			});

			const created = await findById(input.id);

			if (!created) {
				throw new Error("Room insert failed");
			}

			return created;
		},

		findById,

		async list(filter: RoomListFilter): Promise<RoomPage> {
			const conditions: SQL[] = [];

			if (filter.hostId) {
				conditions.push(eq(debateRooms.hostId, filter.hostId));
			}

			if (filter.memberId) {
				const memberRooms = db
					.select({ roomId: roomMemberships.roomId })
					.from(roomMemberships)
					.where(eq(roomMemberships.userId, filter.memberId));

				conditions.push(inArray(debateRooms.id, memberRooms));
			}

			if (filter.status) {
				conditions.push(eq(debateRooms.status, filter.status));
			} else if (filter.statuses && filter.statuses.length > 0) {
				conditions.push(inArray(debateRooms.status, [...filter.statuses]));
			}

			if (filter.search) {
				const pattern = `%${escapeLike(filter.search)}%`;
				const searchCondition = or(
					ilike(debateRooms.title, pattern),
					ilike(debateRooms.motion, pattern),
				);

				if (searchCondition) {
					conditions.push(searchCondition);
				}
			}

			const cursor = decodeCursor(filter.cursor);
			if (cursor) {
				const cursorCondition = or(
					lt(debateRooms.createdAt, cursor.timestamp),
					and(eq(debateRooms.createdAt, cursor.timestamp), lt(debateRooms.id, cursor.id)),
				);

				if (cursorCondition) {
					conditions.push(cursorCondition);
				}
			}

			const rows = await db
				.select(roomSelection)
				.from(debateRooms)
				.innerJoin(users, eq(debateRooms.hostId, users.id))
				.leftJoin(userProfiles, eq(userProfiles.userId, users.id))
				.where(conditions.length > 0 ? and(...conditions) : undefined)
				.orderBy(desc(debateRooms.createdAt), desc(debateRooms.id))
				.limit(filter.limit + 1);

			const hasMore = rows.length > filter.limit;
			const pageRows = hasMore ? rows.slice(0, filter.limit) : rows;
			const items = pageRows.map(rowToRoom);
			const lastItem = items.at(-1);

			return {
				items,
				nextCursor:
					hasMore && lastItem
						? encodeCursor({ timestamp: lastItem.room.createdAt, id: lastItem.room.id })
						: null,
			};
		},

		async update(id, patch) {
			const [updated] = await db
				.update(debateRooms)
				.set({ ...patch })
				.where(eq(debateRooms.id, id))
				.returning({ id: debateRooms.id });

			if (!updated) {
				throw new Error("Room not found");
			}

			const result = await findById(id);

			if (!result) {
				throw new Error("Room not found after update");
			}

			return result;
		},
	};
};
