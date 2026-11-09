export const MEMBERSHIP = {
	roster: "Participants & spectators",
	emptyRoster: "No one has joined yet.",
	participants: "Participants",
	spectators: "Spectators",
	capacity: (current: number, max: number) => `${current}/${max}`,
	joinAsParticipant: "Join as participant",
	joinAsSpectator: "Join as spectator",
	joining: "Joining…",
	leave: "Leave debate",
	leaving: "Leaving…",
	signInToJoin: "Sign in to join",
	full: "Participant slots are full",
	role: {
		HOST: "Host",
		PARTICIPANT: "Participant",
		SPECTATOR: "Spectator",
	},
} as const;
