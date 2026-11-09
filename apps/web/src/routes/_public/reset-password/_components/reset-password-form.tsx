import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@app/components/ui/card";
import { FieldError, hasFieldError } from "@app/components/ui/field-error";
import { Label } from "@app/components/ui/label";
import { AUTH } from "@app/messages";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { PasswordInput } from "@/routes/_components/password-input.tsx";
import { useResetPassword } from "@/routes/_public/reset-password/_hooks/use-reset-password.ts";

export const ResetPasswordForm = ({ token }: { token: string | undefined }) => {
	const { form, serverError, done, onSubmit } = useResetPassword(token);

	return (
		<div className="mx-auto w-full max-w-md">
			<Card className="border-t-2 border-t-primary/50">
				<CardHeader>
					<p className="font-mono text-[10px] tracking-[0.18em] text-primary uppercase">
						New password
					</p>
					<CardTitle>{AUTH.resetPassword}</CardTitle>
					<CardDescription>{token ? AUTH.passwordHint : AUTH.resetTokenInvalid}</CardDescription>
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
						<form className="space-y-4" onSubmit={onSubmit}>
							<form.Field name="password">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>{AUTH.newPassword}</Label>
										<PasswordInput
											id={field.name}
											name={field.name}
											autoComplete="new-password"
											aria-invalid={hasFieldError(field.state.meta.errorMap)}
											value={field.state.value}
											onBlur={field.handleBlur}
											onChange={(event) => field.handleChange(event.target.value)}
										/>
										<FieldError errorMap={field.state.meta.errorMap} />
									</div>
								)}
							</form.Field>

							<form.Field name="confirmPassword">
								{(field) => (
									<div className="space-y-2">
										<Label htmlFor={field.name}>{AUTH.confirmPassword}</Label>
										<PasswordInput
											id={field.name}
											name={field.name}
											autoComplete="new-password"
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
									<Button type="submit" className="w-full" disabled={isSubmitting || !token}>
										{isSubmitting ? <Loader2 className="animate-spin" /> : null}
										{isSubmitting ? "Updating…" : AUTH.resetPassword}
									</Button>
								)}
							</form.Subscribe>
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
};
