import { APP, AUTH, NAV } from "@app/messages";
import { Badge } from "@app/components/ui/badge";
import { Button } from "@app/components/ui/button";
import { Link, useNavigate } from "@tanstack/react-router";
import { signOut } from "@/libs/auth/client.ts";
import {
	useInvalidateAccount,
	useNotificationUnreadCount,
	useSession,
} from "@/libs/api/queries.ts";

export const AppHeader = () => {
	const session = useSession();
	const invalidate = useInvalidateAccount();
	const navigate = useNavigate();
	const user = session.data?.session?.user;
	const unreadCount = useNotificationUnreadCount(Boolean(user));

	const handleSignOut = async (): Promise<void> => {
		await signOut();
		await invalidate();
		await navigate({ to: "/" });
	};

	return (
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
					{user ? (
						<>
							<Link to="/rooms" className="hover:text-foreground">
								{NAV.myDebates}
							</Link>
							<Link to="/rooms/new" className="hover:text-foreground">
								{NAV.createDebate}
							</Link>
							<Link to="/notifications" className="flex items-center gap-1 hover:text-foreground">
								{NAV.notifications}
								{unreadCount.data && unreadCount.data > 0 ? (
									<Badge variant="secondary">{unreadCount.data}</Badge>
								) : null}
							</Link>
							{user.role === "MODERATOR" || user.role === "ADMIN" ? (
								<Link to="/moderation" className="hover:text-foreground">
									{NAV.moderation}
								</Link>
							) : null}
						</>
					) : null}
					<Link to="/health" className="hover:text-foreground">
						Health
					</Link>
				</nav>

				<div className="flex items-center gap-3">
					{user ? (
						<>
							<Link to="/profile">
								<Badge variant="secondary">{user.name}</Badge>
							</Link>
							<Button size="sm" variant="outline" onClick={() => void handleSignOut()}>
								{AUTH.signOut}
							</Button>
						</>
					) : (
						<>
							<Button size="sm" variant="ghost" asChild>
								<Link to="/login">{AUTH.signIn}</Link>
							</Button>
							<Button size="sm" asChild>
								<Link to="/register">{AUTH.signUp}</Link>
							</Button>
						</>
					)}
				</div>
			</div>
		</header>
	);
};
