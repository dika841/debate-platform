import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@app/components/ui/card";
import { FieldError, hasFieldError } from "@app/components/ui/field-error";
import { Input } from "@app/components/ui/input";
import { Label } from "@app/components/ui/label";
import { AUTH } from "@app/messages";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { PasswordInput } from "@/routes/_components/password-input.tsx";
import { TwoFactorForm } from "@/routes/_public/login/_components/two-factor-form.tsx";
import { useLogin } from "@/routes/_public/login/_hooks/use-login.ts";

export const LoginForm = ({ redirect }: { redirect?: string }) => {
	const { form, serverError, twoFactorRequired, onSubmit, verifyCode } = useLogin(redirect);

	return (
		<div className="mx-auto w-full max-w-md">
			<Card className="border-t-2 border-t-primary/50">
				<CardHeader>
					<p className="font-mono text-[10px] tracking-[0.18em] text-primary uppercase">
						Member access
					</p>
					<CardTitle>{AUTH.signIn}</CardTitle>
					<CardDescription>{AUTH.signInDescription}</CardDescription>
				</CardHeader>
				<CardContent>
					{twoFactorRequired ? (
						<TwoFactorForm serverError={serverError} onVerify={verifyCode} />
					) : (
						<form className="space-y-4" onSubmit={onSubmit}>
							<form.Field name="email">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Email</Label>
										<Input
											id={field.name}
											name={field.name}
											type="email"
											autoComplete="email"
											aria-invalid={hasFieldError(field.state.meta.errorMap)}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) => field.handleChange(event.target.value)}
										/>
										<FieldError errorMap={field.state.meta.errorMap} />
									</div>
								)}
							</form.Field>

							<form.Field name="password">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>Password</Label>
										<PasswordInput
											id={field.name}
											name={field.name}
											autoComplete="current-password"
											aria-invalid={hasFieldError(field.state.meta.errorMap)}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) => field.handleChange(event.target.value)}
										/>
										<FieldError errorMap={field.state.meta.errorMap} />
									</div>
								)}
							</form.Field>

							<FieldError errors={serverError ? [{ message: serverError }] : []} />

							<form.Subscribe selector={(state) => state.isSubmitting}>
								{(isSubmitting) => (
									<Button type="submit" className="w-full" disabled={isSubmitting}>
										{isSubmitting ? <Loader2 className="animate-spin" /> : null}
										{isSubmitting ? AUTH.signingIn : AUTH.signIn}
									</Button>
								)}
							</form.Subscribe>
						</form>
					)}

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
};
