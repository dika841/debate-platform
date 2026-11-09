import type { UserProfile } from "@app/api-contract";
import { Badge } from "@app/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@app/components/ui/card";
import { AUTH } from "@app/messages";

export const AccountCard = ({ profile }: { profile: UserProfile }) => (
	<Card className="h-fit">
		<CardHeader>
			<CardTitle>Account</CardTitle>
			<CardDescription>Identity managed by Better Auth.</CardDescription>
		</CardHeader>
		<CardContent className="space-y-4 text-sm">
			<div className="flex items-center justify-between gap-3">
				<span className="text-muted-foreground">Name</span>
				<span>{profile.name}</span>
			</div>
			<div className="flex items-center justify-between gap-3">
				<span className="text-muted-foreground">Email</span>
				<span className="truncate">{profile.email}</span>
			</div>
			<div className="flex items-center justify-between gap-3">
				<span className="text-muted-foreground">Role</span>
				<Badge variant="secondary">{profile.role}</Badge>
			</div>
			<div className="flex items-center justify-between gap-3">
				<span className="text-muted-foreground">{AUTH.sessionAnonymous}</span>
				<span>{profile.profile.username ?? "—"}</span>
			</div>
		</CardContent>
	</Card>
);
