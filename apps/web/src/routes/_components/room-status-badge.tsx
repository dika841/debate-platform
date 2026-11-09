import type { Room } from "@app/api-contract";
import { Badge } from "@app/components/ui/badge";
import { ROOM } from "@app/messages";
import { match } from "ts-pattern";

type StatusTone = {
	readonly variant: "default" | "secondary" | "destructive" | "outline";
	readonly className?: string;
};

const toneFor = (status: Room["status"]): StatusTone =>
	match(status)
		.with("PUBLISHED", (): StatusTone => ({ variant: "default" }))
		.with(
			"IN_PROGRESS",
			(): StatusTone => ({
				variant: "outline",
				className: "border-chart-2/50 bg-chart-2/10 text-chart-2",
			}),
		)
		.with("CANCELLED", (): StatusTone => ({ variant: "destructive" }))
		.otherwise((): StatusTone => ({ variant: "outline" }));

export const RoomStatusBadge = ({ status }: { status: Room["status"] }) => {
	const tone = toneFor(status);

	return (
		<Badge variant={tone.variant} className={tone.className}>
			{ROOM.status[status]}
		</Badge>
	);
};
