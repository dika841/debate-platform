import type { RoomDetail } from "@app/api-contract";
import { Badge } from "@app/components/ui/badge";
import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@app/components/ui/card";
import { RESULTS } from "@app/messages";
import { useFinalizeRoom, useFinalizeRound, useRoomResults } from "@/libs/api/queries.ts";

const outcomeVariant = (outcome: "PRO" | "CONTRA" | "DRAW") => {
	if (outcome === "PRO") {
		return "default" as const;
	}
	if (outcome === "CONTRA") {
		return "secondary" as const;
	}
	return "outline" as const;
};

const outcomeLabel = (outcome: "PRO" | "CONTRA" | "DRAW") =>
	outcome === "DRAW" ? RESULTS.draw : outcome;

export const DebateResults = ({ room }: { room: RoomDetail }) => {
	const active = room.status === "IN_PROGRESS" || room.status === "COMPLETED";
	const resultsQuery = useRoomResults(room.id, {
		enabled: active,
		refetchInterval: room.status === "IN_PROGRESS" ? 30_000 : false,
	});
	const finalizeRound = useFinalizeRound();
	const finalizeRoom = useFinalizeRoom();

	if (!active) {
		return null;
	}

	if (resultsQuery.isPending) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{RESULTS.title}</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">Loading results…</p>
				</CardContent>
			</Card>
		);
	}

	if (resultsQuery.isError || !resultsQuery.data) {
		return null;
	}

	const { rounds, roomResult } = resultsQuery.data;
	const isHost = room.viewerRole === "HOST";
	const allClosed = rounds.length > 0 && rounds.every((round) => round.status === "CLOSED");
	const allFinalized = rounds.length > 0 && rounds.every((round) => round.result !== null);
	const actionError = finalizeRound.error?.message ?? finalizeRoom.error?.message ?? null;

	return (
		<Card>
			<CardHeader>
				<CardTitle>{RESULTS.title}</CardTitle>
				<CardDescription>{RESULTS.description}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4 text-sm">
				{actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}

				<div className="space-y-2">
					{rounds.map((round) => (
						<div key={round.roundId} className="space-y-2 rounded-md border border-border/70 p-3">
							<div className="flex flex-wrap items-center justify-between gap-2">
								<div className="flex items-center gap-2">
									<span className="font-medium">{`Round ${round.roundNumber}`}</span>
									<Badge variant={round.status === "CLOSED" ? "secondary" : "outline"}>
										{round.status}
									</Badge>
								</div>

								{round.result ? (
									<div className="flex items-center gap-2">
										<Badge variant={outcomeVariant(round.result.outcome)}>
											{outcomeLabel(round.result.outcome)}
										</Badge>
										<span className="text-xs text-muted-foreground">
											{RESULTS.roundLine(
												round.result.proCount,
												round.result.contraCount,
												round.result.totalVotes,
											)}
										</span>
									</div>
								) : round.status === "CLOSED" ? (
									<div className="flex items-center gap-2">
										<span className="text-xs text-muted-foreground">
											{RESULTS.awaitingFinalization}
										</span>
										{isHost ? (
											<Button
												size="sm"
												variant="outline"
												disabled={finalizeRound.isPending}
												onClick={() =>
													void finalizeRound.mutate({
														roundId: round.roundId,
													})
												}
											>
												{finalizeRound.isPending ? RESULTS.finalizingRound : RESULTS.finalizeRound}
											</Button>
										) : (
											<span className="text-xs text-muted-foreground">{RESULTS.awaitingHost}</span>
										)}
									</div>
								) : (
									<span className="text-xs text-muted-foreground">{RESULTS.pending}</span>
								)}
							</div>
						</div>
					))}
				</div>

				{roomResult ? (
					<div className="space-y-2 rounded-md border border-foreground/30 bg-muted/40 p-3">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<span className="font-semibold">{RESULTS.final}</span>
							<Badge variant={outcomeVariant(roomResult.outcome)}>
								{roomResult.outcome === "DRAW" ? RESULTS.draw : RESULTS.winner(roomResult.outcome)}
							</Badge>
						</div>
						<p className="text-xs text-muted-foreground">
							{RESULTS.roomLine(roomResult.proWins, roomResult.contraWins, roomResult.draws)}
						</p>
					</div>
				) : isHost && allClosed && allFinalized ? (
					<Button
						disabled={finalizeRoom.isPending}
						onClick={() => void finalizeRoom.mutate({ roomId: room.id })}
					>
						{finalizeRoom.isPending ? RESULTS.finalizingRoom : RESULTS.finalizeRoom}
					</Button>
				) : (
					<p className="text-xs text-muted-foreground">{RESULTS.completeHint}</p>
				)}
			</CardContent>
		</Card>
	);
};
