import "dotenv/config";

import {
	contentReports,
	debateRooms,
	debateRounds,
	roomMemberships,
	roomResults,
	roundResults,
	roundSubmissions,
	roundVotes,
	userProfiles,
	users,
} from "@app/database/schema";
import {
	MEMBERSHIP_ROLE,
	REPORT_CATEGORY,
	REPORT_STATUS,
	RESULT_OUTCOME,
	ROOM_STATUS,
	ROUND_STATUS,
	TEAM_SIDE,
} from "@app/shared";
import { eq } from "drizzle-orm";
import { auth } from "#/platform/auth/index.ts";
import { databaseHandle } from "#/platform/db/index.ts";
import { redactError } from "@app/logger";
import { logger } from "#/platform/observability/logger.ts";

const db = databaseHandle.db;
const isProduction = process.env.NODE_ENV === "production";
const allowProduction = process.env.SEED_ALLOW_PRODUCTION === "true";

if (isProduction && !allowProduction) {
	logger.error(
		{},
		"seed.blocked: refusing to create demo accounts with NODE_ENV=production (set SEED_ALLOW_PRODUCTION=true to override)",
	);
	process.exit(1);
}

if (isProduction && !process.env.SEED_PASSWORD) {
	logger.error({}, "seed.blocked: SEED_PASSWORD is required when seeding production");
	process.exit(1);
}

const password = process.env.SEED_PASSWORD ?? "DemoPassword123!";
const now = Date.now();
const minutesAgo = (minutes: number): Date => new Date(now - minutes * 60_000);
const minutesFromNow = (minutes: number): Date => new Date(now + minutes * 60_000);

type DemoUser = {
	readonly email: string;
	readonly name: string;
	readonly username: string;
	readonly role: "USER" | "MODERATOR" | "ADMIN";
};

const DEMO_USERS: readonly DemoUser[] = [
	{
		email: process.env.SEED_EMAIL ?? "demo@example.com",
		name: "Demo Host",
		username: "demo_host",
		role: "USER",
	},
	{ email: "aisha@example.com", name: "Aisha Rahman", username: "aisha", role: "USER" },
	{ email: "budi@example.com", name: "Budi Santoso", username: "budi", role: "USER" },
	{ email: "citra@example.com", name: "Citra Lestari", username: "citra", role: "USER" },
	{
		email: "moderator@example.com",
		name: "Maya Moderator",
		username: "maya_mod",
		role: "MODERATOR",
	},
	{ email: "admin@example.com", name: "Andi Admin", username: "andi_admin", role: "ADMIN" },
];

type SeedAccount = DemoUser & { readonly id: string };

const ensureUser = async (demo: DemoUser): Promise<SeedAccount> => {
	const [existing] = await db
		.select({ id: users.id, email: users.email, name: users.name })
		.from(users)
		.where(eq(users.email, demo.email))
		.limit(1);

	if (existing) {
		await db
			.update(users)
			.set({ name: demo.name, role: demo.role, updatedAt: new Date() })
			.where(eq(users.id, existing.id));
		await db
			.insert(userProfiles)
			.values({
				userId: existing.id,
				username: demo.username,
				displayName: demo.name,
			})
			.onConflictDoUpdate({
				target: userProfiles.userId,
				set: { username: demo.username, displayName: demo.name, updatedAt: new Date() },
			});
		return { ...demo, id: existing.id };
	}

	try {
		await auth.api.signUpEmail({
			body: { email: demo.email, password, name: demo.name },
		});
	} catch (error) {
		logger.warn({ err: redactError(error) }, "seed.user_signup_failed_retrying");
	}

	const [created] = await db
		.select({ id: users.id, email: users.email, name: users.name })
		.from(users)
		.where(eq(users.email, demo.email))
		.limit(1);

	if (!created) {
		throw new Error(`Unable to create seed user ${demo.email}`);
	}

	await db
		.update(users)
		.set({ name: demo.name, role: demo.role, updatedAt: new Date() })
		.where(eq(users.id, created.id));
	await db
		.insert(userProfiles)
		.values({
			userId: created.id,
			username: demo.username,
			displayName: demo.name,
		})
		.onConflictDoUpdate({
			target: userProfiles.userId,
			set: { username: demo.username, displayName: demo.name, updatedAt: new Date() },
		});

	return { ...demo, id: created.id };
};

