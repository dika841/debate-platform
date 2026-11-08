import { AUTH } from "@app/messages";
import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@app/components/ui/card";
import { Input } from "@app/components/ui/input";
import { Label } from "@app/components/ui/label";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { signIn } from "@/libs/auth/client.ts";
import { safeInternalPath } from "@/libs/navigation.ts";
import { useInvalidateAccount } from "@/libs/api/queries.ts";

export type LoginSearch = {
	redirect?: string;
};

const validateSearch = (search: Record<string, unknown>): LoginSearch => ({
	redirect: typeof search.redirect === "string" ? search.redirect : undefined,
});

export const Route = createFileRoute("/_public/login")({
	validateSearch,
	component: LoginPage,
});

function LoginPage() {
	const navigate = useNavigate();
	const invalidate = useInvalidateAccount();
	const search = Route.useSearch();
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [pending, setPending] = useState(false);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault();
		setError(null);
		setPending(true);

		const result = await signIn.email({ email, password });

		if (result.error) {
			setError(result.error.message ?? "Unable to sign in");
			setPending(false);
			return;
		}

		await invalidate();
		setPending(false);
		await navigate({ to: safeInternalPath(search.redirect) });
	};

	return (
		<div className="mx-auto w-full max-w-md">
			<Card>
				<CardHeader>
					<CardTitle>{AUTH.signIn}</CardTitle>
					<CardDescription>Use your email and password to continue.</CardDescription>
				</CardHeader>
				<CardContent>
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

						<div className="space-y-2">
							<Label htmlFor="password">Password</Label>
							<Input
								id="password"
								type="password"
								autoComplete="current-password"
								required
								value={password}
								onChange={(event) => setPassword(event.target.value)}
							/>
						</div>

						{error ? <p className="text-sm text-destructive">{error}</p> : null}

						<Button type="submit" className="w-full" disabled={pending}>
							{pending ? "Signing in…" : AUTH.signIn}
						</Button>
					</form>

					<div className="mt-3 text-right">
						<Link
							to="/forgot-password"
							className="text-sm text-muted-foreground underline-offset-4 hover:underline"
						>
							{AUTH.forgotPassword}
						</Link>
					</div>

					<p className="mt-4 text-center text-sm text-muted-foreground">
						No account yet?{" "}
						<Link to="/register" className="text-foreground underline-offset-4 hover:underline">
							{AUTH.signUp}
						</Link>
					</p>
				</CardContent>
			</Card>
		</div>
	);
}
