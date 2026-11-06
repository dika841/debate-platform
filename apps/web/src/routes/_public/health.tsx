import { HEALTH } from "@app/messages";
import { Badge } from "@app/components/ui/badge";
import { Button } from "@app/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle
} from "@app/components/ui/card";
import { createFileRoute } from "@tanstack/react-router";
import { useHealth } from "@/libs/api/queries.ts";

export const Route = createFileRoute("/_public/health")({
	component: HealthPage
});

function HealthPage() {
	const health = useHealth();

	return (
		<Card className="max-w-2xl">
			<CardHeader>
				<CardTitle>{HEALTH.title}</CardTitle>
				<CardDescription>Live check of the API and database connection.</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4 text-sm">
				{health.isPending ? <p className="text-muted-foreground">{HEALTH.loading}</p> : null}

				{health.isError ? (
					<div className="space-y-3">
						<p className="text-destructive">{HEALTH.error}</p>
						<Button size="sm" variant="outline" onClick={() => void health.refetch()}>
							{HEALTH.retry}
						</Button>
					</div>
				) : null}

				{health.data ? (
					<dl className="grid gap-3">
						<div className="flex items-center justify-between gap-4">
							<dt className="text-muted-foreground">{HEALTH.status}</dt>
							<dd>
								<Badge variant={health.data.status === "ok" ? "secondary" : "destructive"}>
									{health.data.status}
								</Badge>
							</dd>
						</div>
						<div className="flex items-center justify-between gap-4">
							<dt className="text-muted-foreground">{HEALTH.api}</dt>
							<dd>{health.data.service}</dd>
						</div>
						<div className="flex items-center justify-between gap-4">
							<dt className="text-muted-foreground">{HEALTH.database}</dt>
							<dd>
								<Badge variant={health.data.database === "up" ? "secondary" : "destructive"}>
									{health.data.database}
								</Badge>
							</dd>
						</div>
						<div className="flex items-center justify-between gap-4">
							<dt className="text-muted-foreground">{HEALTH.checkedAt}</dt>
							<dd>{new Date(health.data.time).toLocaleString()}</dd>
						</div>
					</dl>
				) : null}
			</CardContent>
		</Card>
	);
}
