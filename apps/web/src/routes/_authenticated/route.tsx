import { APP } from "@app/messages";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { orpc } from "@/libs/orpc/index.ts";
import { AppHeader } from "@/routes/_components/app-header.tsx";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: async ({ context, location }) => {
		const session = await context.queryClient.ensureQueryData(orpc.auth.getSession.queryOptions());

		if (!session.session) {
			throw redirect({
				to: "/login",
				search: { redirect: location.href },
			});
		}

		return { session: session.session };
	},
	component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
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
