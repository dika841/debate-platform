import { Card, CardContent, CardHeader } from "@app/components/ui/card";
import { Skeleton } from "@app/components/ui/skeleton";

export const RoomCardSkeleton = () => (
	<Card className="h-full" aria-hidden="true">
		<CardHeader className="space-y-3">
			<div className="flex items-start justify-between gap-3">
				<Skeleton className="h-5 w-2/3" />
				<Skeleton className="h-5 w-16" />
			</div>
			<Skeleton className="h-4 w-full" />
			<Skeleton className="h-4 w-4/5" />
		</CardHeader>
		<CardContent className="space-y-2">
			<Skeleton className="h-4 w-1/2" />
			<Skeleton className="h-4 w-2/5" />
		</CardContent>
	</Card>
);

export const RoomGridSkeleton = ({ count = 3 }: { count?: number }) => (
	<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-hidden="true">
		{Array.from({ length: count }, (_, index) => (
			<RoomCardSkeleton key={index} />
		))}
	</div>
);
