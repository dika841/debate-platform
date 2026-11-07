import { relations } from "drizzle-orm";
import {
	boolean,
	index,
	integer,
	pgTable,
	text,
	timestamp,
	uniqueIndex,
	varchar,
} from "drizzle-orm/pg-core";

/**
 * Authentication tables are owned by Better Auth.
 * Application profile data is stored separately in `user_profiles`.
 */
export const users = pgTable("users", {
	id: text("id").primaryKey(),
	name: text("name").notNull(),
	email: text("email").notNull().unique(),
	emailVerified: boolean("email_verified").notNull().default(false),
	image: text("image"),
	role: text("role").notNull().default("USER"),
	createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const sessions = pgTable(
	"sessions",
	{
		id: text("id").primaryKey(),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		token: text("token").notNull().unique(),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
		ipAddress: text("ip_address"),
		userAgent: text("user_agent"),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
	},
	(table) => [index("idx_sessions_user").on(table.userId)],
);

export const accounts = pgTable(
	"accounts",
	{
		id: text("id").primaryKey(),
		accountId: text("account_id").notNull(),
		providerId: text("provider_id").notNull(),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		accessToken: text("access_token"),
		refreshToken: text("refresh_token"),
		idToken: text("id_token"),
		accessTokenExpiresAt: timestamp("access_token_expires_at", { withTimezone: true }),
		refreshTokenExpiresAt: timestamp("refresh_token_expires_at", { withTimezone: true }),
		scope: text("scope"),
		password: text("password"),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index("idx_accounts_user").on(table.userId)],
);

export const verifications = pgTable(
	"verifications",
	{
		id: text("id").primaryKey(),
		identifier: text("identifier").notNull(),
		value: text("value").notNull(),
		expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index("idx_verifications_identifier").on(table.identifier)],
);

export const userProfiles = pgTable(
	"user_profiles",
	{
		userId: text("user_id")
			.primaryKey()
			.references(() => users.id, { onDelete: "cascade" }),
		username: varchar("username", { length: 40 }).unique(),
		displayName: varchar("display_name", { length: 80 }).notNull(),
		avatarUrl: text("avatar_url"),
		bio: varchar("bio", { length: 500 }),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [index("idx_user_profiles_username").on(table.username)],
);

export const debateRooms = pgTable(
	"debate_rooms",
	{
		id: text("id").primaryKey(),
		hostId: text("host_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		title: varchar("title", { length: 120 }).notNull(),
		motion: varchar("motion", { length: 300 }).notNull(),
		description: varchar("description", { length: 2000 }),
		status: text("status").notNull().default("DRAFT"),
		teamSize: integer("team_size").notNull().default(3),
		roundCount: integer("round_count").notNull().default(3),
		submissionDurationMinutes: integer("submission_duration_minutes").notNull().default(30),
		votingDurationMinutes: integer("voting_duration_minutes").notNull().default(30),
		spectatorVotingEnabled: boolean("spectator_voting_enabled").notNull().default(true),
		publishedAt: timestamp("published_at", { withTimezone: true }),
		cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
		createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
		updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		index("idx_debate_rooms_host").on(table.hostId),
		index("idx_debate_rooms_status_created").on(table.status, table.createdAt),
	],
);

export const roomMemberships = pgTable(
	"room_memberships",
	{
		id: text("id").primaryKey(),
		roomId: text("room_id")
			.notNull()
			.references(() => debateRooms.id, { onDelete: "cascade" }),
		userId: text("user_id")
			.notNull()
			.references(() => users.id, { onDelete: "cascade" }),
		role: text("role").notNull(),
		team: text("team"),
		joinedAt: timestamp("joined_at", { withTimezone: true }).notNull().defaultNow(),
	},
	(table) => [
		uniqueIndex("uq_room_memberships_room_user").on(table.roomId, table.userId),
		index("idx_room_memberships_room_role").on(table.roomId, table.role),
		index("idx_room_memberships_user").on(table.userId),
	],
);

export const usersRelations = relations(users, ({ one, many }) => ({
	profile: one(userProfiles, {
		fields: [users.id],
		references: [userProfiles.userId],
	}),
	sessions: many(sessions),
	accounts: many(accounts),
	hostedRooms: many(debateRooms),
	memberships: many(roomMemberships),
}));

export const userProfilesRelations = relations(userProfiles, ({ one }) => ({
	user: one(users, {
		fields: [userProfiles.userId],
		references: [users.id],
	}),
}));

export const debateRoomsRelations = relations(debateRooms, ({ one, many }) => ({
	host: one(users, {
		fields: [debateRooms.hostId],
		references: [users.id],
	}),
	memberships: many(roomMemberships),
}));

export const roomMembershipsRelations = relations(roomMemberships, ({ one }) => ({
	room: one(debateRooms, {
		fields: [roomMemberships.roomId],
		references: [debateRooms.id],
	}),
	user: one(users, {
		fields: [roomMemberships.userId],
		references: [users.id],
	}),
}));
