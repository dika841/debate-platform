export const RESULTS = {
	title: "Results",
	description: "Round winners and the overall debate outcome.",
	finalizeRound: "Finalize round",
	finalizingRound: "Finalizing…",
	awaitingFinalization: "Awaiting finalization",
	pending: "Round still in progress",
	final: "Final",
	roundLine: (pro: number, contra: number, total: number) =>
		`PRO ${pro} · CONTRA ${contra} · ${total} votes`,
	winner: (team: string) => `Winner: ${team}`,
	draw: "Draw",
	finalizeRoom: "Finalize debate",
	finalizingRoom: "Finalizing…",
	roomLine: (pro: number, contra: number, draws: number) =>
		`PRO ${pro} wins · CONTRA ${contra} wins · ${draws} draws`,
	completeHint: "Finalize every round result to complete the debate.",
	awaitingHost: "Waiting for the host to finalize results.",
} as const;
