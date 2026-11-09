import { NAV, ROOM } from "@app/messages";
import { Button } from "@app/components/ui/button";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useInfiniteJoinedRooms, useInfiniteMyRooms } from "@/libs/api/queries.ts";
import { RoomCard } from "@/routes/_components/room-card.tsx";
import { RoomGridSkeleton } from "@/routes/_components/room-card-skeleton.tsx";
import { SearchField } from "@/routes/_components/search-field.tsx";

export const Route = createFileRoute("/_authenticated/rooms/")({
	component: MyRoomsPage,
});

function MyRoomsPage() {
	const [search, setSearch] = useState("");
	const searchTerm = search.trim();
	const hosted = useInfiniteMyRooms(searchTerm);
	const joined = useInfiniteJoinedRooms(searchTerm);
	const hostedRooms = useMemo(
		() => hosted.data?.pages.flatMap((page) => page.items) ?? [],
		[hosted.data],
	);
	const joinedRooms = useMemo(
		() => joined.data?.pages.flatMap((page) => page.items) ?? [],
		[joined.data],
	);
	const suggestions = useMemo(
		() => Array.from(new Set([...hostedRooms, ...joinedRooms].map((room) => room.title))),
		[hostedRooms, joinedRooms],
	);

	return (
		<div className="space-y-10">
			<div className="flex flex-wrap items-end justify-between gap-4 border-b pb-4">
				<div className="space-y-1">
					<p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
						Workspace / 02
					</p>
					<h1 className="text-3xl font-semibold tracking-tight">{ROOM.myDebatesTitle}</h1>
					<p className="text-sm text-muted-foreground">{ROOM.myDebatesDescription}</p>
				</div>
				<Button asChild>
					<Link to="/rooms/new">{NAV.createDebate}</Link>
				</Button>
			</div>

			<div className="flex flex-wrap items-center gap-2">
				<SearchField value={search} onChange={setSearch} suggestions={suggestions} />
			</div>

			<section className="space-y-4">
				{hosted.isPending ? <RoomGridSkeleton /> : null}

				{hosted.isError ? (
					<div className="space-y-3">
						<p className="text-sm text-destructive">{ROOM.loadError}</p>
						<Button size="sm" variant="outline" onClick={() => void hosted.refetch()}>
							Try again
						</Button>
					</div>
				) : null}

				{hosted.data && hostedRooms.length === 0 ? (
					<div className="space-y-4 rounded-lg border border-dashed border-border p-10 text-center">
						<p className="text-sm text-muted-foreground">
							{searchTerm ? ROOM.emptySearch : ROOM.emptyMine}
						</p>
						{searchTerm ? null : (
							<Button asChild>
								<Link to="/rooms/new">{NAV.createDebate}</Link>
							</Button>
						)}
					</div>
				) : null}

				{hostedRooms.length > 0 ? (
					<>
						<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
							{hostedRooms.map((room) => (
								<RoomCard key={room.id} room={room} />
							))}
						</div>
						{hosted.hasNextPage ? (
							<div className="flex justify-center">
								<Button
									variant="outline"
									disabled={hosted.isFetchingNextPage}
									onClick={() => void hosted.fetchNextPage()}
								>
									{hosted.isFetchingNextPage ? "Loading more…" : "Load more debates"}
								</Button>
							</div>
						) : null}
					</>
				) : null}
			</section>

			<section className="space-y-4">
				<div className="space-y-1">
					<h2 className="text-xl font-semibold tracking-tight">{ROOM.joinedTitle}</h2>
					<p className="text-sm text-muted-foreground">{ROOM.joinedDescription}</p>
				</div>

				{joined.isPending ? <RoomGridSkeleton /> : null}

				{joined.isError ? <p className="text-sm text-destructive">{ROOM.loadError}</p> : null}

				{joined.data && joinedRooms.length === 0 ? (
					<p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
						{searchTerm ? ROOM.emptySearch : ROOM.emptyJoined}
					</p>
				) : null}

				{joinedRooms.length > 0 ? (
					<>
						<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
							{joinedRooms.map((room) => (
								<RoomCard key={room.id} room={room} />
							))}
						</div>
						{joined.hasNextPage ? (
							<div className="flex justify-center">
								<Button
									variant="outline"
									disabled={joined.isFetchingNextPage}
									onClick={() => void joined.fetchNextPage()}
								>
									{joined.isFetchingNextPage ? "Loading more…" : "Load more debates"}
								</Button>
							</div>
						) : null}
					</>
				) : null}
			</section>
		</div>
	);
}
