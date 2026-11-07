import { NAV, ROOM } from "@app/messages";
import { Button } from "@app/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMyRooms } from "@/libs/api/queries.ts";
import { RoomCard } from "@/routes/_components/room-card.tsx";

export const Route = createFileRoute("/_authenticated/rooms/")({
	component: MyRoomsPage,
});

function MyRoomsPage() {
	const rooms = useMyRooms();

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold tracking-tight">{ROOM.myDebatesTitle}</h1>
					<p className="text-sm text-muted-foreground">{ROOM.myDebatesDescription}</p>
				</div>
				<Button asChild>
					<Link to="/rooms/new">{NAV.createDebate}</Link>
				</Button>
			</div>

			{rooms.isPending ? <p className="text-sm text-muted-foreground">Loading debates…</p> : null}

			{rooms.isError ? (
				<div className="space-y-3">
					<p className="text-sm text-destructive">{ROOM.loadError}</p>
					<Button size="sm" variant="outline" onClick={() => void rooms.refetch()}>
						Try again
					</Button>
				</div>
			) : null}

			{rooms.data && rooms.data.items.length === 0 ? (
				<div className="space-y-4 rounded-lg border border-dashed border-border p-10 text-center">
					<p className="text-sm text-muted-foreground">{ROOM.emptyMine}</p>
					<Button asChild>
						<Link to="/rooms/new">{NAV.createDebate}</Link>
					</Button>
				</div>
			) : null}

			{rooms.data && rooms.data.items.length > 0 ? (
				<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
					{rooms.data.items.map((room) => (
						<RoomCard key={room.id} room={room} />
					))}
				</div>
			) : null}
		</div>
	);
}