const seed = async (): Promise<void> => {
	const accounts = new Map<string, SeedAccount>();

	for (const demo of DEMO_USERS) {
		const account = await ensureUser(demo);
		accounts.set(demo.username, account);
	}

	const host = accounts.get("demo_host");
	const aisha = accounts.get("aisha");
	const budi = accounts.get("budi");
	const citra = accounts.get("citra");
	const moderator = accounts.get("maya_mod");
	const admin = accounts.get("andi_admin");

	if (!host || !aisha || !budi || !citra || !moderator || !admin) {
		throw new Error("Seed accounts missing");
	}

	await db
		.insert(debateRooms)
		.values([
			{
				id: "seed-room-completed",
				hostId: host.id,
				title: "AI Regulation: Promise or Peril?",
				motion: "This house believes AI development should pause until regulation catches up.",
				description:
					"A completed two-round debate demonstrating submissions, voting, round results and the overall winner.",
				status: ROOM_STATUS.COMPLETED,
				teamSize: 1,
				roundCount: 2,
				submissionDurationMinutes: 30,
				votingDurationMinutes: 30,
				spectatorVotingEnabled: true,
				publishedAt: minutesAgo(3 * 24 * 60),
				assignmentFinalizedAt: minutesAgo(2 * 24 * 60),
				createdAt: minutesAgo(4 * 24 * 60),
				updatedAt: minutesAgo(24 * 60),
			},
			{
				id: "seed-room-voting",
				hostId: host.id,
				title: "Universal Basic Income",
				motion: "This house would introduce an unconditional basic income.",
				description:
					"An in-progress debate with round one in the voting phase and round two still pending.",
				status: ROOM_STATUS.IN_PROGRESS,
				teamSize: 1,
				roundCount: 2,
				submissionDurationMinutes: 30,
				votingDurationMinutes: 30,
				spectatorVotingEnabled: true,
				publishedAt: minutesAgo(3 * 60),
				assignmentFinalizedAt: minutesAgo(2 * 60),
				createdAt: minutesAgo(4 * 60),
				updatedAt: minutesAgo(30),
			},
			{
				id: "seed-room-open",
				hostId: host.id,
				title: "Climate Reparations",
				motion: "This house believes wealthy nations owe climate reparations.",
				description: "An open 2v2 room looking for participants. Join from the room page.",
				status: ROOM_STATUS.PUBLISHED,
				teamSize: 2,
				roundCount: 3,
				submissionDurationMinutes: 45,
				votingDurationMinutes: 30,
				spectatorVotingEnabled: true,
				publishedAt: minutesAgo(60),
				createdAt: minutesAgo(90),
				updatedAt: minutesAgo(60),
			},
			{
				id: "seed-room-draft",
				hostId: host.id,
				title: "Four-Day Work Week",
				motion: "This house would move to a four-day work week without pay cuts.",
				description: "A draft room that only the host can edit.",
				status: ROOM_STATUS.DRAFT,
				teamSize: 2,
				roundCount: 2,
				submissionDurationMinutes: 30,
				votingDurationMinutes: 30,
				spectatorVotingEnabled: true,
				createdAt: minutesAgo(20),
				updatedAt: minutesAgo(20),
			},
			{
				id: "seed-room-cancelled",
				hostId: host.id,
				title: "Mandatory Military Service",
				motion: "This house would require two years of mandatory military service.",
				description: "A cancelled room kept for history.",
				status: ROOM_STATUS.CANCELLED,
				teamSize: 1,
				roundCount: 1,
				submissionDurationMinutes: 30,
				votingDurationMinutes: 30,
				spectatorVotingEnabled: false,
				publishedAt: minutesAgo(5 * 60),
				cancelledAt: minutesAgo(4 * 60),
				createdAt: minutesAgo(6 * 60),
				updatedAt: minutesAgo(4 * 60),
			},
		])
		.onConflictDoNothing();

	await db
		.insert(roomMemberships)
		.values([
			{
				id: "seed-member-completed-aisha",
				roomId: "seed-room-completed",
				userId: aisha.id,
				role: MEMBERSHIP_ROLE.PARTICIPANT,
				team: TEAM_SIDE.PRO,
				joinedAt: minutesAgo(2 * 24 * 60),
			},
			{
				id: "seed-member-completed-budi",
				roomId: "seed-room-completed",
				userId: budi.id,
				role: MEMBERSHIP_ROLE.PARTICIPANT,
				team: TEAM_SIDE.CONTRA,
				joinedAt: minutesAgo(2 * 24 * 60),
			},
			{
				id: "seed-member-completed-citra",
				roomId: "seed-room-completed",
				userId: citra.id,
				role: MEMBERSHIP_ROLE.SPECTATOR,
				team: null,
				joinedAt: minutesAgo(2 * 24 * 60),
			},
			{
				id: "seed-member-voting-aisha",
				roomId: "seed-room-voting",
				userId: aisha.id,
				role: MEMBERSHIP_ROLE.PARTICIPANT,
				team: TEAM_SIDE.PRO,
				joinedAt: minutesAgo(2 * 60),
			},
			{
				id: "seed-member-voting-budi",
				roomId: "seed-room-voting",
				userId: budi.id,
				role: MEMBERSHIP_ROLE.PARTICIPANT,
				team: TEAM_SIDE.CONTRA,
				joinedAt: minutesAgo(2 * 60),
			},
			{
				id: "seed-member-voting-citra",
				roomId: "seed-room-voting",
				userId: citra.id,
				role: MEMBERSHIP_ROLE.SPECTATOR,
				team: null,
				joinedAt: minutesAgo(90),
			},
			{
				id: "seed-member-voting-moderator",
				roomId: "seed-room-voting",
				userId: moderator.id,
				role: MEMBERSHIP_ROLE.SPECTATOR,
				team: null,
				joinedAt: minutesAgo(80),
			},
			{
				id: "seed-member-voting-admin",
				roomId: "seed-room-voting",
				userId: admin.id,
				role: MEMBERSHIP_ROLE.SPECTATOR,
				team: null,
				joinedAt: minutesAgo(70),
			},
			{
				id: "seed-member-open-citra",
				roomId: "seed-room-open",
				userId: citra.id,
				role: MEMBERSHIP_ROLE.SPECTATOR,
				team: null,
				joinedAt: minutesAgo(30),
			},
		])
		.onConflictDoNothing();

	await db
		.insert(debateRounds)
		.values([
			{
				id: "seed-round-completed-1",
				roomId: "seed-room-completed",
				roundNumber: 1,
				status: ROUND_STATUS.CLOSED,
				opensAt: minutesAgo(2 * 24 * 60),
				submissionDeadline: minutesAgo(2 * 24 * 60 - 30),
				votingDeadline: minutesAgo(2 * 24 * 60 - 60),
				createdAt: minutesAgo(2 * 24 * 60),
				updatedAt: minutesAgo(2 * 24 * 60 - 60),
			},
			{
				id: "seed-round-completed-2",
				roomId: "seed-room-completed",
				roundNumber: 2,
				status: ROUND_STATUS.CLOSED,
				opensAt: minutesAgo(24 * 60),
				submissionDeadline: minutesAgo(24 * 60 - 30),
				votingDeadline: minutesAgo(24 * 60 - 60),
				createdAt: minutesAgo(24 * 60),
				updatedAt: minutesAgo(24 * 60 - 60),
			},
			{
				id: "seed-round-voting-1",
				roomId: "seed-room-voting",
				roundNumber: 1,
				status: ROUND_STATUS.VOTING,
				opensAt: minutesAgo(90),
				submissionDeadline: minutesAgo(30),
				votingDeadline: minutesFromNow(30),
				createdAt: minutesAgo(90),
				updatedAt: minutesAgo(30),
			},
			{
				id: "seed-round-voting-2",
				roomId: "seed-room-voting",
				roundNumber: 2,
				status: ROUND_STATUS.PENDING,
				opensAt: null,
				submissionDeadline: null,
				votingDeadline: null,
				createdAt: minutesAgo(90),
				updatedAt: minutesAgo(90),
			},
		])
		.onConflictDoNothing();

	await db
		.insert(roundSubmissions)
		.values([
			{
				id: "seed-submission-completed-1-pro",
				roundId: "seed-round-completed-1",
				roomId: "seed-room-completed",
				authorId: aisha.id,
				team: TEAM_SIDE.PRO,
				content:
					"Pausing frontier model training gives regulators time to build meaningful safety standards, audit data pipelines and catch up with capabilities that are already outpacing oversight.",
				submittedAt: minutesAgo(2 * 24 * 60 - 20),
			},
			{
				id: "seed-submission-completed-1-contra",
				roundId: "seed-round-completed-1",
				roomId: "seed-room-completed",
				authorId: budi.id,
				team: TEAM_SIDE.CONTRA,
				content:
					"A pause entrenches today's incumbents and pushes research into less transparent jurisdictions. Iterative deployment with licensing and audits regulates real systems instead of freezing the field.",
				submittedAt: minutesAgo(2 * 24 * 60 - 18),
			},
			{
				id: "seed-submission-completed-2-pro",
				roundId: "seed-round-completed-2",
				roomId: "seed-room-completed",
				authorId: aisha.id,
				team: TEAM_SIDE.PRO,
				content:
					"Regulation should be treated like aviation safety: pre-deployment evaluation, incident reporting and liability. Voluntary commitments have repeatedly failed once commercial pressure mounts.",
				submittedAt: minutesAgo(24 * 60 - 20),
			},
			{
				id: "seed-submission-completed-2-contra",
				roundId: "seed-round-completed-2",
				roomId: "seed-room-completed",
				authorId: budi.id,
				team: TEAM_SIDE.CONTRA,
				content:
					"Rigid pre-clearance would lock in today's safety techniques, which are already outdated at deployment. Proportional, use-based rules and post-market monitoring adapt faster than a single gate.",
				submittedAt: minutesAgo(24 * 60 - 18),
			},
			{
				id: "seed-submission-voting-1-pro",
				roundId: "seed-round-voting-1",
				roomId: "seed-room-voting",
				authorId: aisha.id,
				team: TEAM_SIDE.PRO,
				content:
					"An unconditional basic income removes the poverty trap created by means testing, rewards care work and gives workers the bargaining power to navigate automation without destitution.",
				submittedAt: minutesAgo(60),
			},
			{
				id: "seed-submission-voting-1-contra",
				roundId: "seed-round-voting-1",
				roomId: "seed-room-voting",
				authorId: budi.id,
				team: TEAM_SIDE.CONTRA,
				content:
					"A universal cash transfer is regressive compared with targeted support and would require tax rises that fall hardest on the working households it claims to help. Build services first.",
				submittedAt: minutesAgo(58),
			},
		])
		.onConflictDoNothing();

	await db
		.insert(roundVotes)
		.values([
			{
				id: "seed-vote-completed-1-host",
				roundId: "seed-round-completed-1",
				roomId: "seed-room-completed",
				voterId: host.id,
				team: TEAM_SIDE.PRO,
				castAt: minutesAgo(2 * 24 * 60 - 40),
			},
			{
				id: "seed-vote-completed-1-citra",
				roundId: "seed-round-completed-1",
				roomId: "seed-room-completed",
				voterId: citra.id,
				team: TEAM_SIDE.PRO,
				castAt: minutesAgo(2 * 24 * 60 - 38),
			},
			{
				id: "seed-vote-completed-1-moderator",
				roundId: "seed-round-completed-1",
				roomId: "seed-room-completed",
				voterId: moderator.id,
				team: TEAM_SIDE.PRO,
				castAt: minutesAgo(2 * 24 * 60 - 36),
			},
			{
				id: "seed-vote-completed-1-admin",
				roundId: "seed-round-completed-1",
				roomId: "seed-room-completed",
				voterId: admin.id,
				team: TEAM_SIDE.CONTRA,
				castAt: minutesAgo(2 * 24 * 60 - 34),
			},
			{
				id: "seed-vote-completed-2-host",
				roundId: "seed-round-completed-2",
				roomId: "seed-room-completed",
				voterId: host.id,
				team: TEAM_SIDE.PRO,
				castAt: minutesAgo(24 * 60 - 40),
			},
			{
				id: "seed-vote-completed-2-citra",
				roundId: "seed-round-completed-2",
				roomId: "seed-room-completed",
				voterId: citra.id,
				team: TEAM_SIDE.PRO,
				castAt: minutesAgo(24 * 60 - 38),
			},
			{
				id: "seed-vote-completed-2-moderator",
				roundId: "seed-round-completed-2",
				roomId: "seed-room-completed",
				voterId: moderator.id,
				team: TEAM_SIDE.PRO,
				castAt: minutesAgo(24 * 60 - 36),
			},
			{
				id: "seed-vote-completed-2-admin",
				roundId: "seed-round-completed-2",
				roomId: "seed-room-completed",
				voterId: admin.id,
				team: TEAM_SIDE.PRO,
				castAt: minutesAgo(24 * 60 - 34),
			},
			{
				id: "seed-vote-voting-1-host",
				roundId: "seed-round-voting-1",
				roomId: "seed-room-voting",
				voterId: host.id,
				team: TEAM_SIDE.PRO,
				castAt: minutesAgo(25),
			},
			{
				id: "seed-vote-voting-1-citra",
				roundId: "seed-round-voting-1",
				roomId: "seed-room-voting",
				voterId: citra.id,
				team: TEAM_SIDE.PRO,
				castAt: minutesAgo(24),
			},
			{
				id: "seed-vote-voting-1-moderator",
				roundId: "seed-round-voting-1",
				roomId: "seed-room-voting",
				voterId: moderator.id,
				team: TEAM_SIDE.PRO,
				castAt: minutesAgo(22),
			},
			{
				id: "seed-vote-voting-1-admin",
				roundId: "seed-round-voting-1",
				roomId: "seed-room-voting",
				voterId: admin.id,
				team: TEAM_SIDE.CONTRA,
				castAt: minutesAgo(20),
			},
		])
		.onConflictDoNothing();

	await db
		.insert(roundResults)
		.values([
			{
				id: "seed-round-result-completed-1",
				roundId: "seed-round-completed-1",
				roomId: "seed-room-completed",
				outcome: RESULT_OUTCOME.PRO,
				proCount: 3,
				contraCount: 1,
				totalVotes: 4,
				finalizedById: host.id,
				finalizedAt: minutesAgo(2 * 24 * 60 - 55),
			},
			{
				id: "seed-round-result-completed-2",
				roundId: "seed-round-completed-2",
				roomId: "seed-room-completed",
				outcome: RESULT_OUTCOME.PRO,
				proCount: 4,
				contraCount: 0,
				totalVotes: 4,
				finalizedById: host.id,
				finalizedAt: minutesAgo(24 * 60 - 55),
			},
		])
		.onConflictDoNothing();

	await db
		.insert(roomResults)
		.values({
			id: "seed-room-result-completed",
			roomId: "seed-room-completed",
			outcome: RESULT_OUTCOME.PRO,
			proWins: 2,
			contraWins: 0,
			draws: 0,
			finalizedById: host.id,
			finalizedAt: minutesAgo(23 * 60),
		})
		.onConflictDoNothing();

	await db
		.insert(contentReports)
		.values([
			{
				id: "seed-report-1",
				roomId: "seed-room-completed",
				submissionId: "seed-submission-completed-1-contra",
				reporterId: citra.id,
				category: REPORT_CATEGORY.HARASSMENT,
				details:
					"The second-round argument attacks the speaker personally instead of responding to the motion.",
				status: REPORT_STATUS.PENDING,
				createdAt: minutesAgo(40),
				updatedAt: minutesAgo(40),
			},
			{
				id: "seed-report-2",
				roomId: "seed-room-voting",
				submissionId: null,
				reporterId: budi.id,
				category: REPORT_CATEGORY.OFF_TOPIC,
				details:
					"Several spectator messages in the room are unrelated to the debate and are derailing the discussion.",
				status: REPORT_STATUS.PENDING,
				createdAt: minutesAgo(15),
				updatedAt: minutesAgo(15),
			},
			{
				id: "seed-report-3",
				roomId: "seed-room-completed",
				submissionId: null,
				reporterId: citra.id,
				category: REPORT_CATEGORY.SPAM,
				details:
					"An earlier version of this room contained repeated promotional links; moderators already reviewed it.",
				status: REPORT_STATUS.DISMISSED,
				resolutionNote: "Checked the room history; no promotional content remains.",
				resolvedById: admin.id,
				resolvedAt: minutesAgo(120),
				createdAt: minutesAgo(180),
				updatedAt: minutesAgo(120),
			},
		])
		.onConflictDoNothing();

	logger.info(
		{
			users: DEMO_USERS.map((user) => user.email),
			rooms: [
				"seed-room-completed",
				"seed-room-voting",
				"seed-room-open",
				"seed-room-draft",
				"seed-room-cancelled",
			],
			reports: 3,
		},
		"seed.complete",
	);
};

try {
	await seed();
} catch (error) {
	logger.error({ err: redactError(error) }, "seed.failed");
	process.exitCode = 1;
} finally {
	await databaseHandle.close();
}
