import type { UserProfile } from "@app/api-contract";
import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@app/components/ui/card";
import { AUTH } from "@app/messages";
import { useState } from "react";
import { revokeOtherSessions } from "@/libs/auth/client.ts";
import { ChangePasswordForm } from "@/routes/_authenticated/profile/_components/change-password-form.tsx";
import { TwoFactorSection } from "@/routes/_authenticated/profile/_components/two-factor-section.tsx";

type Feedback = {
	readonly message: string;
	readonly error: boolean;
};

export const SecurityCard = ({ profile }: { profile: UserProfile }) => {
	const [revoking, setRevoking] = useState(false);
	const [feedback, setFeedback] = useState<Feedback | null>(null);

	const handleRevokeOtherSessions = async (): Promise<void> => {
		setFeedback(null);
		setRevoking(true);
		const result = await revokeOtherSessions();
		setRevoking(false);

		if (result.error) {
			setFeedback({
				message: result.error.message ?? AUTH.changePasswordFailed,
				error: true,
			});
			return;
		}

		setFeedback({ message: AUTH.otherSessionsRevoked, error: false });
	};

	return (
		<Card className="md:col-span-2">
			<CardHeader>
				<CardTitle>{AUTH.security}</CardTitle>
				<CardDescription>{AUTH.passwordHint}</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				<ChangePasswordForm />

				<div className="flex flex-wrap items-center gap-2">
					<Button
						type="button"
						variant="outline"
						disabled={revoking}
						onClick={() => void handleRevokeOtherSessions()}
					>
						{revoking ? AUTH.updatingPassword : AUTH.signOutOtherDevices}
					</Button>
					{feedback ? (
						<p
							className={
								feedback.error ? "text-sm text-destructive" : "text-sm text-muted-foreground"
							}
						>
							{feedback.message}
						</p>
					) : null}
				</div>

				<TwoFactorSection profile={profile} />
			</CardContent>
		</Card>
	);
};
