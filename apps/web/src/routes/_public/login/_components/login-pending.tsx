import { Card, CardContent, CardHeader } from "@app/components/ui/card";
import { Skeleton } from "@app/components/ui/skeleton";

export const LoginPending = () => (
	<div className="mx-auto w-full max-w-md" aria-busy="true">
		<span className="sr-only">Loading sign in form</span>
		<Card>
			<CardHeader className="space-y-2">
				<Skeleton className="h-6 w-32" />
				<Skeleton className="h-4 w-64" />
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Skeleton className="h-4 w-12" />
					<Skeleton className="h-9 w-full" />
				</div>
				<div className="space-y-2">
					<Skeleton className="h-4 w-20" />
					<Skeleton className="h-9 w-full" />
				</div>
				<Skeleton className="h-9 w-full" />
			</CardContent>
		</Card>
	</div>
);
