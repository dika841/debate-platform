import type { Database } from "@app/database";
import { debateRooms, roomMemberships, userProfiles, users } from "@app/database/schema";
import { MEMBERSHIP_ROLE, TEAM_SIDE, type MembershipRole, type TeamSide } from "@app/shared";
import { and, asc, eq, gt, or, sql, type SQL } from "drizzle-orm";
import { decodeCursor, encodeCursor } from "#/platform/persistence/cursor.ts";
import type {
	JoinMembershipCommand,
	JoinOutcome,
	MembershipListFilter,
	MembershipPage,
	MembershipRepository,
	MembershipWithUser,
	TeamAssignment,
} from "../../application/ports/membership-repository.ts";

type MembershipRow = {
	id: string;
	roomId: string;
	userId: string;
	role: string;
	team: string | null;
	joinedAt: Date;
	name: string;
	image: string | null;
	displayName: string | null;
	username: string | null;
	avatarUrl: string | null;
};

const membershipSelection = {
	id: roomMemberships.id,
	roomId: roomMemberships.roomId,
	userId: roomMemberships.userId,
	role: roomMemberships.role,
	team: roomMemberships.team,
	joinedAt: roomMemberships.joinedAt,
	name: users.name,
	image: users.image,
	displayName: userProfiles.displayName,
	username: userProfiles.username,
	avatarUrl: userProfiles.avatarUrl,
};

const rowToMembership = (row: MembershipRow): MembershipWithUser => ({
	membership: {
		id: row.id,
		roomId: row.roomId,
		userId: row.userId,
		role: row.role as MembershipRole,
		team: row.team as TeamSide | null,
		joinedAt: row.joinedAt,
	},
	user: {
		id: row.userId,
		displayName: row.displayName ?? row.name,
		username: row.username,
		avatarUrl: row.avatarUrl ?? row.image,
	},
});

type TransactionOutcome =
	| { readonly kind: "capacity_exceeded" }
	| { readonly kind: "room_missing" }
	| {
			readonly kind: "joined" | "already_member" | "role_conflict";
			readonly id: string;
	  };

