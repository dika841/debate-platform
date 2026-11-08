import { AUTH } from "@app/messages";
import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@app/components/ui/card";
import { Input } from "@app/components/ui/input";
import { Label } from "@app/components/ui/label";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { resetPassword } from "@/libs/auth/client.ts";

export type ResetPasswordSearch = {
	token?: string;
};

const validateSearch = (search: Record<string, unknown>): ResetPasswordSearch => ({
	token: typeof search.token === "string" ? search.token : undefined,
});

export const Route = createFileRoute("/_public/reset-password")({
	validateSearch,
	component: ResetPasswordPage,
});

function ResetPasswordPage() {
	const { token } = Route.useSearch();
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [done, setDone] = useState(false);
	const [pending, setPending] = useState(false);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault();
		setError(null);

		if (!token) {
			setError("This reset link is invalid or expired.");
			return;
		}

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		setPending(true);
		const result = await resetPassword({ newPassword: password, token });

		if (result.error) {
			setError(result.error.message ?? AUTH.resetFailed);
			setPending(false);
			return;
		}

		setDone(true);
		setPending(false);
	};

	return (
		<div className="mx-auto w-full max-w-md">
			<Card>
				<CardHeader>
					<CardTitle>{AUTH.resetPassword}</CardTitle>
					<CardDescription>
						{token ? AUTH.passwordHint : "This reset link is invalid or expired."}
					</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{done ? (
						<>
							<p className="text-sm text-muted-foreground">{AUTH.passwordUpdated}</p>
							<Button asChild className="w-full">
								<Link to="/login">{AUTH.signIn}</Link>
							</Button>
						</>
					) : (
						<form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
							<div className="space-y-2">
								<Label htmlFor="new-password">{AUTH.newPassword}</Label>
								<Input
									id="new-password"
									type="password"
									autoComplete="new-password"
									minLength={12}
									required
									value={password}
									onChange={(event) => setPassword(event.target.value)}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="confirm-password">{AUTH.confirmPassword}</Label>
								<Input
									id="confirm-password"
									type="password"
									autoComplete="new-password"
									minLength={12}
									required
									value={confirmPassword}
									onChange={(event) => setConfirmPassword(event.target.value)}
								/>
							</div>

							{error ? <p className="text-sm text-destructive">{error}</p> : null}

							<Button type="submit" className="w-full" disabled={pending || !token}>
								{pending ? "Updating…" : AUTH.resetPassword}
							</Button>
						</form>
					)}

					<p className="text-center text-sm text-muted-foreground">
						<Link to="/login" className="text-foreground underline-offset-4 hover:underline">
							{AUTH.signIn}
						</Link>
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
