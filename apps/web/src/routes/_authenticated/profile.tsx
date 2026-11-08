import { AUTH } from "@app/messages";
import { Badge } from "@app/components/ui/badge";
import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@app/components/ui/card";
import { Input } from "@app/components/ui/input";
import { Label } from "@app/components/ui/label";
import { Textarea } from "@app/components/ui/textarea";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import {
	changePassword,
	deleteUser,
	revokeOtherSessions,
	signOut,
	twoFactor,
} from "@/libs/auth/client.ts";
import { apiUrl } from "@/libs/orpc/index.ts";
import { useInvalidateAccount, useProfile, useUpdateProfile } from "@/libs/api/queries.ts";

export const Route = createFileRoute("/_authenticated/profile")({
	component: ProfilePage,
});

type ProfileForm = {
	displayName: string;
	username: string;
	bio: string;
	avatarUrl: string;
};

const EMPTY_FORM: ProfileForm = {
	displayName: "",
	username: "",
	bio: "",
	avatarUrl: "",
};

function ProfilePage() {
	const profile = useProfile();
	const update = useUpdateProfile();
	const invalidateAccount = useInvalidateAccount();
	const navigate = useNavigate();
	const [form, setForm] = useState<ProfileForm>(EMPTY_FORM);
	const [feedback, setFeedback] = useState<string | null>(null);
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [securityFeedback, setSecurityFeedback] = useState<string | null>(null);
	const [securityPending, setSecurityPending] = useState(false);
	const [revoking, setRevoking] = useState(false);
	const [deletePassword, setDeletePassword] = useState("");
	const [deleteConfirmation, setDeleteConfirmation] = useState("");
	const [deleteFeedback, setDeleteFeedback] = useState<string | null>(null);
	const [deleting, setDeleting] = useState(false);
	const [twoFactorSetup, setTwoFactorSetup] = useState<{
		uri: string;
		backupCodes: string[];
	} | null>(null);
	const [twoFactorCode, setTwoFactorCode] = useState("");
	const [twoFactorFeedback, setTwoFactorFeedback] = useState<string | null>(null);
	const [twoFactorPending, setTwoFactorPending] = useState(false);

	useEffect(() => {
		if (!profile.data) {
			return;
		}

		setForm({
			displayName: profile.data.profile.displayName,
			username: profile.data.profile.username ?? "",
			bio: profile.data.profile.bio ?? "",
			avatarUrl: profile.data.profile.avatarUrl ?? "",
		});
	}, [profile.data]);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault();
		setFeedback(null);

		try {
			await update.mutateAsync({
				displayName: form.displayName.trim(),
				username: form.username.trim() ? form.username.trim().toLowerCase() : undefined,
				bio: form.bio.trim() ? form.bio.trim() : null,
				avatarUrl: form.avatarUrl.trim() ? form.avatarUrl.trim() : null,
			});
			setFeedback("Profile updated");
		} catch (error) {
			setFeedback(error instanceof Error ? error.message : "Unable to update profile");
		}
	};

	const handleChangePassword = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault();
		setSecurityFeedback(null);

		if (newPassword !== confirmPassword) {
			setSecurityFeedback("Passwords do not match");
			return;
		}

		setSecurityPending(true);
		const result = await changePassword({
			currentPassword,
			newPassword,
			revokeOtherSessions: true,
		});
		setSecurityPending(false);

		if (result.error) {
			setSecurityFeedback(result.error.message ?? AUTH.changePasswordFailed);
			return;
		}

		setCurrentPassword("");
		setNewPassword("");
		setConfirmPassword("");
		setSecurityFeedback(AUTH.passwordUpdated);
	};

	const handleRevokeOtherSessions = async (): Promise<void> => {
		setSecurityFeedback(null);
		setRevoking(true);
		const result = await revokeOtherSessions();
		setRevoking(false);

		if (result.error) {
			setSecurityFeedback(result.error.message ?? AUTH.changePasswordFailed);
			return;
		}

		setSecurityFeedback(AUTH.otherSessionsRevoked);
	};

	const twoFactorEnabled = Boolean(profile.data?.twoFactorEnabled);

	const handleEnableTwoFactor = async (): Promise<void> => {
		setTwoFactorFeedback(null);

		if (!currentPassword) {
			setTwoFactorFeedback("Enter your current password first.");
			return;
		}

		setTwoFactorPending(true);
		const result = await twoFactor.enable({ password: currentPassword });
		setTwoFactorPending(false);

		if (result.error) {
			setTwoFactorFeedback(result.error.message ?? AUTH.twoFactorFailed);
			return;
		}

		if (result.data?.method !== "totp") {
			setTwoFactorFeedback(AUTH.twoFactorFailed);
			return;
		}

		setTwoFactorSetup({
			uri: result.data.totpURI,
			backupCodes: result.data.backupCodes,
		});
	};

	const handleVerifyTwoFactor = async (): Promise<void> => {
		setTwoFactorFeedback(null);
		setTwoFactorPending(true);
		const result = await twoFactor.verifyTotp({ code: twoFactorCode });
		setTwoFactorPending(false);

		if (result.error) {
			setTwoFactorFeedback(result.error.message ?? AUTH.twoFactorFailed);
			return;
		}

		setTwoFactorSetup(null);
		setTwoFactorCode("");
		setTwoFactorFeedback(AUTH.twoFactorEnabled);
		await Promise.all([profile.refetch(), invalidateAccount()]);
	};

	const handleDisableTwoFactor = async (): Promise<void> => {
		setTwoFactorFeedback(null);

		if (!currentPassword) {
			setTwoFactorFeedback("Enter your current password first.");
			return;
		}

		setTwoFactorPending(true);
		const result = await twoFactor.disable({ password: currentPassword });
		setTwoFactorPending(false);

		if (result.error) {
			setTwoFactorFeedback(result.error.message ?? AUTH.twoFactorFailed);
			return;
		}

		setTwoFactorFeedback(AUTH.twoFactorDisabled);
		await Promise.all([profile.refetch(), invalidateAccount()]);
	};

	const handleDeleteAccount = async (): Promise<void> => {
		setDeleteFeedback(null);

		if (deleteConfirmation !== AUTH.deleteConfirmationValue) {
			setDeleteFeedback(AUTH.deleteConfirmation);
			return;
		}

		setDeleting(true);
		const result = await deleteUser({ password: deletePassword });
		setDeleting(false);

		if (result.error) {
			setDeleteFeedback(result.error.message ?? AUTH.deleteAccountFailed);
			return;
		}

		await signOut();
		await navigate({ to: "/" });
	};

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
			<Card>
				<CardHeader>
					<CardTitle>Profile</CardTitle>
					<CardDescription>How other people see you across debate rooms.</CardDescription>
				</CardHeader>
				<CardContent>
					<form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
						<div className="space-y-2">
							<Label htmlFor="displayName">Display name</Label>
							<Input
								id="displayName"
								value={form.displayName}
								onChange={(event) =>
									setForm((current) => ({ ...current, displayName: event.target.value }))
								}
								required
								maxLength={80}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="username">Username</Label>
							<Input
								id="username"
								value={form.username}
								onChange={(event) =>
									setForm((current) => ({ ...current, username: event.target.value }))
								}
								placeholder="lowercase_username"
								minLength={3}
								maxLength={30}
								pattern="[a-z0-9_]{3,30}"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="bio">Bio</Label>
							<Textarea
								id="bio"
								value={form.bio}
								onChange={(event) =>
									setForm((current) => ({ ...current, bio: event.target.value }))
								}
								rows={4}
								maxLength={500}
								placeholder="Short description of your debate interests"
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="avatarUrl">Avatar URL</Label>
							<Input
								id="avatarUrl"
								type="url"
								value={form.avatarUrl}
								onChange={(event) =>
									setForm((current) => ({ ...current, avatarUrl: event.target.value }))
								}
								placeholder="https://example.com/avatar.png"
							/>
						</div>

						{feedback ? (
							<p
								className={
									update.isError ? "text-sm text-destructive" : "text-sm text-muted-foreground"
								}
							>
								{feedback}
							</p>
						) : null}

						<Button type="submit" disabled={update.isPending}>
							{update.isPending ? "Saving…" : "Save profile"}
						</Button>
					</form>
				</CardContent>
			</Card>

			<Card className="h-fit">
				<CardHeader>
					<CardTitle>Account</CardTitle>
					<CardDescription>Identity managed by Better Auth.</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4 text-sm">
					<div className="flex items-center justify-between gap-3">
						<span className="text-muted-foreground">Name</span>
						<span>{profile.data.name}</span>
					</div>
					<div className="flex items-center justify-between gap-3">
						<span className="text-muted-foreground">Email</span>
						<span className="truncate">{profile.data.email}</span>
					</div>
					<div className="flex items-center justify-between gap-3">
						<span className="text-muted-foreground">Role</span>
						<Badge variant="secondary">{profile.data.role}</Badge>
					</div>
					<div className="flex items-center justify-between gap-3">
						<span className="text-muted-foreground">{AUTH.sessionAnonymous}</span>
						<span>{profile.data.profile.username ?? "—"}</span>
					</div>
				</CardContent>
			</Card>
			<Card className="md:col-span-2">
				<CardHeader>
					<CardTitle>{AUTH.security}</CardTitle>
					<CardDescription>{AUTH.passwordHint}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<form
						className="grid gap-4 sm:grid-cols-3"
						onSubmit={(event) => void handleChangePassword(event)}
					>
						<div className="space-y-2">
							<Label htmlFor="currentPassword">{AUTH.currentPassword}</Label>
							<Input
								id="currentPassword"
								type="password"
								autoComplete="current-password"
								required
								value={currentPassword}
								onChange={(event) => setCurrentPassword(event.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="newPassword">{AUTH.newPassword}</Label>
							<Input
								id="newPassword"
								type="password"
								autoComplete="new-password"
								minLength={12}
								required
								value={newPassword}
								onChange={(event) => setNewPassword(event.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="confirmNewPassword">{AUTH.confirmPassword}</Label>
							<Input
								id="confirmNewPassword"
								type="password"
								autoComplete="new-password"
								minLength={12}
								required
								value={confirmPassword}
								onChange={(event) => setConfirmPassword(event.target.value)}
							/>
						</div>

						{securityFeedback ? (
							<p className="text-sm text-muted-foreground sm:col-span-3">{securityFeedback}</p>
						) : null}

						<div className="flex flex-wrap gap-2 sm:col-span-3">
							<Button type="submit" disabled={securityPending}>
								{securityPending ? AUTH.updatingPassword : AUTH.updatePassword}
							</Button>
							<Button
								type="button"
								variant="outline"
								disabled={revoking}
								onClick={() => void handleRevokeOtherSessions()}
							>
								{revoking ? AUTH.updatingPassword : AUTH.signOutOtherDevices}
							</Button>
						</div>
					</form>

					<div className="space-y-3 border-t border-border/60 pt-4">
						<div className="flex flex-wrap items-center justify-between gap-2">
							<h3 className="text-sm font-semibold">{AUTH.twoFactor}</h3>
							<Badge variant={twoFactorEnabled ? "secondary" : "outline"}>
								{twoFactorEnabled ? AUTH.twoFactorEnabled : AUTH.twoFactorDisabled}
							</Badge>
						</div>

						{twoFactorFeedback ? (
							<p className="text-sm text-muted-foreground">{twoFactorFeedback}</p>
						) : null}

						{!twoFactorEnabled &&
						(profile.data.role === "MODERATOR" || profile.data.role === "ADMIN") ? (
							<p className="text-sm text-destructive">{AUTH.mfaRequiredForRole}</p>
						) : null}

						{twoFactorSetup ? (
							<div className="space-y-3 rounded-md border border-border/70 p-3 text-sm">
								<p className="text-muted-foreground">{AUTH.twoFactorUri}</p>
								<code className="block break-all rounded bg-muted p-2 text-xs">
									{twoFactorSetup.uri}
								</code>
								<div>
									<p className="text-muted-foreground">{AUTH.backupCodes}</p>
									<pre className="mt-1 whitespace-pre-wrap text-xs">
										{twoFactorSetup.backupCodes.join("\n")}
									</pre>
								</div>
								<div className="space-y-2">
									<Label htmlFor="twoFactorSetupCode">{AUTH.twoFactorCode}</Label>
									<Input
										id="twoFactorSetupCode"
										inputMode="numeric"
										autoComplete="one-time-code"
										value={twoFactorCode}
										onChange={(event) => setTwoFactorCode(event.target.value)}
									/>
								</div>
								<Button
									type="button"
									size="sm"
									disabled={twoFactorPending}
									onClick={() => void handleVerifyTwoFactor()}
								>
									{twoFactorPending ? AUTH.verifyingCode : AUTH.verifyCode}
								</Button>
							</div>
						) : twoFactorEnabled ? (
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={twoFactorPending}
								onClick={() => void handleDisableTwoFactor()}
							>
								{twoFactorPending ? AUTH.updatingPassword : AUTH.disableTwoFactor}
							</Button>
						) : (
							<Button
								type="button"
								variant="outline"
								size="sm"
								disabled={twoFactorPending}
								onClick={() => void handleEnableTwoFactor()}
							>
								{twoFactorPending ? AUTH.updatingPassword : AUTH.enableTwoFactor}
							</Button>
						)}
					</div>
				</CardContent>
			</Card>

			<Card className="md:col-span-2">
				<CardHeader>
					<CardTitle>{AUTH.deleteAccount}</CardTitle>
					<CardDescription>{AUTH.deleteAccountHint}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="flex flex-wrap gap-2">
						<Button variant="outline" asChild>
							<a href={apiUrl("/api/me/export")} download>
								{AUTH.downloadData}
							</a>
						</Button>
					</div>

					<div className="grid gap-4 sm:grid-cols-2">
						<div className="space-y-2">
							<Label htmlFor="deletePassword">{AUTH.currentPassword}</Label>
							<Input
								id="deletePassword"
								type="password"
								autoComplete="current-password"
								value={deletePassword}
								onChange={(event) => setDeletePassword(event.target.value)}
							/>
						</div>
						<div className="space-y-2">
							<Label htmlFor="deleteConfirmation">{AUTH.deleteConfirmation}</Label>
							<Input
								id="deleteConfirmation"
								value={deleteConfirmation}
								onChange={(event) => setDeleteConfirmation(event.target.value)}
								placeholder={AUTH.deleteConfirmationValue}
							/>
						</div>
					</div>

					{deleteFeedback ? (
						<p className="text-sm text-muted-foreground">{deleteFeedback}</p>
					) : null}

					<Button
						type="button"
						variant="destructive"
						disabled={deleting}
						onClick={() => void handleDeleteAccount()}
					>
						{deleting ? AUTH.deletingAccount : AUTH.deleteAccount}
					</Button>
				</CardContent>
			</Card>
		</div>
	);
}
