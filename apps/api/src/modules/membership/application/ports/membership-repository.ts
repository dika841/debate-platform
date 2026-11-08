import type { MembershipRole, TeamSide } from "@app/shared";

export type MembershipUser = {
	readonly id: string;
	readonly displayName: string;
	readonly username: string | null;
	readonly avatarUrl: string | null;
};

export type MembershipRecord = {
	readonly id: string;
	readonly roomId: string;
	readonly userId: string;
	readonly role: MembershipRole;
	readonly team: TeamSide | null;
	readonly joinedAt: Date;
};

export type MembershipWithUser = {
	readonly membership: MembershipRecord;
	readonly user: MembershipUser;
};

export type NewMembership = {
	readonly id: string;
	readonly roomId: string;
	readonly userId: string;
	readonly role: MembershipRole;
	readonly team: TeamSide | null;
	readonly joinedAt: Date;
};

export type JoinMembershipCommand = NewMembership & {
	/** Participant slots available, or null for spectators. */
	readonly capacity: number | null;
};

export type JoinOutcome =
	| { readonly kind: "joined"; readonly membership: MembershipWithUser }
	| { readonly kind: "already_member"; readonly membership: MembershipWithUser }
	| { readonly kind: "role_conflict"; readonly membership: MembershipWithUser }
	| { readonly kind: "capacity_exceeded" };

export type MembershipListFilter = {
	readonly roomId: string;
	readonly role?: MembershipRole;
	readonly cursor?: string | null;
	readonly limit: number;
};

export type MembershipPage = {
	readonly items: readonly MembershipWithUser[];
	readonly nextCursor: string | null;
};

export interface MembershipRepository {
	join(command: JoinMembershipCommand): Promise<JoinOutcome>;
	leave(roomId: string, userId: string): Promise<boolean>;
	list(filter: MembershipListFilter): Promise<MembershipPage>;
	findById(id: string): Promise<MembershipWithUser | null>;
	findByRoomAndUser(roomId: string, userId: string): Promise<MembershipWithUser | null>;
	listParticipants(roomId: string): Promise<readonly MembershipWithUser[]>;
	listUserIds(roomId: string): Promise<readonly string[]>;
	updateTeam(id: string, team: TeamSide | null): Promise<MembershipWithUser>;
	assignTeams(assignments: readonly TeamAssignment[]): Promise<void>;
}

export type TeamAssignment = {
	readonly membershipId: string;
	readonly team: TeamSide | null;
};
