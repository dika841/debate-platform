import { AUTH } from "@app/messages";
import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@app/components/ui/card";
import { Input } from "@app/components/ui/input";
import { Label } from "@app/components/ui/label";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { signUp, getSession } from "@/libs/auth/client.ts";
import { useInvalidateAccount } from "@/libs/api/queries.ts";

export const Route = createFileRoute("/_public/register")({
	component: RegisterPage,
});

function RegisterPage() {
	const navigate = useNavigate();
	const invalidate = useInvalidateAccount();
	const [name, setName] = useState("");
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [info, setInfo] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault();
		setError(null);
		setInfo(null);

		if (password !== confirmPassword) {
			setError("Passwords do not match");
			return;
		}

		setPending(true);
		const result = await signUp.email({ name, email, password });

		if (result.error) {
			setError(result.error.message ?? "Unable to create an account");
			setPending(false);
			return;
		}

		const session = await getSession();

		if (!session.data?.session) {
			setInfo(AUTH.verifyEmailSent);
			setPending(false);
			return;
		}

		await invalidate();
		setPending(false);
		await navigate({ to: "/profile" });
	};

	return (
		<div className="mx-auto w-full max-w-md">
			<Card>
				<CardHeader>
					<CardTitle>{AUTH.signUp}</CardTitle>
					<CardDescription>Create an account to host and join debates.</CardDescription>
				</CardHeader>
				<CardContent>
					<form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
						<div className="space-y-2">
							<Label htmlFor="name">Display name</Label>
							<Input
								id="name"
								autoComplete="name"
								required
								value={name}
								onChange={(event) => setName(event.target.value)}
							/>
						</div>

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

						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								autoComplete="new-password"
								minLength={12}
								required
								value={password}
								onChange={(event) => setPassword(event.target.value)}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="confirm-password">Confirm password</Label>
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
						{info ? <p className="text-sm text-muted-foreground">{info}</p> : null}

						<Button type="submit" className="w-full" disabled={pending}>
							{pending ? "Creating account…" : AUTH.signUp}
						</Button>
					</form>

					<p className="mt-4 text-center text-sm text-muted-foreground">
						Already registered?{" "}
						<Link to="/login" className="text-foreground underline-offset-4 hover:underline">
							{AUTH.signIn}
						</Link>
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
