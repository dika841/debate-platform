import { Skeleton } from "@app/components/ui/skeleton";

export const RoomDetailSkeleton = () => (
	<div className="space-y-6" aria-busy="true">
		<span className="sr-only">Loading debate</span>
		<div className="space-y-3">
			<Skeleton className="h-5 w-28" />
			<Skeleton className="h-9 w-2/3" />
			<Skeleton className="h-5 w-1/2" />
		</div>
		<div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
			<div className="space-y-6">
				<Skeleton className="h-44 w-full" />
				<Skeleton className="h-36 w-full" />
				<Skeleton className="h-56 w-full" />
			</div>
			<Skeleton className="h-40 w-full" />
		</div>
	</div>
);
