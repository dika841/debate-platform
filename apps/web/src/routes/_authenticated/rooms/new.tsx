import { ROOM } from "@app/messages";
import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@app/components/ui/card";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useCreateRoom } from "@/libs/api/queries.ts";
import { RoomForm } from "@/routes/_authenticated/rooms/_components/room-form.tsx";

export const Route = createFileRoute("/_authenticated/rooms/new")({
	component: NewRoomPage,
});

function NewRoomPage() {
	const navigate = useNavigate();
	const create = useCreateRoom();
	const [error, setError] = useState<string | null>(null);

	return (
		<div className="max-w-3xl space-y-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-semibold tracking-tight">{ROOM.createTitle}</h1>
				<p className="text-sm text-muted-foreground">{ROOM.createDescription}</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>{ROOM.createTitle}</CardTitle>
					<CardDescription>The room starts as a draft and is only visible to you.</CardDescription>
				</CardHeader>
				<CardContent>
					<RoomForm
						submitLabel={ROOM.form.create}
						pendingLabel={ROOM.form.creating}
						pending={create.isPending}
						error={error}
						onSubmit={(values) => {
							setError(null);
							void create
								.mutateAsync(values)
								.then((room) => navigate({ to: "/rooms/$roomId", params: { roomId: room.id } }))
								.catch((cause: unknown) => {
									setError(cause instanceof Error ? cause.message : "Unable to create debate");
								});
						}}
					/>
				</CardContent>
			</Card>

			<Button variant="ghost" asChild>
				<Link to="/rooms">{ROOM.myDebatesTitle}</Link>
			</Button>
		</div>
	);
}
