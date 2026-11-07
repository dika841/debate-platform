import type { Room } from "@app/api-contract";
import { Badge } from "@app/components/ui/badge";
import { ROOM } from "@app/messages";

const variantFor = (status: Room["status"]) => {
	switch (status) {
		case "PUBLISHED":
			return "default" as const;
		case "IN_PROGRESS":
			return "secondary" as const;
		case "CANCELLED":
			return "destructive" as const;
		default:
			return "outline" as const;
	}
};

export const RoomStatusBadge = ({ status }: { status: Room["status"] }) => (
	<Badge variant={variantFor(status)}>{ROOM.status[status]}</Badge>
);
