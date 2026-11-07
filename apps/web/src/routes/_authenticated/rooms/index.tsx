import { NAV, ROOM } from "@app/messages";
import { Button } from "@app/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useJoinedRooms, useMyRooms } from "@/libs/api/queries.ts";
import { RoomCard } from "@/routes/_components/room-card.tsx";

export const Route = createFileRoute("/_authenticated/rooms/")({
	component: MyRoomsPage,
});

function MyRoomsPage() {
	const hosted = useMyRooms();
	const joined = useJoinedRooms();

	return (
		<div className="space-y-10">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold tracking-tight">{ROOM.myDebatesTitle}</h1>
					<p className="text-sm text-muted-foreground">{ROOM.myDebatesDescription}</p>
				</div>
				<Button asChild>
					<Link to="/rooms/new">{NAV.createDebate}</Link>
				</Button>
			</div>

			<section className="space-y-4">
				{hosted.isPending ? (
					<p className="text-sm text-muted-foreground">Loading debates…</p>
				) : null}

				{hosted.isError ? (
					<div className="space-y-3">
						<p className="text-sm text-destructive">{ROOM.loadError}</p>
						<Button size="sm" variant="outline" onClick={() => void hosted.refetch()}>
							Try again
						</Button>
					</div>
				) : null}

				{hosted.data && hosted.data.items.length === 0 ? (
					<div className="space-y-4 rounded-lg border border-dashed border-border p-10 text-center">
						<p className="text-sm text-muted-foreground">{ROOM.emptyMine}</p>
						<Button asChild>
							<Link to="/rooms/new">{NAV.createDebate}</Link>
						</Button>
					</div>
				) : null}

				{hosted.data && hosted.data.items.length > 0 ? (
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
						{hosted.data.items.map((room) => (
							<RoomCard key={room.id} room={room} />
						))}
					</div>
				) : null}
			</section>

			<section className="space-y-4">
				<div className="space-y-1">
					<h2 className="text-xl font-semibold tracking-tight">{ROOM.joinedTitle}</h2>
					<p className="text-sm text-muted-foreground">{ROOM.joinedDescription}</p>
				</div>

				{joined.isPending ? (
					<p className="text-sm text-muted-foreground">Loading debates…</p>
				) : null}

				{joined.isError ? <p className="text-sm text-destructive">{ROOM.loadError}</p> : null}

				{joined.data && joined.data.items.length === 0 ? (
					<p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
						{ROOM.emptyJoined}
					</p>
				) : null}

				{joined.data && joined.data.items.length > 0 ? (
					<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
						{joined.data.items.map((room) => (
							<RoomCard key={room.id} room={room} />
						))}
					</div>
				) : null}
			</section>
		</div>
	);
}
