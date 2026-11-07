import type { Room } from "@app/api-contract";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@app/components/ui/card";
import { ROOM } from "@app/messages";
import { Link } from "@tanstack/react-router";
import { RoomStatusBadge } from "@/routes/_components/room-status-badge.tsx";

export const RoomCard = ({ room }: { room: Room }) => (
	<Card className="h-full transition-colors hover:border-foreground/30">
		<CardHeader className="space-y-2">
			<div className="flex items-start justify-between gap-3">
				<CardTitle className="text-lg">
					<Link to="/rooms/$roomId" params={{ roomId: room.id }}>
						{room.title}
					</Link>
				</CardTitle>
				<RoomStatusBadge status={room.status} />
			</div>
			<CardDescription className="line-clamp-2">{room.motion}</CardDescription>
		</CardHeader>
		<CardContent className="space-y-2 text-sm text-muted-foreground">
			<p>
				{ROOM.host}: {room.host.displayName}
				{room.host.username ? ` (@${room.host.username})` : ""}
			</p>
			<p>{ROOM.formatValue(room.teamSize, room.roundCount)}</p>
		</CardContent>
	</Card>
);
