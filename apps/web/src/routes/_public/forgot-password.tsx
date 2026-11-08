import { AUTH } from "@app/messages";
import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@app/components/ui/card";
import { Input } from "@app/components/ui/input";
import { Label } from "@app/components/ui/label";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { requestPasswordReset } from "@/libs/auth/client.ts";

export const Route = createFileRoute("/_public/forgot-password")({
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	const [email, setEmail] = useState("");
	const [sent, setSent] = useState(false);
	const [pending, setPending] = useState(false);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault();
		setPending(true);

		try {
			await requestPasswordReset({
				email,
				redirectTo: `${window.location.origin}/reset-password`,
			});
		} finally {
			// Always show the same result to avoid account enumeration.
			setSent(true);
			setPending(false);
		}
	};

	return (
		<div className="mx-auto w-full max-w-md">
			<Card>
				<CardHeader>
					<CardTitle>{AUTH.resetPassword}</CardTitle>
					<CardDescription>{AUTH.resetRequested}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{sent ? (
						<p className="text-sm text-muted-foreground">{AUTH.resetRequested}</p>
					) : (
						<form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
							<div className="space-y-2">
								<Label htmlFor="email">Email</Label>
								<Input
									id="email"
									type="email"
									autoComplete="email"
									required
									value={email}
									onChange={(event) => setEmail(event.target.value)}
								/>
							</div>
							<Button type="submit" className="w-full" disabled={pending}>
								{pending ? "Sending…" : AUTH.resetPassword}
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
