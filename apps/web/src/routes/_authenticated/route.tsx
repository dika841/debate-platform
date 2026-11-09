import { APP } from "@app/messages";
import { ROLE_PERMISSIONS } from "@app/permissions";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { roleOf } from "@/libs/auth/role.ts";
import { ServerUnreachableError } from "@/libs/auth/server-unreachable.ts";
import { SESSION_REACH } from "@/libs/auth/session-reach.ts";
import { sessionStore } from "@/libs/auth/session-store.ts";
import { AppHeader } from "@/routes/_components/app-header.tsx";

export const Route = createFileRoute("/_authenticated")({
	beforeLoad: ({ location }) => {
		const { reach, session } = sessionStore.state;

		if (reach === SESSION_REACH.UNREACHABLE) {
			throw new ServerUnreachableError();
		}

		if (!session) {
			throw redirect({
				to: "/login",
				search: { redirect: location.href },
			});
		}

		return { session, permissions: ROLE_PERMISSIONS[roleOf(session.user.role)] };
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

			<footer className="border-t py-6 text-center font-mono text-[10px] tracking-[0.18em] text-muted-foreground uppercase">
				{APP.tagline}
			</footer>
		</div>
	);
}
