import type {
	AssignmentSummary,
	GetSessionOutput,
	ListMembersResult,
	ListNotificationsResult,
	ListReportsResult,
	ListRoomsResult,
	ListRoundsResult,
	Notification,
	Report,
	Room,
	RoomDetail,
	RoomResult,
	RoomResults,
	RoundResult,
	UserProfile,
	VoteSummary,
} from "@app/api-contract";
import { afterAll, describe, expect, inject, it } from "vitest";
import { closeDatabase, execute } from "./support/db.ts";
import {
	Agent,
	emailFor,
	type RpcErrorBody,
	roomInput,
	submissionContent,
	usernameFor,
} from "./support/http.ts";

const databaseUrl = process.env.DATABASE_URL;
const apiBaseUrl = inject("apiBaseUrl");
const runId = inject("runId");

const agent = (): Agent => new Agent(apiBaseUrl);

const errorOf = (body: unknown): RpcErrorBody => body as RpcErrorBody;

const first = <T>(items: readonly T[], label: string): T => {
	const item = items[0];

	if (!item) {
		throw new Error(`Expected at least one ${label}`);
	}

	return item;
};

describe.skipIf(!databaseUrl)("HTTP API integration", () => {
	afterAll(async () => {
		await closeDatabase();
	});

	it("serves health, guards RPC and manages profiles and sessions", async () => {
		const anonymous = agent();
		const health = await anonymous.json<{ readonly status: string; readonly database: string }>(
			"/health",
		);

		expect(health.status).toBe(200);
		expect(health.body).toMatchObject({ status: "ok", database: "up" });
		expect(health.headers.get("x-request-id")).toBeTruthy();

		const session = await anonymous.rpcData<GetSessionOutput>("auth/getSession");
		expect(session.session).toBeNull();

		const unauthorized = await anonymous.rpc("users/getProfile");
		expect(unauthorized.status).toBe(401);
		expect(errorOf(unauthorized.body.json)).toMatchObject({
			code: "UNAUTHORIZED",
			status: 401,
		});

		const blockedOrigin = await anonymous.json<{ readonly error: string }>("/rpc/auth/getSession", {
			method: "POST",
			headers: { origin: "https://evil.example" },
			body: JSON.stringify({ json: {} }),
		});
		expect(blockedOrigin.status).toBe(403);
		expect(blockedOrigin.body).toMatchObject({ error: "INVALID_ORIGIN" });

		const alice = agent();
		const aliceEmail = emailFor(runId, "alice");
		const aliceUser = await alice.signUp("Alice Integration", aliceEmail);

		const profile = await alice.rpcData<UserProfile>("users/getProfile");
		expect(profile).toMatchObject({
			id: aliceUser.id,
			email: aliceEmail,
			role: "USER",
			twoFactorEnabled: false,
		});
		expect(profile.profile.displayName).toBe("Alice Integration");
		expect(profile.profile.username).toBeTruthy();

		const username = usernameFor(runId, "alice");
		const updated = await alice.rpcData<UserProfile>("users/updateProfile", {
			displayName: "Alice Updated",
			username,
			bio: "Integration profile",
		});
		expect(updated.name).toBe("Alice Updated");
		expect(updated.profile).toMatchObject({
			displayName: "Alice Updated",
			username,
			bio: "Integration profile",
		});

		const refreshedSession = await alice.rpcData<GetSessionOutput>("auth/getSession");
		expect(refreshedSession.session?.user.name).toBe("Alice Updated");

		const bob = agent();
		await bob.signUp("Bob Integration", emailFor(runId, "bob"));
		const conflict = await bob.rpc("users/updateProfile", { username });
		expect(conflict.status).toBe(409);
		expect(errorOf(conflict.body.json)).toMatchObject({ code: "CONFLICT", status: 409 });

		await alice.signOut();
		const signedOut = await alice.rpcData<GetSessionOutput>("auth/getSession");
		expect(signedOut.session).toBeNull();

		await alice.signIn(aliceEmail);
		const signedIn = await alice.rpcData<GetSessionOutput>("auth/getSession");
		expect(signedIn.session?.user.email).toBe(aliceEmail);

		const invalidLogin = await agent().json("/api/auth/sign-in/email", {
			method: "POST",
			body: JSON.stringify({ email: aliceEmail, password: "WrongPassword123!" }),
		});
		expect(invalidLogin.status).toBe(401);
	});

	it("creates, edits, publishes, searches and cancels a room", async () => {
		const anonymous = agent();
		const unauthorizedCreate = await anonymous.rpc("rooms/create", roomInput("Unauthorized"));
		expect(unauthorizedCreate.status).toBe(401);

		const host = agent();
		await host.signUp("Room Host", emailFor(runId, "crud-host"));

		const created = await host.rpcData<Room>("rooms/create", roomInput("CRUD"));
		expect(created).toMatchObject({
			status: "DRAFT",
			isHost: true,
			teamSize: 1,
			roundCount: 1,
		});
		expect(created.publishedAt).toBeNull();

		const mine = await host.rpcData<ListRoomsResult>("rooms/list", { scope: "mine" });
		expect(mine.items.map((room) => room.id)).toContain(created.id);

		const hiddenDraft = await anonymous.rpc("rooms/get", { id: created.id });
		expect(hiddenDraft.status).toBe(404);

		const publicDraftSearch = await anonymous.rpcData<ListRoomsResult>("rooms/list", {
			scope: "public",
			search: created.title,
		});
		expect(publicDraftSearch.items).toHaveLength(0);

		const updatedTitle = `${created.title} updated`;
		const updated = await host.rpcData<Room>("rooms/update", {
			id: created.id,
			title: updatedTitle,
			motion: "This house would update a debate room over HTTP",
		});
		expect(updated.title).toBe(updatedTitle);

		const published = await host.rpcData<Room>("rooms/publish", { id: created.id });
		expect(published.status).toBe("PUBLISHED");
		expect(published.publishedAt).not.toBeNull();

		const search = await anonymous.rpcData<ListRoomsResult>("rooms/list", {
			scope: "public",
			search: updatedTitle,
		});
		expect(search.items.map((room) => room.id)).toContain(created.id);

		const detail = await anonymous.rpcData<RoomDetail>("rooms/get", { id: created.id });
		expect(detail).toMatchObject({
			status: "PUBLISHED",
			viewerRole: null,
			participantCount: 0,
			spectatorCount: 0,
		});

		const editAfterPublish = await host.rpc("rooms/update", {
			id: created.id,
			title: "Cannot edit after publish",
		});
		expect(editAfterPublish.status).toBe(409);

		const cancelled = await host.rpcData<Room>("rooms/cancel", { id: created.id });
		expect(cancelled.status).toBe("CANCELLED");
		expect(cancelled.cancelledAt).not.toBeNull();

		const afterCancel = await anonymous.rpcData<ListRoomsResult>("rooms/list", {
			scope: "public",
			search: updatedTitle,
		});
		expect(afterCancel.items).toHaveLength(0);
	});

	it("runs the full membership, assignment, execution, voting and results flow", async () => {
		const host = agent();
		const pro = agent();
		const contra = agent();
		const spectator = agent();
		const late = agent();

		await host.signUp("Lifecycle Host", emailFor(runId, "host"));
		const proUser = await pro.signUp("Pro Speaker", emailFor(runId, "pro"));
		const contraUser = await contra.signUp("Contra Speaker", emailFor(runId, "contra"));
		const spectatorUser = await spectator.signUp("Spectator", emailFor(runId, "spectator"));
		const lateUser = await late.signUp("Late Joiner", emailFor(runId, "late"));

		const created = await host.rpcData<Room>("rooms/create", roomInput("Lifecycle"));
		const roomId = created.id;

		await host.rpcData<Room>("rooms/publish", { id: roomId });

		const hostJoin = await host.rpc("memberships/join", { roomId, role: "PARTICIPANT" });
		expect(hostJoin.status).toBe(409);

		await pro.rpcData("memberships/join", { roomId, role: "PARTICIPANT" });
		await contra.rpcData("memberships/join", { roomId, role: "PARTICIPANT" });
		await spectator.rpcData("memberships/join", { roomId, role: "SPECTATOR" });

		const rooms = await host.rpcData<RoomDetail>("rooms/get", { id: roomId });
		expect(rooms).toMatchObject({
			status: "PUBLISHED",
			viewerRole: "HOST",
			participantCount: 2,
			spectatorCount: 1,
			teamCounts: { pro: 0, contra: 0 },
		});

		const roster = await agent().rpcData<ListMembersResult>("memberships/list", { roomId });
		expect(roster.items).toHaveLength(3);
		expect(new Set(roster.items.map((member) => member.userId))).toEqual(
			new Set([proUser.id, contraUser.id, spectatorUser.id]),
		);

		const assigned = await host.rpcData<AssignmentSummary>("assignments/autoAssign", { roomId });
		expect(assigned).toMatchObject({ assigned: 2, proCount: 1, contraCount: 1 });

		const proMembership = roster.items.find((member) => member.userId === proUser.id);

		if (!proMembership) {
			throw new Error("PRO membership was not found");
		}

		const cleared = await host.rpcData<{ readonly team: string | null }>("assignments/setTeam", {
			roomId,
			membershipId: proMembership.id,
			team: null,
		});
		expect(cleared.team).toBeNull();

		const reassigned = await host.rpcData<{ readonly team: string | null }>("assignments/setTeam", {
			roomId,
			membershipId: proMembership.id,
			team: "PRO",
		});
		expect(reassigned.team).toBe("PRO");

		const finalized = await host.rpcData<AssignmentSummary>("assignments/finalize", { roomId });
		expect(finalized.finalizedAt).not.toBeNull();
		expect(finalized).toMatchObject({ proCount: 1, contraCount: 1 });

		const lateJoin = await late.rpc("memberships/join", { roomId, role: "PARTICIPANT" });
		expect(lateJoin.status).toBe(409);
		expect(errorOf(lateJoin.body.json)).toMatchObject({ code: "CONFLICT", status: 409 });
		expect(lateUser.id).toBeTruthy();

		const rounds = await host.rpcData<ListRoundsResult>("rounds/start", { roomId });
		const round = first(rounds.items, "round");
		expect(round.status).toBe("OPEN");

		const inProgress = await host.rpcData<RoomDetail>("rooms/get", { id: roomId });
		expect(inProgress.status).toBe("IN_PROGRESS");

		await pro.rpcData("submissions/create", {
			roundId: round.id,
			content: submissionContent("PRO"),
		});
		await contra.rpcData("submissions/create", {
			roundId: round.id,
			content: submissionContent("CONTRA"),
		});

		const duplicateSubmission = await pro.rpc("submissions/create", {
			roundId: round.id,
			content: submissionContent("PRO duplicate"),
		});
		expect(duplicateSubmission.status).toBe(409);

		const hiddenSubmissions = await spectator.rpcData<{ readonly items: readonly unknown[] }>(
			"submissions/list",
			{ roundId: round.id },
		);
		expect(hiddenSubmissions.items).toHaveLength(0);

		const hostSubmissions = await host.rpcData<{ readonly items: readonly unknown[] }>(
			"submissions/list",
			{ roundId: round.id },
		);
		expect(hostSubmissions.items).toHaveLength(2);

		const votingRounds = await host.rpcData<ListRoundsResult>("rounds/advance", { roomId });
		expect(first(votingRounds.items, "voting round").status).toBe("VOTING");

		const hostVote = await host.rpcData<VoteSummary>("votes/cast", {
			roundId: round.id,
			team: "PRO",
		});
		expect(hostVote).toMatchObject({ revealed: true, proCount: 1, totalCount: 1 });

		const duplicateVote = await host.rpc("votes/cast", { roundId: round.id, team: "PRO" });
		expect(duplicateVote.status).toBe(409);

		const participantVote = await pro.rpc("votes/cast", { roundId: round.id, team: "PRO" });
		expect(participantVote.status).toBe(403);

		const spectatorVote = await spectator.rpcData<VoteSummary>("votes/cast", {
			roundId: round.id,
			team: "PRO",
		});
		expect(spectatorVote).toMatchObject({
			revealed: false,
			proCount: 0,
			totalCount: 0,
			viewerVote: "PRO",
		});

		const hostSummary = await host.rpcData<VoteSummary>("votes/summary", { roundId: round.id });
		expect(hostSummary).toMatchObject({
			revealed: true,
			proCount: 2,
			contraCount: 0,
			totalCount: 2,
		});

		const closedRounds = await host.rpcData<ListRoundsResult>("rounds/advance", { roomId });
		expect(first(closedRounds.items, "closed round").status).toBe("CLOSED");

		const revealed = await spectator.rpcData<VoteSummary>("votes/summary", { roundId: round.id });
		expect(revealed).toMatchObject({
			revealed: true,
			proCount: 2,
			contraCount: 0,
			totalCount: 2,
			viewerVote: "PRO",
		});

		const closedSubmissions = await spectator.rpcData<{ readonly items: readonly unknown[] }>(
			"submissions/list",
			{ roundId: round.id },
		);
		expect(closedSubmissions.items).toHaveLength(2);

		const roundResult = await host.rpcData<RoundResult>("results/finalizeRound", {
			roundId: round.id,
		});
		expect(roundResult).toMatchObject({
			roundNumber: 1,
			outcome: "PRO",
			proCount: 2,
			contraCount: 0,
			totalVotes: 2,
		});

		const roomResult = await host.rpcData<RoomResult>("results/finalizeRoom", { roomId });
		expect(roomResult).toMatchObject({
			roomId,
			outcome: "PRO",
			proWins: 1,
			contraWins: 0,
			draws: 0,
		});

		const duplicateFinalize = await host.rpc("results/finalizeRoom", { roomId });
		expect(duplicateFinalize.status).toBe(409);

		const results = await host.rpcData<RoomResults>("results/getRoom", { roomId });
		expect(results.roomResult?.outcome).toBe("PRO");
		expect(results.rounds).toHaveLength(1);
		expect(results.rounds[0]?.result?.outcome).toBe("PRO");

		const completed = await host.rpcData<RoomDetail>("rooms/get", { id: roomId });
		expect(completed.status).toBe("COMPLETED");

		const notifications = await host.rpcData<ListNotificationsResult>("notifications/list", {
			limit: 50,
		});
		expect(notifications.unreadCount).toBeGreaterThan(0);
		expect(notifications.items.length).toBeGreaterThan(0);

		const notification = first(notifications.items, "notification");
		const read = await host.rpcData<Notification>("notifications/markRead", {
			id: notification.id,
		});
		expect(read.readAt).not.toBeNull();

		await host.rpcData<{ readonly updated: number }>("notifications/markAllRead");
		const afterRead = await host.rpcData<ListNotificationsResult>("notifications/list", {
			limit: 1,
		});
		expect(afterRead.unreadCount).toBe(0);
	});

	it("supports reports, role separation, MFA-gated moderation and the audit log", async () => {
		const host = agent();
		const reporter = agent();
		const moderator = agent();
		const admin = agent();

		await host.signUp("Moderation Host", emailFor(runId, "mod-host"));
		await reporter.signUp("Report Reporter", emailFor(runId, "reporter"));
		const moderatorUser = await moderator.signUp("Moderator User", emailFor(runId, "moderator"));
		const adminUser = await admin.signUp("Admin User", emailFor(runId, "admin"));

		const room = await host.rpcData<Room>("rooms/create", roomInput("Moderation"));
		await host.rpcData<Room>("rooms/publish", { id: room.id });

		const report = await reporter.rpcData<Report>("reports/create", {
			roomId: room.id,
			category: "SPAM",
			details: "This room contains repeated spam content that needs moderator review.",
		});
		expect(report).toMatchObject({
			room: { id: room.id },
			category: "SPAM",
			status: "PENDING",
		});

		const hostList = await host.rpc("reports/list", {});
		expect(hostList.status).toBe(403);

		await execute("update users set role = 'MODERATOR', two_factor_enabled = true where id = $1", [
			moderatorUser.id,
		]);

		const moderatorList = await moderator.rpcData<ListReportsResult>("reports/list", {});
		expect(moderatorList.items.map((item) => item.id)).toContain(report.id);

		const moderatorResolve = await moderator.rpc("reports/resolve", {
			reportId: report.id,
			status: "ACTIONED",
		});
		expect(moderatorResolve.status).toBe(403);

		await execute("update users set role = 'ADMIN', two_factor_enabled = true where id = $1", [
			adminUser.id,
		]);

		const adminList = await admin.rpcData<ListReportsResult>("reports/list", {
			status: "PENDING",
		});
		expect(adminList.items.map((item) => item.id)).toContain(report.id);

		const resolved = await admin.rpcData<Report>("reports/resolve", {
			reportId: report.id,
			status: "ACTIONED",
			note: "Confirmed spam and removed the content.",
		});
		expect(resolved).toMatchObject({
			id: report.id,
			status: "ACTIONED",
			resolutionNote: "Confirmed spam and removed the content.",
		});
		expect(resolved.resolvedAt).not.toBeNull();

		const resolvedList = await admin.rpcData<ListReportsResult>("reports/list", {
			status: "ACTIONED",
		});
		expect(resolvedList.items.map((item) => item.id)).toContain(report.id);

		const reporterNotifications = await reporter.rpcData<ListNotificationsResult>(
			"notifications/list",
			{ limit: 50 },
		);
		expect(reporterNotifications.items.some((item) => item.type === "REPORT_RESOLVED")).toBe(true);

		const audit = await admin.rpcData<{
			readonly items: readonly { readonly action: string; readonly entityId: string | null }[];
		}>("audit/list", { limit: 100 });
		expect(
			audit.items.some(
				(event) => event.action === "report.resolve" && event.entityId === report.id,
			),
		).toBe(true);
	});

	it("exports the authenticated user's data and rejects anonymous exports", async () => {
		const user = agent();
		const email = emailFor(runId, "export");
		await user.signUp("Export User", email);

		const exported = await user.json<{
			readonly user: { readonly email: string };
			readonly profile: { readonly displayName: string | null };
			readonly memberships: readonly unknown[];
			readonly submissions: readonly unknown[];
			readonly votes: readonly unknown[];
			readonly reports: readonly unknown[];
			readonly notifications: readonly unknown[];
		}>("/api/me/export");

		expect(exported.status).toBe(200);
		expect(exported.body.user.email).toBe(email);
		expect(exported.body.profile).toBeDefined();
		expect(exported.body.memberships).toEqual([]);
		expect(exported.body.submissions).toEqual([]);
		expect(exported.body.votes).toEqual([]);
		expect(exported.body.reports).toEqual([]);
		expect(exported.body.notifications).toEqual([]);

		const anonymous = await agent().json("/api/me/export");
		expect(anonymous.status).toBe(401);
	});
});
