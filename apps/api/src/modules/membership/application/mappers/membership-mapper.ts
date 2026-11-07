import type { Membership } from "@app/api-contract";
import type { MembershipWithUser } from "../ports/membership-repository.ts";

export const toMembershipDto = ({ membership, user }: MembershipWithUser): Membership => ({
	id: membership.id,
	roomId: membership.roomId,
	userId: membership.userId,
	role: membership.role,
	team: membership.team,
	user: {
		id: user.id,
		displayName: user.displayName,
		username: user.username,
		avatarUrl: user.avatarUrl,
	},
	joinedAt: membership.joinedAt.toISOString(),
});
