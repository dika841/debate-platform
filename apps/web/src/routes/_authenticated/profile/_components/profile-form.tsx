import type { UserProfile } from "@app/api-contract";
import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@app/components/ui/card";
import { FieldError, hasFieldError } from "@app/components/ui/field-error";
import { Input } from "@app/components/ui/input";
import { Label } from "@app/components/ui/label";
import { Textarea } from "@app/components/ui/textarea";
import { useForm } from "@tanstack/react-form";
import { useState } from "react";
import { profileFormSchema, type ProfileFormInput } from "@/libs/auth/account-schema.ts";
import { useUpdateProfile } from "@/libs/api/queries.ts";

const fromProfile = (profile: UserProfile): ProfileFormInput => ({
	displayName: profile.profile.displayName,
	username: profile.profile.username ?? "",
	bio: profile.profile.bio ?? "",
	avatarUrl: profile.profile.avatarUrl ?? "",
});

type Feedback = {
	readonly message: string;
	readonly error: boolean;
};

export const ProfileForm = ({ profile }: { profile: UserProfile }) => {
	const update = useUpdateProfile();
	const [feedback, setFeedback] = useState<Feedback | null>(null);

	const form = useForm({
		defaultValues: fromProfile(profile),
		validators: {
			onChange: profileFormSchema,
			onSubmit: profileFormSchema,
		},
		onSubmit: async ({ value }) => {
			setFeedback(null);

			try {
				await update.mutateAsync({
					displayName: value.displayName.trim(),
					username: value.username.trim() ? value.username.trim().toLowerCase() : undefined,
					bio: value.bio.trim() ? value.bio.trim() : null,
					avatarUrl: value.avatarUrl.trim() ? value.avatarUrl.trim() : null,
				});
				setFeedback({ message: "Profile updated", error: false });
			} catch (error) {
				setFeedback({
					message: error instanceof Error ? error.message : "Unable to update profile",
					error: true,
				});
			}
		},
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>Profile</CardTitle>
				<CardDescription>How other people see you across debate rooms.</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					className="space-y-4"
					onSubmit={(event) => {
						event.preventDefault();
						void form.handleSubmit();
					}}
				>
					<form.Field name="displayName">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Display name</Label>
								<Input
									id={field.name}
									name={field.name}
									aria-invalid={hasFieldError(field.state.meta.errorMap)}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
								<FieldError errorMap={field.state.meta.errorMap} />
							</div>
						)}
					</form.Field>

					<form.Field name="username">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Username</Label>
								<Input
									id={field.name}
									name={field.name}
									placeholder="lowercase_username"
									aria-invalid={hasFieldError(field.state.meta.errorMap)}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
								<FieldError errorMap={field.state.meta.errorMap} />
							</div>
						)}
					</form.Field>

					<form.Field name="bio">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Bio</Label>
								<Textarea
									id={field.name}
									name={field.name}
									rows={4}
									placeholder="Short description of your debate interests"
									aria-invalid={hasFieldError(field.state.meta.errorMap)}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
								<FieldError errorMap={field.state.meta.errorMap} />
							</div>
						)}
					</form.Field>

					<form.Field name="avatarUrl">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor={field.name}>Avatar URL</Label>
								<Input
									id={field.name}
									name={field.name}
									type="url"
									placeholder="https://example.com/avatar.png"
									aria-invalid={hasFieldError(field.state.meta.errorMap)}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
								<FieldError errorMap={field.state.meta.errorMap} />
							</div>
						)}
					</form.Field>

					{feedback ? (
						<p
							className={
								feedback.error ? "text-sm text-destructive" : "text-sm text-muted-foreground"
							}
						>
							{feedback.message}
						</p>
					) : null}

					<form.Subscribe selector={(state) => state.isSubmitting}>
						{(isSubmitting) => (
							<Button type="submit" disabled={isSubmitting}>
								{isSubmitting ? "Saving…" : "Save profile"}
							</Button>
						)}
					</form.Subscribe>
				</form>
			</CardContent>
		</Card>
	);
};
