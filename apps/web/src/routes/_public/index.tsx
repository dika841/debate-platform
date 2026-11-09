import { APP, HEALTH, NAV, ROOM } from "@app/messages";
import { Badge } from "@app/components/ui/badge";
import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@app/components/ui/card";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useHealth, useInfiniteRooms } from "@/libs/api/queries.ts";
import { useSession } from "@/libs/auth/use-session.ts";
import { formatDateTime } from "@/libs/format.ts";
import { RoomCard } from "@/routes/_components/room-card.tsx";
import { RoomGridSkeleton } from "@/routes/_components/room-card-skeleton.tsx";
import { SearchField } from "@/routes/_components/search-field.tsx";

export const Route = createFileRoute("/_public/")({
	component: HomePage,
});

function HomePage() {
	const health = useHealth();
	const session = useSession();
	const [search, setSearch] = useState("");
	const searchTerm = search.trim();
	const rooms = useInfiniteRooms({
		scope: "public",
		search: searchTerm ? searchTerm : undefined,
	});
	const roomItems = useMemo(
		() => rooms.data?.pages.flatMap((page) => page.items) ?? [],
		[rooms.data],
	);
	const suggestions = useMemo(
		() => Array.from(new Set(roomItems.map((room) => room.title))),
		[roomItems],
	);
	const authenticated = Boolean(session);

	return (
		<div className="space-y-12">
			<div className="grid gap-10 lg:grid-cols-[1.45fr_1fr] lg:items-start">
				<section className="space-y-6 border-l-2 border-primary/30 pl-6 md:pl-8">
					<div className="flex flex-wrap items-center gap-3">
						<Badge variant="outline">MVP foundation</Badge>
						<span className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
							PRO / CONTRA · Asynchronous debate
						</span>
					</div>
					<h1 className="max-w-2xl text-5xl leading-[0.95] font-semibold md:text-6xl">
						{APP.name}
					</h1>
					<p className="max-w-xl font-display text-xl text-foreground/80 italic">{APP.tagline}</p>
					<p className="max-w-xl text-sm leading-relaxed text-muted-foreground">
						Structured PRO and CONTRA debates with automatic team assignment, async rounds and
						spectator evaluation.
					</p>

					<div className="flex flex-wrap gap-3">
						<Button asChild>
							<Link to={authenticated ? "/rooms/new" : "/register"}>
								{authenticated ? NAV.createDebate : "Create account"}
							</Link>
						</Button>
						<Button variant="outline" asChild>
							<Link to={authenticated ? "/rooms" : "/login"}>
								{authenticated ? NAV.myDebates : "Sign in"}
							</Link>
						</Button>
					</div>

					<div className="flex flex-wrap gap-x-6 gap-y-2 border-t pt-4 font-mono text-[10px] tracking-[0.16em] text-muted-foreground uppercase">
						<span>01 — Motion</span>
						<span>02 — Team assignment</span>
						<span>03 — Verdict</span>
					</div>
				</section>

				<Card className="border-t-2 border-t-primary/50">
					<CardHeader>
						<CardTitle>{HEALTH.title}</CardTitle>
						<CardDescription>Web → oRPC → Hono → PostgreSQL</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4 text-sm">
						{health.isPending ? <p className="text-muted-foreground">{HEALTH.loading}</p> : null}

						{health.isError ? (
							<div className="space-y-3">
								<p className="text-destructive">{HEALTH.error}</p>
								<Button size="sm" variant="outline" onClick={() => void health.refetch()}>
									{HEALTH.retry}
								</Button>
							</div>
						) : null}

						{health.data ? (
							<>
								<div className="flex items-center justify-between">
									<span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
										{HEALTH.api}
									</span>
									<Badge variant={health.data.status === "ok" ? "secondary" : "destructive"}>
										{health.data.status}
									</Badge>
								</div>
								<div className="flex items-center justify-between">
									<span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
										{HEALTH.database}
									</span>
									<Badge variant={health.data.database === "up" ? "secondary" : "destructive"}>
										{health.data.database}
									</Badge>
								</div>
								<div className="flex items-center justify-between">
									<span className="font-mono text-[10px] tracking-[0.14em] text-muted-foreground uppercase">
										Version
									</span>
									<span className="font-mono text-xs">{health.data.version}</span>
								</div>
								<div className="space-y-1 border-t pt-3 font-mono text-[10px] tracking-[0.12em] text-muted-foreground uppercase">
									<p>{HEALTH.checkedAt}</p>
									<p className="normal-case tracking-normal">{formatDateTime(health.data.time)}</p>
								</div>
							</>
						) : null}
					</CardContent>
				</Card>
			</div>

			<section className="space-y-6">
				<div className="flex flex-wrap items-end justify-between gap-4 border-b pb-4">
					<div className="space-y-1">
						<p className="font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
							Index / 01
						</p>
						<h2 className="text-3xl font-semibold tracking-tight">{ROOM.exploreTitle}</h2>
						<p className="text-sm text-muted-foreground">{ROOM.exploreDescription}</p>
					</div>
					<Button variant="outline" size="sm" asChild>
						<Link to={authenticated ? "/rooms/new" : "/register"}>{NAV.createDebate}</Link>
					</Button>
				</div>

				<div className="flex flex-wrap items-center gap-2">
					<SearchField value={search} onChange={setSearch} suggestions={suggestions} />
				</div>

				{rooms.isPending ? <RoomGridSkeleton /> : null}

				{rooms.isError ? (
					<div className="space-y-3">
						<p className="text-sm text-destructive">{ROOM.loadError}</p>
						<Button size="sm" variant="outline" onClick={() => void rooms.refetch()}>
							{HEALTH.retry}
						</Button>
					</div>
				) : null}

				{rooms.data && roomItems.length === 0 ? (
					<p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
						{searchTerm ? ROOM.emptySearch : ROOM.emptyExplore}
					</p>
				) : null}

				{roomItems.length > 0 ? (
					<>
						<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
							{roomItems.map((room) => (
								<RoomCard key={room.id} room={room} />
							))}
						</div>

						{rooms.hasNextPage ? (
							<div className="flex justify-center">
								<Button
									variant="outline"
									disabled={rooms.isFetchingNextPage}
									onClick={() => void rooms.fetchNextPage()}
								>
									{rooms.isFetchingNextPage ? "Loading more…" : "Load more debates"}
								</Button>
							</div>
						) : null}
					</>
				) : null}
			</section>
		</div>
	);
}
