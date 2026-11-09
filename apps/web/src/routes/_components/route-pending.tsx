import { Skeleton } from "@app/components/ui/skeleton";

/** Generic skeleton shown while a route (or its auth guard) is loading. */
export const RoutePending = () => (
	<div className="mx-auto w-full max-w-6xl space-y-6 px-6 py-10" aria-busy="true">
		<span className="sr-only">Loading page</span>{" "}
		<div className="space-y-3">
			<Skeleton className="h-8 w-1/3" />
			<Skeleton className="h-4 w-2/3 max-w-xl" />
		</div>
		<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
			{Array.from({ length: 3 }, (_, index) => (
				<Skeleton key={index} className="h-40 w-full" />
			))}
		</div>
	</div>
);
