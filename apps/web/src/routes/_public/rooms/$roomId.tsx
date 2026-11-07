import { Badge } from "@app/components/ui/badge";
import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@app/components/ui/card";
import { ROOM } from "@app/messages";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useCancelRoom, usePublishRoom, useRoom } from "@/libs/api/queries.ts";
import { RoomStatusBadge } from "@/routes/_components/room-status-badge.tsx";

export const Route = createFileRoute("/_public/rooms/$roomId")({
	component: RoomDetailPage,
});

const formatDate = (value: string): string => new Date(value).toLocaleString();

function RoomDetailPage() {
	const { roomId } = Route.useParams();
	const room = useRoom(roomId);
	const publish = usePublishRoom();
	const cancel = useCancelRoom();

	if (room.isPending) {
		return <p className="text-sm text-muted-foreground">Loading debate…</p>;
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
	const actionError = publish.error?.message ?? cancel.error?.message ?? null;
	const actionPending = publish.isPending || cancel.isPending;

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
					</div>
					<h1 className="max-w-3xl text-3xl font-semibold tracking-tight">{current.title}</h1>
					<p className="max-w-3xl text-lg text-muted-foreground">{current.motion}</p>
				</div>

				<div className="flex flex-wrap gap-2">
					<Button variant="outline" asChild>
						<Link to="/">{ROOM.backToExplore}</Link>
					</Button>
					{current.isHost && current.status === "DRAFT" ? (
						<Button variant="outline" asChild>
							<Link to="/rooms/$roomId/edit" params={{ roomId: current.id }}>
								{ROOM.edit}
							</Link>
						</Button>
					) : null}
					{current.isHost && current.status === "DRAFT" ? (
						<Button
							disabled={actionPending}
							onClick={() => void publish.mutate({ id: current.id })}
						>
							{publish.isPending ? ROOM.publishing : ROOM.publish}
						</Button>
					) : null}
					{current.isHost && (current.status === "DRAFT" || current.status === "PUBLISHED") ? (
						<Button
							variant="destructive"
							disabled={actionPending}
							onClick={() => void cancel.mutate({ id: current.id })}
						>
							{cancel.isPending ? ROOM.cancelling : ROOM.cancel}
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
				</div>

				<Card className="h-fit">
					<CardHeader>
						<CardTitle>{ROOM.timeline}</CardTitle>
					</CardHeader>
					<CardContent className="space-y-3 text-sm">
						<div className="flex items-center justify-between gap-3">
							<span className="text-muted-foreground">{ROOM.created}</span>
							<span>{formatDate(current.createdAt)}</span>
						</div>
						<div className="flex items-center justify-between gap-3">
							<span className="text-muted-foreground">{ROOM.published}</span>
							<span>{current.publishedAt ? formatDate(current.publishedAt) : "—"}</span>
						</div>
						<div className="flex items-center justify-between gap-3">
							<span className="text-muted-foreground">{ROOM.cancelled}</span>
							<span>{current.cancelledAt ? formatDate(current.cancelledAt) : "—"}</span>
						</div>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
