import { APP, HEALTH, NAV } from "@app/messages";
import { Badge } from "@app/components/ui/badge";
import { Button } from "@app/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@app/components/ui/card";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useHealth } from "@/libs/api/queries.ts";

export const Route = createFileRoute("/_public/")({
	component: HomePage
});

function HomePage() {
	const health = useHealth();

	return (
		<div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
			<section className="space-y-6">
				<Badge variant="outline">MVP foundation</Badge>
				<h1 className="max-w-2xl text-4xl font-semibold tracking-tight md:text-5xl">
					{APP.name}
				</h1>
				<p className="max-w-xl text-lg text-muted-foreground">{APP.tagline}</p>
				<p className="max-w-xl text-sm text-muted-foreground">
					Structured PRO and CONTRA debates with automatic team assignment, async rounds and
					spectator evaluation.
				</p>

				<div className="flex flex-wrap gap-3">
					<Button asChild>
						<Link to="/health">{NAV.explore}</Link>
					</Button>
					<Button variant="outline" asChild>
						<Link to="/health">Check system health</Link>
					</Button>
				</div>
			</section>

			<Card>
				<CardHeader>
					<CardTitle>{HEALTH.title}</CardTitle>
					<CardDescription>Web → oRPC → Hono → PostgreSQL</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					{health.isPending ? (
						<p className="text-muted-foreground">{HEALTH.loading}</p>
					) : null}

					{health.isError ? (
						<div className="space-y-3">
							<p className="text-destructive">{HEALTH.error}</p>
							<Button size="sm" variant="outline" onClick={() => void health.refetch()}>
								{HEALTH.retry}
							</Button>
						</div>
					) : null}

					{health.data ? (
						<>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">{HEALTH.api}</span>
								<Badge variant={health.data.status === "ok" ? "secondary" : "destructive"}>
									{health.data.status}
								</Badge>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">{HEALTH.database}</span>
								<Badge variant={health.data.database === "up" ? "secondary" : "destructive"}>
									{health.data.database}
								</Badge>
							</div>
							<div className="flex items-center justify-between">
								<span className="text-muted-foreground">Version</span>
								<span>{health.data.version}</span>
							</div>
							<div className="space-y-1 border-t border-border/60 pt-3 text-xs text-muted-foreground">
								<p className="uppercase tracking-wide">{HEALTH.checkedAt}</p>
								<p>{new Date(health.data.time).toLocaleString()}</p>
							</div>
						</>
					) : null}
				</CardContent>
			</Card>
		</div>
	);
}
