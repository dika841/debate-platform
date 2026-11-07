export const MEMBERSHIP_ROLE = {
	PARTICIPANT: "PARTICIPANT",
	SPECTATOR: "SPECTATOR",
} as const;

export type MembershipRole = (typeof MEMBERSHIP_ROLE)[keyof typeof MEMBERSHIP_ROLE];

export const VIEWER_ROLE = {
	HOST: "HOST",
	PARTICIPANT: "PARTICIPANT",
	SPECTATOR: "SPECTATOR",
} as const;

export type ViewerRole = (typeof VIEWER_ROLE)[keyof typeof VIEWER_ROLE];

export const TEAM_SIDE = {
	PRO: "PRO",
	CONTRA: "CONTRA",
} as const;

export type TeamSide = (typeof TEAM_SIDE)[keyof typeof TEAM_SIDE];

/** Both sides of the debate, capped at `teamSize` each. */
export const participantCapacity = (teamSize: number): number => teamSize * 2;
