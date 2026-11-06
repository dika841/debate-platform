import { APP } from "@app/messages";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import { AppHeader } from "@/routes/_components/app-header.tsx";

export const Route = createFileRoute("/_public")({
	component: PublicLayout,
});

function PublicLayout() {
	return (
		<div className="flex min-h-screen flex-col">
			<AppHeader />

			<main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
				<Outlet />
			</main>

			<footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
				{APP.tagline}
			</footer>
		</div>
	);
}
