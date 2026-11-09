import { Badge } from "@app/components/ui/badge";
import { Button } from "@app/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@app/components/ui/dropdown-menu";
import { APP, AUTH, NAV } from "@app/messages";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { Menu } from "lucide-react";
import { useState } from "react";
import { authClient } from "@/libs/auth/client.ts";
import { sessionClear } from "@/libs/auth/session-store.ts";
import { signOutPerform } from "@/libs/auth/sign-out.ts";
import { useSession } from "@/libs/auth/use-session.ts";
import { useNotificationUnreadCount } from "@/libs/api/queries.ts";

const navLinkClass =
	"font-mono text-[11px] tracking-[0.14em] uppercase transition-colors hover:text-foreground";
const activeLinkProps = { className: "text-primary" };

export const AppHeader = () => {
	const session = useSession();
	const navigate = useNavigate();
	const queryClient = useQueryClient();
	const user = session?.user;
	const unreadCount = useNotificationUnreadCount(Boolean(user));
	const canModerate = user?.role === "MODERATOR" || user?.role === "ADMIN";
	const [signOutError, setSignOutError] = useState<string | null>(null);

	const handleSignOut = async (): Promise<void> => {
		setSignOutError(null);

		await signOutPerform({
			signOut: () => authClient.signOut(),
			queryClient,
			onSignedOut: (): void => {
				sessionClear();
				void navigate({ to: "/" });
			},
			onFailure: (): void => {
				setSignOutError(AUTH.signOutFailed);
			},
		});
	};

	return (
		<header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur-sm">
			<div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-3">
				<Link to="/" className="flex items-center gap-2.5">
					<span className="grid size-7 place-items-center rounded-sm border border-primary/30 bg-primary font-mono text-[10px] font-bold tracking-tight text-primary-foreground">
						DP
					</span>
					<span className="hidden font-display text-lg font-semibold tracking-tight sm:inline">
						{APP.name}
					</span>
				</Link>

				<nav
					className="hidden items-center gap-6 text-muted-foreground md:flex"
					aria-label="Primary"
				>
					<Link
						to="/"
						className={navLinkClass}
						activeOptions={{ exact: true }}
						activeProps={activeLinkProps}
					>
						{NAV.explore}
					</Link>
					{user ? (
						<>
							<Link to="/rooms" className={navLinkClass} activeProps={activeLinkProps}>
								{NAV.myDebates}
							</Link>
							<Link to="/rooms/new" className={navLinkClass} activeProps={activeLinkProps}>
								{NAV.createDebate}
							</Link>
							<Link
								to="/notifications"
								className={`flex items-center gap-1 ${navLinkClass}`}
								activeProps={activeLinkProps}
							>
								{NAV.notifications}
								{unreadCount.data && unreadCount.data > 0 ? (
									<Badge variant="secondary">{unreadCount.data}</Badge>
								) : null}
							</Link>
							{canModerate ? (
								<Link to="/moderation" className={navLinkClass} activeProps={activeLinkProps}>
									{NAV.moderation}
								</Link>
							) : null}
						</>
					) : null}
					<Link to="/health" className={navLinkClass} activeProps={activeLinkProps}>
						Health
					</Link>
				</nav>

				<div className="flex items-center gap-3">
					{user ? (
						<>
							<Link to="/profile" className="hidden sm:inline-flex">
								<Badge variant="secondary">{user.name}</Badge>
							</Link>
							<Button
								size="sm"
								variant="outline"
								className="hidden sm:inline-flex"
								onClick={() => void handleSignOut()}
							>
								{AUTH.signOut}
							</Button>
						</>
					) : (
						<>
							<Button size="sm" variant="ghost" asChild className="hidden sm:inline-flex">
								<Link to="/login">{AUTH.signIn}</Link>
							</Button>
							<Button size="sm" asChild>
								<Link to="/register">{AUTH.signUp}</Link>
							</Button>
						</>
					)}

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button
								variant="ghost"
								size="icon"
								className="md:hidden"
								aria-label="Open navigation"
							>
								<Menu />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end" className="w-56 md:hidden">
							<DropdownMenuLabel>{APP.name}</DropdownMenuLabel>
							<DropdownMenuSeparator />
							<DropdownMenuItem asChild>
								<Link to="/">{NAV.explore}</Link>
							</DropdownMenuItem>
							{user ? (
								<>
									<DropdownMenuItem asChild>
										<Link to="/rooms">{NAV.myDebates}</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link to="/rooms/new">{NAV.createDebate}</Link>
									</DropdownMenuItem>
									<DropdownMenuItem asChild>
										<Link to="/notifications">
											{NAV.notifications}
											{unreadCount.data && unreadCount.data > 0 ? (
												<Badge variant="secondary" className="ml-auto">
													{unreadCount.data}
												</Badge>
											) : null}
										</Link>
									</DropdownMenuItem>
									{canModerate ? (
										<DropdownMenuItem asChild>
											<Link to="/moderation">{NAV.moderation}</Link>
										</DropdownMenuItem>
									) : null}
									<DropdownMenuSeparator />
									<DropdownMenuItem asChild>
										<Link to="/profile">{NAV.profile}</Link>
									</DropdownMenuItem>
									<DropdownMenuItem variant="destructive" onSelect={() => void handleSignOut()}>
										{AUTH.signOut}
									</DropdownMenuItem>
								</>
							) : (
								<>
									<DropdownMenuSeparator />
									<DropdownMenuItem asChild>
										<Link to="/login">{AUTH.signIn}</Link>
									</DropdownMenuItem>
								</>
							)}
							<DropdownMenuSeparator />
							<DropdownMenuItem asChild>
								<Link to="/health">Health</Link>
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
			{signOutError ? (
				<p
					role="alert"
					className="border-t border-destructive/30 bg-destructive/10 px-6 py-2 text-sm text-destructive"
				>
					{signOutError}
				</p>
			) : null}
		</header>
	);
};
