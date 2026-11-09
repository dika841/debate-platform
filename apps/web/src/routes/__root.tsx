import type { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { RouteError } from "@/routes/_components/route-error.tsx";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
	component: RootComponent,
	errorComponent: RouteError,
});

function RootComponent() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<Outlet />
		</div>
	);
}
