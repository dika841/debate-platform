import type { Room } from "@app/api-contract";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@app/components/ui/card";
import { ROOM } from "@app/messages";
import { Link } from "@tanstack/react-router";
import { match } from "ts-pattern";
import { RoomStatusBadge } from "@/routes/_components/room-status-badge.tsx";

const accentFor = (status: Room["status"]) =>
	match(status)
		.with("PUBLISHED", () => "border-t-primary/60")
		.with("IN_PROGRESS", () => "border-t-chart-2/70")
		.with("CANCELLED", () => "border-t-destructive/60")
		.with("COMPLETED", () => "border-t-muted-foreground/40")
		.otherwise(() => "border-t-border");

export const RoomCard = ({ room }: { room: Room }) => (
	<Card
		className={`h-full border-t-2 transition-all hover:-translate-y-0.5 hover:border-t-primary hover:shadow-[0_6px_0_-4px_rgba(35,32,26,0.18)] ${accentFor(room.status)}`}
	>
		<CardHeader className="space-y-2">
			<div className="flex items-start justify-between gap-3">
				<CardTitle className="text-xl leading-snug">
					<Link to="/rooms/$roomId" params={{ roomId: room.id }}>
						{room.title}
					</Link>
				</CardTitle>
				<RoomStatusBadge status={room.status} />
			</div>
			<CardDescription className="line-clamp-2 text-sm leading-relaxed">
				{room.motion}
			</CardDescription>
		</CardHeader>
		<CardContent className="space-y-1.5 text-sm text-muted-foreground">
			<p className="flex flex-wrap items-baseline gap-x-1.5">
				<span className="font-mono text-[10px] tracking-[0.12em] uppercase">{ROOM.host}</span>
				<span className="text-xs text-foreground">
					{room.host.displayName}
					{room.host.username ? ` (@${room.host.username})` : ""}
				</span>
			</p>
			<p className="font-mono text-[10px] tracking-[0.12em]">
				{ROOM.formatValue(room.teamSize, room.roundCount)}
			</p>
		</CardContent>
	</Card>
);
