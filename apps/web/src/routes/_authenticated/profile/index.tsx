import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@app/components/ui/card";
import { createFileRoute } from "@tanstack/react-router";
import { useProfile } from "@/libs/api/queries.ts";
import { AccountCard } from "@/routes/_authenticated/profile/_components/account-card.tsx";
import { DeleteAccountCard } from "@/routes/_authenticated/profile/_components/delete-account-card.tsx";
import { ProfileForm } from "@/routes/_authenticated/profile/_components/profile-form.tsx";
import { SecurityCard } from "@/routes/_authenticated/profile/_components/security-card.tsx";

export const Route = createFileRoute("/_authenticated/profile/")({
	component: ProfilePage,
});

function ProfilePage() {
	const profile = useProfile();

	if (profile.isPending) {
		return <p className="text-sm text-muted-foreground">Loading profile…</p>;
	}

	if (profile.isError) {
		return (
			<Card className="max-w-2xl">
				<CardHeader>
					<CardTitle>Profile unavailable</CardTitle>
					<CardDescription>{profile.error.message}</CardDescription>
				</CardHeader>
				<CardContent>
					<Button variant="outline" onClick={() => void profile.refetch()}>
						Try again
					</Button>
				</CardContent>
			</Card>
		);
	}

	return (
		<div className="grid max-w-4xl gap-6 md:grid-cols-[1.2fr_0.8fr]">
			<ProfileForm profile={profile.data} />
			<AccountCard profile={profile.data} />
			<SecurityCard profile={profile.data} />
			<DeleteAccountCard />
		</div>
	);
}
