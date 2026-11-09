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

			<footer className="border-t py-6 text-center font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
				{APP.tagline}
			</footer>
		</div>
	);
}
