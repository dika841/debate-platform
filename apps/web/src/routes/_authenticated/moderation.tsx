import { Badge } from "@app/components/ui/badge";
import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@app/components/ui/card";
import { AUTH, MODERATION } from "@app/messages";
import { hasPermission, PERMISSION, ROLE, type Role } from "@app/permissions";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useReports, useResolveReport, useSession } from "@/libs/api/queries.ts";

export const Route = createFileRoute("/_authenticated/moderation")({
	component: ModerationPage,
});

type ReportStatusFilter = "PENDING" | "ACTIONED" | "DISMISSED";

const STATUS_FILTERS: ReportStatusFilter[] = ["PENDING", "ACTIONED", "DISMISSED"];

const roleOf = (value: string | null | undefined): Role =>
	value && (Object.values(ROLE) as readonly string[]).includes(value) ? (value as Role) : ROLE.USER;

const formatDate = (value: string): string => new Date(value).toLocaleString();

function ModerationPage() {
	const session = useSession();
	const [status, setStatus] = useState<ReportStatusFilter>("PENDING");
	const role = roleOf(session.data?.session?.user.role);
	const canReview = hasPermission(role, PERMISSION.MODERATION_REVIEW);
	const canAct = hasPermission(role, PERMISSION.MODERATION_ACTION);
	const twoFactorEnabled = session.data?.session?.user.twoFactorEnabled ?? false;
	const reports = useReports(status, canReview && twoFactorEnabled);
	const resolve = useResolveReport();

	if (!canReview) {
		return (
			<Card className="max-w-2xl">
				<CardHeader>
					<CardTitle>{MODERATION.title}</CardTitle>
					<CardDescription>{MODERATION.accessDenied}</CardDescription>
				</CardHeader>
			</Card>
		);
	}

	if (!twoFactorEnabled) {
		return (
			<Card className="max-w-2xl">
				<CardHeader>
					<CardTitle>{MODERATION.title}</CardTitle>
					<CardDescription>{MODERATION.mfaRequired}</CardDescription>
				</CardHeader>
				<CardContent>
					<Button asChild>
						<Link to="/profile">{AUTH.enableTwoFactor}</Link>
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="space-y-6">
			<div className="flex flex-wrap items-end justify-between gap-3">
				<div className="space-y-1">
					<h1 className="text-2xl font-semibold tracking-tight">{MODERATION.title}</h1>
					<p className="text-sm text-muted-foreground">{MODERATION.description}</p>
				</div>
				{canAct ? (
					<Button variant="outline" asChild>
						<Link to="/audit">{MODERATION.auditLink}</Link>
					</Button>
				) : null}
			</div>

			<div className="flex flex-wrap gap-2">
				{STATUS_FILTERS.map((value) => (
					<Button
						key={value}
						size="sm"
						variant={value === status ? "default" : "outline"}
						onClick={() => setStatus(value)}
					>
						{MODERATION.filter[value]}
					</Button>
				))}
			</div>

			{resolve.error?.message ? (
				<p className="text-sm text-destructive">{resolve.error.message}</p>
			) : null}

			{reports.isPending ? <p className="text-sm text-muted-foreground">Loading reports…</p> : null}

			{reports.isError ? <p className="text-sm text-destructive">{reports.error.message}</p> : null}

			{reports.data && reports.data.items.length === 0 ? (
				<p className="rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
					{MODERATION.empty}
				</p>
			) : null}

			<div className="space-y-4">
				{reports.data?.items.map((report) => (
					<Card key={report.id}>
						<CardHeader className="space-y-2">
							<div className="flex flex-wrap items-start justify-between gap-3">
								<CardTitle className="text-base">
									<Link
										to="/rooms/$roomId"
										params={{ roomId: report.room.id }}
										className="hover:underline"
									>
										{report.room.title}
									</Link>
								</CardTitle>
								<Badge
									variant={
										report.status === "PENDING"
											? "default"
											: report.status === "ACTIONED"
												? "secondary"
												: "outline"
									}
								>
									{MODERATION.filter[report.status]}
								</Badge>
							</div>
							<CardDescription>
								{report.category} · {MODERATION.reporter}: {report.reporter.displayName}
								{report.reporter.username ? ` (@${report.reporter.username})` : ""}
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3 text-sm">
							<p className="whitespace-pre-line">{report.details}</p>
							<p className="text-xs text-muted-foreground">
								{formatDate(report.createdAt)}
								{report.resolvedAt
									? ` · ${MODERATION.resolved}: ${formatDate(report.resolvedAt)}`
									: ""}
							</p>
							{report.resolutionNote ? (
								<p className="text-xs text-muted-foreground">
									{MODERATION.note}: {report.resolutionNote}
								</p>
							) : null}

							{canAct && report.status === "PENDING" ? (
								<div className="flex flex-wrap gap-2">
									<Button
										size="sm"
										disabled={resolve.isPending}
										onClick={() =>
											void resolve.mutate({
												reportId: report.id,
												status: "ACTIONED",
											})
										}
									>
										{resolve.isPending ? MODERATION.resolving : MODERATION.action}
									</Button>
									<Button
										size="sm"
										variant="outline"
										disabled={resolve.isPending}
										onClick={() =>
											void resolve.mutate({
												reportId: report.id,
												status: "DISMISSED",
											})
										}
									>
										{resolve.isPending ? MODERATION.resolving : MODERATION.dismiss}
									</Button>
								</div>
							) : null}
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
