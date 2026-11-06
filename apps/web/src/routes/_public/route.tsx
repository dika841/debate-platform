import { APP, AUTH, NAV } from "@app/messages";
import { Badge } from "@app/components/ui/badge";
import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { useSession } from "@/libs/api/queries.ts";

export const Route = createFileRoute("/_public")({
	component: PublicLayout
});

function PublicLayout() {
	const session = useSession();
	const user = session.data?.session?.user;

	return (
		<div className="flex min-h-screen flex-col">
			<header className="border-b border-border/60 bg-background/80 backdrop-blur">
				<div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
					<Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
						<span className="inline-block size-2 rounded-full bg-primary" />
						{APP.name}
					</Link>

					<nav className="hidden items-center gap-5 text-sm text-muted-foreground md:flex">
						<Link to="/" className="hover:text-foreground">
							{NAV.explore}
						</Link>
						<Link to="/health" className="hover:text-foreground">
							Health
						</Link>
					</nav>

					<div className="flex items-center gap-3">
						{user ? (
							<Badge variant="secondary">{user.name}</Badge>
						) : (
							<Badge variant="outline">
								{session.isError ? AUTH.sessionUnavailable : AUTH.sessionAnonymous}
							</Badge>
						)}
					</div>
				</div>
			</header>

			<main className="mx-auto w-full max-w-6xl flex-1 px-6 py-10">
				<Outlet />
			</main>

			<footer className="border-t border-border/60 py-6 text-center text-xs text-muted-foreground">
				{APP.tagline}
			</footer>
		</div>
	);
}
