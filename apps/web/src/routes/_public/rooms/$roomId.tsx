import { Badge } from "@app/components/ui/badge";
import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@app/components/ui/card";
import { MEMBERSHIP, ROOM, TEAM } from "@app/messages";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	useAutoAssignTeams,
	useCancelRoom,
	useFinalizeAssignments,
	useJoinRoom,
	useLeaveRoom,
	useMembers,
	usePublishRoom,
	useRoom,
	useSetTeam,
} from "@/libs/api/queries.ts";
import { useSession } from "@/libs/auth/use-session.ts";
import { RoomStatusBadge } from "@/routes/_components/room-status-badge.tsx";
import { DebateRounds } from "@/routes/_public/rooms/_components/debate-rounds.tsx";
import { DebateResults } from "@/routes/_public/rooms/_components/debate-results.tsx";
import { ReportForm } from "@/routes/_public/rooms/_components/report-form.tsx";
import { RoomDetailSkeleton } from "@/routes/_components/room-detail-skeleton.tsx";
import { formatDateTime } from "@/libs/format.ts";

export const Route = createFileRoute("/_public/rooms/$roomId")({
	component: RoomDetailPage,
});

function RoomDetailPage() {
	const { roomId } = Route.useParams();
	const room = useRoom(roomId, {
		refetchInterval: (query) => {
			const data = query.state.data as { status?: string } | undefined;
			return data?.status === "IN_PROGRESS" ? 15_000 : false;
		},
	});
	const live = room.data?.status === "IN_PROGRESS";
	const members = useMembers(roomId, { refetchInterval: live ? 30_000 : false });
	const session = useSession();
	const publish = usePublishRoom();
	const cancel = useCancelRoom();
	const join = useJoinRoom();
	const leave = useLeaveRoom();
	const autoAssign = useAutoAssignTeams();
	const setTeam = useSetTeam();
	const finalize = useFinalizeAssignments();

	if (room.isPending) {
		return <RoomDetailSkeleton />;
	}

	if (room.isError || !room.data) {
		return (
			<Card className="max-w-2xl">
				<CardHeader>
					<CardTitle>{ROOM.loadError}</CardTitle>
					<CardDescription>
						{room.error?.message ?? "This debate is not available."}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button variant="outline" asChild>
						<Link to="/">{ROOM.backToExplore}</Link>
					</Button>
				</CardContent>
			</Card>
		);
	}

	const current = room.data;
	const authenticated = Boolean(session);
	const sessionUserId = session?.userId ?? null;
	const isHost = current.viewerRole === "HOST";
	const isOpen = current.status === "PUBLISHED" || current.status === "IN_PROGRESS";
	const assignmentOpen = current.status === "PUBLISHED" && current.assignmentFinalizedAt === null;
	const joinsAllowed = isOpen && assignmentOpen;
	const participantCapacity = current.teamSize * 2;
	const participantSlotsFull = current.participantCount >= participantCapacity;
	const teamsReady =
		current.teamCounts.pro === current.teamSize && current.teamCounts.contra === current.teamSize;
	const viewerMembership =
		members.data?.items.find((member) => member.userId === sessionUserId) ?? null;
	const actionPending =
		publish.isPending ||
		cancel.isPending ||
		join.isPending ||
		leave.isPending ||
		autoAssign.isPending ||
		setTeam.isPending ||
		finalize.isPending;
	const actionError =
		publish.error?.message ??
		cancel.error?.message ??
		join.error?.message ??
		leave.error?.message ??
		autoAssign.error?.message ??
		setTeam.error?.message ??
		finalize.error?.message ??
		null;

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="space-y-3">
					<div className="flex flex-wrap items-center gap-3">
						<RoomStatusBadge status={current.status} />
						<span className="text-sm text-muted-foreground">
							{ROOM.host}: {current.host.displayName}
							{current.host.username ? ` (@${current.host.username})` : ""}
						</span>
						{viewerMembership?.team ? (
							<Badge variant={viewerMembership.team === "PRO" ? "default" : "secondary"}>
								{TEAM.yourTeam}: {viewerMembership.team}
							</Badge>
						) : null}
					</div>
					<h1 className="max-w-3xl text-3xl font-semibold tracking-tight">{current.title}</h1>
					<p className="max-w-3xl text-lg text-muted-foreground">{current.motion}</p>
				</div>

				<div className="flex flex-wrap gap-2">
					<Button variant="outline" asChild>
						<Link to="/">{ROOM.backToExplore}</Link>
					</Button>

					{isHost && current.status === "DRAFT" ? (
						<Button variant="outline" asChild>
							<Link to="/rooms/$roomId/edit" params={{ roomId: current.id }}>
								{ROOM.edit}
							</Link>
						</Button>
					) : null}

					{isHost && current.status === "DRAFT" ? (
						<Button
							disabled={actionPending}
							onClick={() => void publish.mutate({ id: current.id })}
						>
							{publish.isPending ? ROOM.publishing : ROOM.publish}
						</Button>
					) : null}

					{isHost && (current.status === "DRAFT" || current.status === "PUBLISHED") ? (
						<Button
							variant="destructive"
							disabled={actionPending}
							onClick={() => void cancel.mutate({ id: current.id })}
						>
							{cancel.isPending ? ROOM.cancelling : ROOM.cancel}
						</Button>
					) : null}

					{current.viewerRole === null && joinsAllowed && authenticated ? (
						<>
							<Button
								disabled={actionPending || participantSlotsFull}
								title={participantSlotsFull ? MEMBERSHIP.full : undefined}
								onClick={() => void join.mutate({ roomId: current.id, role: "PARTICIPANT" })}
							>
								{join.isPending && join.variables?.role === "PARTICIPANT"
									? MEMBERSHIP.joining
									: MEMBERSHIP.joinAsParticipant}
							</Button>
							<Button
								variant="outline"
								disabled={actionPending}
								onClick={() => void join.mutate({ roomId: current.id, role: "SPECTATOR" })}
							>
								{join.isPending && join.variables?.role === "SPECTATOR"
									? MEMBERSHIP.joining
									: MEMBERSHIP.joinAsSpectator}
							</Button>
						</>
					) : null}

					{current.viewerRole === null && isOpen && !authenticated ? (
						<Button asChild>
							<Link to="/login" search={{ redirect: `/rooms/${current.id}` }}>
								{MEMBERSHIP.signInToJoin}
							</Link>
						</Button>
					) : null}

					{(current.viewerRole === "PARTICIPANT" || current.viewerRole === "SPECTATOR") &&
					assignmentOpen ? (
						<Button
							variant="outline"
							disabled={actionPending}
							onClick={() => void leave.mutate({ roomId: current.id })}
						>
							{leave.isPending ? MEMBERSHIP.leaving : MEMBERSHIP.leave}
						</Button>
					) : null}
				</div>
			</div>

			{actionError ? <p className="text-sm text-destructive">{actionError}</p> : null}

			<div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
				<div className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle>{ROOM.motion}</CardTitle>
							<CardDescription>
								{ROOM.formatValue(current.teamSize, current.roundCount)}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 text-sm">
							<p className="whitespace-pre-line">
								{current.description ?? "No additional description was provided."}
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>{ROOM.rules}</CardTitle>
						</CardHeader>
						<CardContent className="grid gap-3 text-sm sm:grid-cols-2">
							<div className="flex items-center justify-between gap-3">
								<span className="text-muted-foreground">{ROOM.submissionWindow}</span>
								<span>{current.submissionDurationMinutes} min</span>
							</div>
							<div className="flex items-center justify-between gap-3">
								<span className="text-muted-foreground">{ROOM.votingWindow}</span>
								<span>{current.votingDurationMinutes} min</span>
							</div>
							<div className="flex items-center justify-between gap-3">
								<span className="text-muted-foreground">{ROOM.spectatorVoting}</span>
								<Badge variant="secondary">
									{current.spectatorVotingEnabled ? ROOM.enabled : ROOM.disabled}
								</Badge>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle>{TEAM.title}</CardTitle>
							<CardDescription>
								{current.assignmentFinalizedAt
									? `${TEAM.finalized} · ${formatDateTime(current.assignmentFinalizedAt)}`
									: TEAM.description}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4 text-sm">
							<div className="grid gap-3 sm:grid-cols-2">
								<div className="rounded-sm border border-border/70 border-l-2 border-l-primary/60 p-3">
									<p className="text-muted-foreground">{TEAM.pro}</p>
									<p className="text-lg font-semibold">
										{MEMBERSHIP.capacity(current.teamCounts.pro, current.teamSize)}
									</p>
								</div>
								<div className="rounded-sm border border-border/70 border-l-2 border-l-chart-2/70 p-3">
									<p className="text-muted-foreground">{TEAM.contra}</p>
									<p className="text-lg font-semibold">
										{MEMBERSHIP.capacity(current.teamCounts.contra, current.teamSize)}
									</p>
								</div>
							</div>

							{isHost && assignmentOpen ? (
								<div className="flex flex-wrap items-center gap-2">
									<Button
										size="sm"
										variant="outline"
										disabled={actionPending}
										onClick={() => void autoAssign.mutate({ roomId: current.id })}
									>
										{autoAssign.isPending ? TEAM.autoAssigning : TEAM.autoAssign}
									</Button>
									<Button
										size="sm"
										disabled={actionPending || !teamsReady}
										title={teamsReady ? undefined : "Both teams must be full before finalizing"}
										onClick={() => void finalize.mutate({ roomId: current.id })}
									>
										{finalize.isPending ? TEAM.finalizing : TEAM.finalize}
									</Button>
								</div>
							) : null}

							{!isHost && assignmentOpen ? (
								<p className="text-muted-foreground">The host is still preparing the teams.</p>
							) : null}

							{current.assignmentFinalizedAt ? (
								<p className="text-muted-foreground">{TEAM.finalizedNotice}</p>
							) : null}
						</CardContent>
					</Card>

					<DebateRounds room={current} viewerTeam={viewerMembership?.team ?? null} />

					<DebateResults room={current} />

					<Card>
						<CardHeader>
							<CardTitle>{MEMBERSHIP.roster}</CardTitle>{" "}
							<CardDescription>
								{MEMBERSHIP.participants}:{" "}
								{MEMBERSHIP.capacity(current.participantCount, participantCapacity)} ·{" "}
								{MEMBERSHIP.spectators}: {current.spectatorCount}
							</CardDescription>
						</CardHeader>
						<CardContent>
							<ul className="space-y-2 text-sm">
								<li className="flex items-center justify-between gap-3">
									<span>
										{current.host.displayName}
										{current.host.username ? (
											<span className="text-muted-foreground"> @{current.host.username}</span>
										) : null}
									</span>
									<Badge variant="outline">{MEMBERSHIP.role.HOST}</Badge>
								</li>

								{members.data?.items.map((member) => (
									<li
										key={member.id}
										className="flex flex-wrap items-center justify-between gap-2 border-t border-border/60 pt-2"
									>
										<span>
											{member.user.displayName}
											{member.user.username ? (
												<span className="text-muted-foreground"> @{member.user.username}</span>
											) : null}
										</span>

										{isHost && assignmentOpen && member.role === "PARTICIPANT" ? (
											<div className="flex items-center gap-1">
												<Button
													size="sm"
													variant={member.team === "PRO" ? "default" : "outline"}
													disabled={setTeam.isPending}
													onClick={() =>
														void setTeam.mutate({
															roomId: current.id,
															membershipId: member.id,
															team: "PRO",
														})
													}
												>
													{TEAM.pro}
												</Button>
												<Button
													size="sm"
													variant={member.team === "CONTRA" ? "default" : "outline"}
													disabled={setTeam.isPending}
													onClick={() =>
														void setTeam.mutate({
															roomId: current.id,
															membershipId: member.id,
															team: "CONTRA",
														})
													}
												>
													{TEAM.contra}
												</Button>
												{member.team ? (
													<Button
														size="sm"
														variant="ghost"
														disabled={setTeam.isPending}
														onClick={() =>
															void setTeam.mutate({
																roomId: current.id,
																membershipId: member.id,
																team: null,
															})
														}
													>
														{TEAM.clear}
													</Button>
												) : null}
											</div>
										) : (
											<div className="flex items-center gap-2">
												{member.team ? (
													<Badge variant={member.team === "PRO" ? "default" : "secondary"}>
														{member.team}
													</Badge>
												) : member.role === "PARTICIPANT" ? (
													<span className="text-muted-foreground">{TEAM.unassigned}</span>
												) : null}
												<Badge variant="secondary">{MEMBERSHIP.role[member.role]}</Badge>
											</div>
										)}
									</li>
								))}
							</ul>

							{members.data && members.data.items.length === 0 ? (
								<p className="mt-3 text-sm text-muted-foreground">{MEMBERSHIP.emptyRoster}</p>
							) : null}
						</CardContent>
					</Card>

					{authenticated && current.viewerRole !== "HOST" ? (
						<ReportForm roomId={current.id} />
					) : null}
				</div>

				<Card className="h-fit">
					<CardHeader>
						<CardTitle>{ROOM.timeline}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 text-sm">
						<div className="flex items-center justify-between gap-3">
							<span className="text-muted-foreground">{ROOM.created}</span>
							<span>{formatDateTime(current.createdAt)}</span>
						</div>
						<div className="flex items-center justify-between gap-3">
							<span className="text-muted-foreground">{ROOM.published}</span>
							<span>{current.publishedAt ? formatDateTime(current.publishedAt) : "—"}</span>
						</div>
						<div className="flex items-center justify-between gap-3">
							<span className="text-muted-foreground">{ROOM.cancelled}</span>
							<span>{current.cancelledAt ? formatDateTime(current.cancelledAt) : "—"}</span>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
