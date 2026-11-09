import { ROOM } from "@app/messages";
import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@app/components/ui/card";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useRoom, useUpdateRoom } from "@/libs/api/queries.ts";
import { RoomDetailSkeleton } from "@/routes/_components/room-detail-skeleton.tsx";
import { RoomForm } from "@/routes/_authenticated/rooms/_components/room-form.tsx";

export const Route = createFileRoute("/_authenticated/rooms/$roomId/edit")({
	component: EditRoomPage,
});

function EditRoomPage() {
	const { roomId } = Route.useParams();
	const navigate = useNavigate();
	const room = useRoom(roomId);
	const update = useUpdateRoom();
	const [error, setError] = useState<string | null>(null);

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
						<Link to="/rooms">{ROOM.myDebatesTitle}</Link>
					</Button>
				</CardContent>
			</Card>
		);
	}

	const current = room.data;

	if (!current.isHost || current.status !== "DRAFT") {
		return (
			<Card className="max-w-2xl">
				<CardHeader>
					<CardTitle>{ROOM.editTitle}</CardTitle>
					<CardDescription>
						{current.isHost
							? "Only draft debates can be edited."
							: "Only the host can edit this debate."}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Button variant="outline" asChild>
						<Link to="/rooms/$roomId" params={{ roomId: current.id }}>
							{ROOM.viewDebate}
						</Link>
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="max-w-3xl space-y-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-semibold tracking-tight">{ROOM.editTitle}</h1>
				<p className="text-sm text-muted-foreground">{ROOM.editDescription}</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{current.title}</CardTitle>
					<CardDescription>
						{ROOM.formatValue(current.teamSize, current.roundCount)}
					</CardDescription>
				</CardHeader>
				<CardContent>
					<RoomForm
						initial={current}
						submitLabel={ROOM.form.save}
						pendingLabel={ROOM.form.saving}
						pending={update.isPending}
						error={error}
						onSubmit={(values) => {
							setError(null);
							void update
								.mutateAsync({ ...values, id: current.id })
								.then(() => navigate({ to: "/rooms/$roomId", params: { roomId: current.id } }))
								.catch((cause: unknown) => {
									setError(cause instanceof Error ? cause.message : "Unable to update debate");
								});
						}}
					/>
				</CardContent>
			</Card>

			<Button variant="ghost" asChild>
				<Link to="/rooms/$roomId" params={{ roomId: current.id }}>
					{ROOM.viewDebate}
				</Link>
			</Button>
		</div>
	);
}