export const createDrizzleMembershipRepository = (db: Database): MembershipRepository => {
	const findById = async (id: string): Promise<MembershipWithUser | null> => {
		const [row] = await db
			.select(membershipSelection)
			.from(roomMemberships)
			.innerJoin(users, eq(roomMemberships.userId, users.id))
			.leftJoin(userProfiles, eq(userProfiles.userId, users.id))
			.where(eq(roomMemberships.id, id))
			.limit(1);

		return row ? rowToMembership(row) : null;
	};

	return {
		async join(command: JoinMembershipCommand): Promise<JoinOutcome> {
			const outcome = await db.transaction(async (tx): Promise<TransactionOutcome> => {
				const [room] = await tx
					.select({ id: debateRooms.id })
					.from(debateRooms)
					.where(eq(debateRooms.id, command.roomId))
					.limit(1)
					.for("update");

				if (!room) {
					return { kind: "room_missing" };
				}

				const [existing] = await tx
					.select({ id: roomMemberships.id, role: roomMemberships.role })
					.from(roomMemberships)
					.where(
						and(
							eq(roomMemberships.roomId, command.roomId),
							eq(roomMemberships.userId, command.userId),
						),
					)
					.limit(1);

				if (existing) {
					return {
						kind: existing.role === command.role ? "already_member" : "role_conflict",
						id: existing.id,
					};
				}

				if (command.role === MEMBERSHIP_ROLE.PARTICIPANT && command.capacity !== null) {
					const [counts] = await tx
						.select({ value: sql<number>`count(*)::int` })
						.from(roomMemberships)
						.where(
							and(
								eq(roomMemberships.roomId, command.roomId),
								eq(roomMemberships.role, MEMBERSHIP_ROLE.PARTICIPANT),
							),
						);

					if (Number(counts?.value ?? 0) >= command.capacity) {
						return { kind: "capacity_exceeded" };
					}
				}

				const [created] = await tx
					.insert(roomMemberships)
					.values({
						id: command.id,
						roomId: command.roomId,
						userId: command.userId,
						role: command.role,
						team: command.team,
						joinedAt: command.joinedAt,
					})
					.returning({ id: roomMemberships.id });

				if (!created) {
					throw new Error("Membership insert failed");
				}

				return { kind: "joined", id: created.id };
			});

			if (outcome.kind === "room_missing") {
				throw new Error("Room not found");
			}

			if (outcome.kind === "capacity_exceeded") {
				return outcome;
			}

			const membership = await findById(outcome.id);

			if (!membership) {
				throw new Error("Membership not found after join");
			}

			return { kind: outcome.kind, membership };
		},

		async leave(roomId, userId) {
			const deleted = await db
				.delete(roomMemberships)
				.where(and(eq(roomMemberships.roomId, roomId), eq(roomMemberships.userId, userId)))
				.returning({ id: roomMemberships.id });

			return deleted.length > 0;
		},

		async list(filter: MembershipListFilter): Promise<MembershipPage> {
			const conditions: SQL[] = [eq(roomMemberships.roomId, filter.roomId)];

			if (filter.role) {
				conditions.push(eq(roomMemberships.role, filter.role));
			}

			const cursor = decodeCursor(filter.cursor);
			if (cursor) {
				const cursorCondition = or(
					gt(roomMemberships.joinedAt, cursor.timestamp),
					and(eq(roomMemberships.joinedAt, cursor.timestamp), gt(roomMemberships.id, cursor.id)),
				);

				if (cursorCondition) {
					conditions.push(cursorCondition);
				}
			}

			const rows = await db
				.select(membershipSelection)
				.from(roomMemberships)
				.innerJoin(users, eq(roomMemberships.userId, users.id))
				.leftJoin(userProfiles, eq(userProfiles.userId, users.id))
				.where(and(...conditions))
				.orderBy(asc(roomMemberships.joinedAt), asc(roomMemberships.id))
				.limit(filter.limit + 1);

			const hasMore = rows.length > filter.limit;
			const pageRows = hasMore ? rows.slice(0, filter.limit) : rows;
			const items = pageRows.map(rowToMembership);
			const lastItem = items.at(-1);

			return {
				items,
				nextCursor:
					hasMore && lastItem
						? encodeCursor({
								timestamp: lastItem.membership.joinedAt,
								id: lastItem.membership.id,
							})
						: null,
			};
		},

		findById,

		async findByRoomAndUser(roomId: string, userId: string) {
			const [row] = await db
				.select(membershipSelection)
				.from(roomMemberships)
				.innerJoin(users, eq(roomMemberships.userId, users.id))
				.leftJoin(userProfiles, eq(userProfiles.userId, users.id))
				.where(and(eq(roomMemberships.roomId, roomId), eq(roomMemberships.userId, userId)))
				.limit(1);

			return row ? rowToMembership(row) : null;
		},

		async listParticipants(roomId: string) {
			const rows = await db
				.select(membershipSelection)
				.from(roomMemberships)
				.innerJoin(users, eq(roomMemberships.userId, users.id))
				.leftJoin(userProfiles, eq(userProfiles.userId, users.id))
				.where(
					and(
						eq(roomMemberships.roomId, roomId),
						eq(roomMemberships.role, MEMBERSHIP_ROLE.PARTICIPANT),
					),
				)
				.orderBy(asc(roomMemberships.joinedAt), asc(roomMemberships.id));

			return rows.map(rowToMembership);
		},

		async listUserIds(roomId: string) {
			const rows = await db
				.select({ userId: roomMemberships.userId })
				.from(roomMemberships)
				.where(eq(roomMemberships.roomId, roomId));

			return rows.map((row) => row.userId);
		},

		async updateTeam(id: string, team: TeamSide | null) {
			const [updated] = await db
				.update(roomMemberships)
				.set({ team })
				.where(eq(roomMemberships.id, id))
				.returning({ id: roomMemberships.id });

			if (!updated) {
				throw new Error("Membership not found");
			}

			const membership = await findById(id);

			if (!membership) {
				throw new Error("Membership not found after update");
			}

			return membership;
		},

		async assignTeams(assignments: readonly TeamAssignment[]) {
			if (assignments.length === 0) {
				return;
			}

			await db.transaction(async (tx) => {
				for (const assignment of assignments) {
					await tx
						.update(roomMemberships)
						.set({ team: assignment.team })
						.where(eq(roomMemberships.id, assignment.membershipId));
				}
			});
		},
	};
};

export const createDrizzleRoomParticipationReader = (db: Database) => ({
	async snapshot(roomId: string, userId: string | null) {
		const counts = await db
			.select({
				role: roomMemberships.role,
				team: roomMemberships.team,
				value: sql<number>`count(*)::int`,
			})
			.from(roomMemberships)
			.where(eq(roomMemberships.roomId, roomId))
			.groupBy(roomMemberships.role, roomMemberships.team);

		const viewer = userId
			? await db
					.select({ role: roomMemberships.role })
					.from(roomMemberships)
					.where(and(eq(roomMemberships.roomId, roomId), eq(roomMemberships.userId, userId)))
					.limit(1)
			: [];

		const countFor = (role: MembershipRole, team?: TeamSide): number =>
			counts
				.filter((count) => count.role === role && (team === undefined || count.team === team))
				.reduce((total, count) => total + Number(count.value), 0);

		return {
			participantCount: countFor(MEMBERSHIP_ROLE.PARTICIPANT),
			spectatorCount: countFor(MEMBERSHIP_ROLE.SPECTATOR),
			viewerRole: (viewer[0]?.role as MembershipRole | undefined) ?? null,
			proCount: countFor(MEMBERSHIP_ROLE.PARTICIPANT, TEAM_SIDE.PRO),
			contraCount: countFor(MEMBERSHIP_ROLE.PARTICIPANT, TEAM_SIDE.CONTRA),
		};
	},
});
