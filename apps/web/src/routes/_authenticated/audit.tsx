import { Badge } from "@app/components/ui/badge";
import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@app/components/ui/card";
import { AUDIT } from "@app/messages";
import { hasPermission, PERMISSION, ROLE, type Role } from "@app/permissions";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useAuditEvents, useSession } from "@/libs/api/queries.ts";

export const Route = createFileRoute("/_authenticated/audit")({
	component: AuditPage,
});

const roleOf = (value: string | null | undefined): Role =>
	value && (Object.values(ROLE) as readonly string[]).includes(value) ? (value as Role) : ROLE.USER;

const formatDate = (value: string): string => new Date(value).toLocaleString();

function AuditPage() {
	const session = useSession();
	const role = roleOf(session.data?.session?.user.role);
	const canAct = hasPermission(role, PERMISSION.MODERATION_ACTION);
	const twoFactorEnabled = session.data?.session?.user.twoFactorEnabled ?? false;
	const events = useAuditEvents(canAct && twoFactorEnabled);

	if (!canAct || !twoFactorEnabled) {
		return (
			<Card className="max-w-2xl">
				<CardHeader>
					<CardTitle>{AUDIT.title}</CardTitle>
					<CardDescription>{AUDIT.accessDenied}</CardDescription>
				</CardHeader>
				<CardContent>
					<Button variant="outline" asChild>
						<Link to="/moderation">{AUDIT.title}</Link>
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<div className="space-y-1">
				<h1 className="text-2xl font-semibold tracking-tight">{AUDIT.title}</h1>
				<p className="text-sm text-muted-foreground">{AUDIT.description}</p>
			</div>

			{events.isPending ? (
				<p className="text-sm text-muted-foreground">Loading audit events…</p>
			) : null}

			{events.isError ? <p className="text-sm text-destructive">{events.error.message}</p> : null}

			{events.data && events.data.items.length === 0 ? (
				<p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
					{AUDIT.empty}
				</p>
			) : null}

			<div className="space-y-3">
				{events.data?.items.map((event) => (
					<Card key={event.id}>
						<CardHeader className="space-y-2">
							<div className="flex flex-wrap items-start justify-between gap-3">
								<CardTitle className="text-base">{event.action}</CardTitle>
								<Badge variant="outline">{event.actorRole}</Badge>
							</div>
							<CardDescription>
								{AUDIT.actor}:{" "}
								{event.actor
									? `${event.actor.displayName}${event.actor.username ? ` (@${event.actor.username})` : ""}`
									: "system"}{" "}
								· {formatDate(event.createdAt)}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-2 text-sm">
							<p className="text-muted-foreground">
								{AUDIT.entity}: {event.entityType}
								{event.entityId ? ` · ${event.entityId}` : ""}
							</p>
							{event.metadata ? (
								<pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">
									{JSON.stringify(event.metadata, null, 2)}
								</pre>
							) : null}
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
