import type { QueryClient } from "@tanstack/react-query";
import {
	createRootRouteWithContext,
	type ErrorComponentProps,
	Outlet,
} from "@tanstack/react-router";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
	component: RootComponent,
	errorComponent: RootErrorComponent,
});

function RootComponent() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<Outlet />
		</div>
	);
}

function RootErrorComponent({ error }: ErrorComponentProps) {
	const message = error instanceof Error ? error.message : "Unexpected error";

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
			<div className="max-w-md space-y-3 text-center">
				<h1 className="text-xl font-semibold">Something went wrong</h1>
				<p className="text-sm text-muted-foreground">{message}</p>
				<a href="/" className="text-sm underline underline-offset-4 hover:text-foreground">
					Back to home
				</a>
			</div>
		</div>
	);
}
