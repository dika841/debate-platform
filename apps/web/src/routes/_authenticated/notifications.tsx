import { Badge } from "@app/components/ui/badge";
import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@app/components/ui/card";
import { NOTIFICATION } from "@app/messages";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
	useInfiniteNotifications,
	useMarkAllNotificationsRead,
	useMarkNotificationRead,
} from "@/libs/api/queries.ts";
import { formatDateTime } from "@/libs/format.ts";

export const Route = createFileRoute("/_authenticated/notifications")({
	component: NotificationsPage,
});

function NotificationsPage() {
	const notifications = useInfiniteNotifications();
	const markRead = useMarkNotificationRead();
	const markAllRead = useMarkAllNotificationsRead();
	const items = notifications.data?.pages.flatMap((page) => page.items) ?? [];
	const unreadCount = notifications.data?.pages[0]?.unreadCount ?? 0;

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold tracking-tight">{NOTIFICATION.title}</h1>
					<p className="text-sm text-muted-foreground">{NOTIFICATION.description}</p>
				</div>
				{unreadCount > 0 ? (
					<Button
						variant="outline"
						size="sm"
						disabled={markAllRead.isPending}
						onClick={() => void markAllRead.mutate()}
					>
						{NOTIFICATION.markAllRead}
					</Button>
				) : null}
			</div>

			{notifications.isPending ? (
				<p className="text-sm text-muted-foreground">Loading notifications…</p>
			) : null}

			{notifications.isError ? (
				<p className="text-sm text-destructive">{notifications.error.message}</p>
			) : null}

			{notifications.data && items.length === 0 ? (
				<p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
					{NOTIFICATION.empty}
				</p>
			) : null}

			<div className="space-y-3">
				{items.map((notification) => {
					const unread = notification.readAt === null;

					return (
						<Card key={notification.id} className={unread ? "border-foreground/30" : undefined}>
							<CardHeader className="space-y-2">
								<div className="flex flex-wrap items-start justify-between gap-3">
									<CardTitle className="text-base">{notification.title}</CardTitle>
									<div className="flex items-center gap-2">
										{unread ? <Badge>{NOTIFICATION.unread}</Badge> : null}
										<Badge variant="outline">{notification.type}</Badge>
									</div>
								</div>
								<CardDescription>{notification.body}</CardDescription>
							</CardHeader>
							<CardContent className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
								<span>{formatDateTime(notification.createdAt)}</span>
								<div className="flex items-center gap-2">
									{notification.roomId ? (
										<Button size="sm" variant="ghost" asChild>
											<Link to="/rooms/$roomId" params={{ roomId: notification.roomId }}>
												{NOTIFICATION.openRoom}
											</Link>
										</Button>
									) : null}
									{unread ? (
										<Button
											size="sm"
											variant="outline"
											disabled={markRead.isPending}
											onClick={() => void markRead.mutate({ id: notification.id })}
										>
											{NOTIFICATION.markRead}
										</Button>
									) : null}
								</div>
							</CardContent>
						</Card>
					);
				})}
			</div>

			{notifications.hasNextPage ? (
				<div className="flex justify-center">
					<Button
						variant="outline"
						disabled={notifications.isFetchingNextPage}
						onClick={() => void notifications.fetchNextPage()}
					>
						{notifications.isFetchingNextPage ? "Loading more…" : "Load more notifications"}
					</Button>
				</div>
			) : null}
		</div>
	);
}
