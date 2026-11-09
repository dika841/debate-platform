import type { RoomDetail } from "@app/api-contract";
import { Badge } from "@app/components/ui/badge";
import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@app/components/ui/card";
import { EXECUTION, VOTE } from "@app/messages";
import { formatDateTime } from "@/libs/format.ts";
import {
	useAdvanceRound,
	useCastVote,
	useRounds,
	useStartDebate,
	useSubmissions,
	useVoteSummary,
} from "@/libs/api/queries.ts";
import { useSession } from "@/libs/auth/use-session.ts";
import { SubmissionForm } from "@/routes/_public/rooms/_components/submission-form.tsx";

const statusVariant = (status: "PENDING" | "OPEN" | "VOTING" | "CLOSED") => {
	if (status === "OPEN") {
		return "default" as const;
	}
	if (status === "VOTING" || status === "CLOSED") {
		return "secondary" as const;
	}
	return "outline" as const;
};

type DebateRoundsProps = {
	readonly room: RoomDetail;
	readonly viewerTeam: "PRO" | "CONTRA" | null;
};

export const DebateRounds = ({ room, viewerTeam }: DebateRoundsProps) => {
	const session = useSession();
	const active = room.status !== "DRAFT" && room.status !== "CANCELLED";
	const live = room.status === "IN_PROGRESS";
	const roundsQuery = useRounds(room.id, {
		enabled: active,
		refetchInterval: live ? 15_000 : false,
	});
	const rounds = roundsQuery.data?.items ?? [];
	const currentRound =
		rounds.find((round) => round.status === "OPEN") ??
		rounds.find((round) => round.status === "VOTING") ??
		rounds.find((round) => round.status === "PENDING") ??
		rounds.at(-1);
	const submissionsQuery = useSubmissions(currentRound?.id ?? "", {
		enabled: active,
		refetchInterval: live ? 30_000 : false,
	});
	const votesQuery = useVoteSummary(currentRound?.id ?? "", {
		enabled: active,
		refetchInterval: live ? 15_000 : false,
	});
	const start = useStartDebate();
	const advance = useAdvanceRound();
	const castVote = useCastVote();

	const userId = session?.userId ?? null;
	const authenticated = Boolean(session);
	const ownSubmission =
		submissionsQuery.data?.items.find((item) => item.authorId === userId) ?? null;
	const now = Date.now();
	const deadlinePassed = currentRound?.submissionDeadline
		? new Date(currentRound.submissionDeadline).getTime() <= now
		: false;
	const allClosed = rounds.length > 0 && rounds.every((round) => round.status === "CLOSED");
	const canAdvance = currentRound
		? currentRound.status === "VOTING" ||
			currentRound.status === "PENDING" ||
			(currentRound.status === "OPEN" &&
				(deadlinePassed || currentRound.submissionCount >= room.participantCount))
		: false;
	const canSubmit =
		authenticated &&
		room.viewerRole === "PARTICIPANT" &&
		viewerTeam !== null &&
		currentRound?.status === "OPEN" &&
		!deadlinePassed &&
		ownSubmission === null;
	const canVote =
		authenticated &&
		currentRound?.status === "VOTING" &&
		(room.viewerRole === "HOST" ||
			(room.viewerRole === "SPECTATOR" && room.spectatorVotingEnabled)) &&
		!votesQuery.data?.viewerVote;
	const advanceLabel =
		currentRound?.status === "OPEN"
			? EXECUTION.startVoting
			: currentRound?.status === "VOTING"
				? EXECUTION.closeVoting
				: EXECUTION.advance;
	const advancePendingLabel =
		currentRound?.status === "OPEN"
			? EXECUTION.startingVoting
			: currentRound?.status === "VOTING"
				? EXECUTION.closingVoting
				: EXECUTION.advancing;

	const startable =
		room.viewerRole === "HOST" &&
		room.status === "PUBLISHED" &&
		room.assignmentFinalizedAt !== null &&
		rounds.length === 0;

	if (room.status === "DRAFT" || room.status === "CANCELLED") {
		return null;
	}

	if (startable) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{EXECUTION.title}</CardTitle>
					<CardDescription>{EXECUTION.description}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-3">
					<p className="text-sm text-muted-foreground">{EXECUTION.noRounds}</p>
					{start.error?.message ? (
						<p className="text-sm text-destructive">{start.error.message}</p>
					) : null}
					<Button disabled={start.isPending} onClick={() => void start.mutate({ roomId: room.id })}>
						{start.isPending ? EXECUTION.starting : EXECUTION.start}
					</Button>
				</CardContent>
			</Card>
		);
	}

	if (roundsQuery.isPending) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{EXECUTION.title}</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-muted-foreground">Loading rounds…</p>
				</CardContent>
			</Card>
		);
	}

	if (roundsQuery.isError) {
		return (
			<Card>
				<CardHeader>
					<CardTitle>{EXECUTION.title}</CardTitle>
				</CardHeader>
				<CardContent>
					<p className="text-sm text-destructive">{roundsQuery.error.message}</p>
				</CardContent>
			</Card>
		);
	}

	if (rounds.length === 0) {
		if (room.status === "PUBLISHED" && room.assignmentFinalizedAt !== null) {
			return (
				<Card>
					<CardHeader>
						<CardTitle>{EXECUTION.title}</CardTitle>
						<CardDescription>{EXECUTION.description}</CardDescription>
					</CardHeader>
					<CardContent>
						<p className="text-sm text-muted-foreground">{EXECUTION.waitingForHost}</p>
					</CardContent>
				</Card>
			);
		}

		return null;
	}

	const actionError = advance.error?.message ?? castVote.error?.message ?? null;

	return (
		<Card>
			<CardHeader>
				<div className="flex flex-wrap items-start justify-between gap-3">
					<div className="space-y-1">
						<CardTitle>{EXECUTION.title}</CardTitle>
						<CardDescription>{EXECUTION.description}</CardDescription>
					</div>
					{room.viewerRole === "HOST" && room.status === "IN_PROGRESS" && !allClosed ? (
						<Button
							size="sm"
							variant="outline"
							disabled={advance.isPending || !canAdvance}
							title={canAdvance ? undefined : EXECUTION.waitingForRound}
							onClick={() => void advance.mutate({ roomId: room.id })}
						>
							{advance.isPending ? advancePendingLabel : advanceLabel}
						</Button>
					) : null}
				</div>
			</CardHeader>
			<CardContent className="space-y-5">
				<div className="space-y-2">
					{rounds.map((round) => (
						<div
							key={round.id}
							className={
								round.id === currentRound?.id
									? "flex flex-wrap items-center justify-between gap-2 rounded-md border border-foreground/30 bg-muted/40 px-3 py-2 text-sm"
									: "flex flex-wrap items-center justify-between gap-2 rounded-md border border-border/60 px-3 py-2 text-sm"
							}
						>
							<div className="flex items-center gap-2">
								<span className="font-medium">{EXECUTION.round(round.roundNumber)}</span>
								<Badge variant={statusVariant(round.status)}>
									{EXECUTION.status[round.status]}
								</Badge>
							</div>
							<div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
								<span>{EXECUTION.submissionCount(round.submissionCount)}</span>
								<span>
									{EXECUTION.deadline}:{" "}
									{round.submissionDeadline ? formatDateTime(round.submissionDeadline) : "—"}
								</span>
								{round.votingDeadline ? (
									<span>
										{EXECUTION.votingDeadline}: {formatDateTime(round.votingDeadline)}
									</span>
								) : null}
							</div>
						</div>
					))}
				</div>

				{actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}

				{currentRound ? (
					<div className="space-y-3 border-t border-border/60 pt-4">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<h3 className="text-sm font-semibold">
								{EXECUTION.round(currentRound.roundNumber)} · {EXECUTION.submissions}
							</h3>
							{currentRound.status === "OPEN" ? (
								<span className="text-xs text-muted-foreground">{EXECUTION.hiddenUntilClosed}</span>
							) : null}
						</div>

						{ownSubmission ? (
							<div className="rounded-md border border-border/70 p-3 text-sm">
								<div className="mb-2 flex items-center gap-2">
									<Badge variant="secondary">{ownSubmission.team}</Badge>
									<span className="font-medium">{EXECUTION.submitted}</span>
								</div>
								<p className="whitespace-pre-line text-muted-foreground">{ownSubmission.content}</p>
							</div>
						) : null}

						{canSubmit && currentRound ? <SubmissionForm roundId={currentRound.id} /> : null}

						{submissionsQuery.data && submissionsQuery.data.items.length > 0 ? (
							<ul className="space-y-3">
								{submissionsQuery.data.items.map((submission) => (
									<li
										key={submission.id}
										className="rounded-md border border-border/70 p-3 text-sm"
									>
										<div className="mb-2 flex flex-wrap items-center gap-2">
											<Badge variant={submission.team === "PRO" ? "default" : "secondary"}>
												{submission.team}
											</Badge>
											<span className="font-medium">{submission.author.displayName}</span>
											{submission.author.username ? (
												<span className="text-muted-foreground">@{submission.author.username}</span>
											) : null}
										</div>
										<p className="whitespace-pre-line text-muted-foreground">
											{submission.content}
										</p>
									</li>
								))}
							</ul>
						) : (
							<p className="text-sm text-muted-foreground">{EXECUTION.noSubmissions}</p>
						)}

						{currentRound.status === "VOTING" || currentRound.status === "CLOSED" ? (
							<div className="space-y-3 border-t border-border/60 pt-4">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<h3 className="text-sm font-semibold">{VOTE.title}</h3>
									<span className="text-xs text-muted-foreground">
										{currentRound.status === "CLOSED" ? VOTE.closed : VOTE.description}
									</span>
								</div>

								{votesQuery.data ? (
									<>
										{votesQuery.data.viewerVote ? (
											<Badge
												variant={votesQuery.data.viewerVote === "PRO" ? "default" : "secondary"}
											>
												{VOTE.yourVote}: {votesQuery.data.viewerVote}
											</Badge>
										) : null}

										{votesQuery.data.revealed ? (
											<>
												<div className="grid grid-cols-3 gap-2 text-sm">
													<div className="rounded-md border border-border/70 p-2">
														<p className="text-muted-foreground">PRO</p>
														<p className="text-lg font-semibold" data-testid="vote-pro">
															{votesQuery.data.proCount}
														</p>
													</div>
													<div className="rounded-md border border-border/70 p-2">
														<p className="text-muted-foreground">CONTRA</p>
														<p className="text-lg font-semibold" data-testid="vote-contra">
															{votesQuery.data.contraCount}
														</p>
													</div>
													<div className="rounded-md border border-border/70 p-2">
														<p className="text-muted-foreground">Total</p>
														<p className="text-lg font-semibold" data-testid="vote-total">
															{votesQuery.data.totalCount}
														</p>
													</div>
												</div>

												{currentRound.status === "CLOSED" ? (
													<p className="text-sm text-muted-foreground">
														{votesQuery.data.totalCount === 0
															? VOTE.noVotes
															: votesQuery.data.proCount === votesQuery.data.contraCount
																? VOTE.tie
																: VOTE.win(
																		votesQuery.data.proCount > votesQuery.data.contraCount
																			? "PRO"
																			: "CONTRA",
																	)}
													</p>
												) : null}
											</>
										) : (
											<p className="text-sm text-muted-foreground">{VOTE.hidden}</p>
										)}

										{canVote ? (
											<div className="flex flex-wrap gap-2">
												<Button
													size="sm"
													disabled={castVote.isPending}
													onClick={() =>
														void castVote.mutate({
															roundId: currentRound.id,
															team: "PRO",
														})
													}
												>
													{castVote.isPending ? VOTE.voting : VOTE.votePro}
												</Button>
												<Button
													size="sm"
													variant="outline"
													disabled={castVote.isPending}
													onClick={() =>
														void castVote.mutate({
															roundId: currentRound.id,
															team: "CONTRA",
														})
													}
												>
													{castVote.isPending ? VOTE.voting : VOTE.voteContra}
												</Button>
											</div>
										) : null}

										{currentRound.status === "VOTING" &&
										!canVote &&
										!votesQuery.data.viewerVote &&
										room.viewerRole === "PARTICIPANT" ? (
											<p className="text-sm text-muted-foreground">{VOTE.notEligible}</p>
										) : null}
									</>
								) : null}
							</div>
						) : currentRound.status === "OPEN" ? (
							<p className="border-t border-border/60 pt-4 text-sm text-muted-foreground">
								{VOTE.opensAfterSubmissions}
							</p>
						) : null}
					</div>
				) : null}
			</CardContent>
		</Card>
	);
};
