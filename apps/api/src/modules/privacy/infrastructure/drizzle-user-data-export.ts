import type { Database } from "@app/database";
import {
	contentReports,
	debateRooms,
	notifications,
	roomMemberships,
	roundSubmissions,
	roundVotes,
	userProfiles,
	users,
} from "@app/database/schema";
import { desc, eq } from "drizzle-orm";

const iso = (value: Date | null): string | null => value?.toISOString() ?? null;

export const exportUserData = async (db: Database, userId: string) => {
	const [user] = await db
		.select({
			id: users.id,
			email: users.email,
			name: users.name,
			image: users.image,
			role: users.role,
			createdAt: users.createdAt,
			updatedAt: users.updatedAt,
			username: userProfiles.username,
			displayName: userProfiles.displayName,
			avatarUrl: userProfiles.avatarUrl,
			bio: userProfiles.bio,
		})
		.from(users)
		.leftJoin(userProfiles, eq(userProfiles.userId, users.id))
		.where(eq(users.id, userId))
		.limit(1);

	if (!user) {
		return null;
	}

	const [hostedRooms, memberships, submissions, votes, reports, userNotifications] =
		await Promise.all([
			db
				.select({
					id: debateRooms.id,
					title: debateRooms.title,
					status: debateRooms.status,
					createdAt: debateRooms.createdAt,
				})
				.from(debateRooms)
				.where(eq(debateRooms.hostId, userId))
				.orderBy(desc(debateRooms.createdAt)),
			db
				.select({
					roomId: roomMemberships.roomId,
					title: debateRooms.title,
					role: roomMemberships.role,
					team: roomMemberships.team,
					joinedAt: roomMemberships.joinedAt,
				})
				.from(roomMemberships)
				.innerJoin(debateRooms, eq(roomMemberships.roomId, debateRooms.id))
				.where(eq(roomMemberships.userId, userId))
				.orderBy(desc(roomMemberships.joinedAt)),
			db
				.select({
					id: roundSubmissions.id,
					roomId: roundSubmissions.roomId,
					roundId: roundSubmissions.roundId,
					team: roundSubmissions.team,
					content: roundSubmissions.content,
					submittedAt: roundSubmissions.submittedAt,
				})
				.from(roundSubmissions)
				.where(eq(roundSubmissions.authorId, userId))
				.orderBy(desc(roundSubmissions.submittedAt)),
			db
				.select({
					roundId: roundVotes.roundId,
					roomId: roundVotes.roomId,
					team: roundVotes.team,
					castAt: roundVotes.castAt,
				})
				.from(roundVotes)
				.where(eq(roundVotes.voterId, userId))
				.orderBy(desc(roundVotes.castAt)),
			db
				.select({
					id: contentReports.id,
					roomId: contentReports.roomId,
					submissionId: contentReports.submissionId,
					category: contentReports.category,
					details: contentReports.details,
					status: contentReports.status,
					resolutionNote: contentReports.resolutionNote,
					createdAt: contentReports.createdAt,
					resolvedAt: contentReports.resolvedAt,
				})
				.from(contentReports)
				.where(eq(contentReports.reporterId, userId))
				.orderBy(desc(contentReports.createdAt)),
			db
				.select({
					type: notifications.type,
					title: notifications.title,
					body: notifications.body,
					roomId: notifications.roomId,
					roundId: notifications.roundId,
					readAt: notifications.readAt,
					createdAt: notifications.createdAt,
				})
				.from(notifications)
				.where(eq(notifications.userId, userId))
				.orderBy(desc(notifications.createdAt)),
		]);

	return {
		exportedAt: new Date().toISOString(),
		user: {
			id: user.id,
			email: user.email,
			name: user.name,
			image: user.image,
			role: user.role,
			createdAt: user.createdAt.toISOString(),
			updatedAt: user.updatedAt.toISOString(),
		},
		profile: {
			username: user.username,
			displayName: user.displayName,
			avatarUrl: user.avatarUrl,
			bio: user.bio,
		},
		hostedRooms: hostedRooms.map((room) => ({
			...room,
			createdAt: room.createdAt.toISOString(),
		})),
		memberships: memberships.map((membership) => ({
			...membership,
			joinedAt: membership.joinedAt.toISOString(),
		})),
		submissions: submissions.map((submission) => ({
			...submission,
			submittedAt: submission.submittedAt.toISOString(),
		})),
		votes: votes.map((vote) => ({ ...vote, castAt: vote.castAt.toISOString() })),
		reports: reports.map((report) => ({
			...report,
			createdAt: report.createdAt.toISOString(),
			resolvedAt: iso(report.resolvedAt),
		})),
		notifications: userNotifications.map((notification) => ({
			...notification,
			readAt: iso(notification.readAt),
			createdAt: notification.createdAt.toISOString(),
		})),
	};
};
