import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@app/components/ui/card";
import { FieldError, hasFieldError } from "@app/components/ui/field-error";
import { Input } from "@app/components/ui/input";
import { Label } from "@app/components/ui/label";
import { AUTH } from "@app/messages";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useForgotPassword } from "@/routes/_public/forgot-password/_hooks/use-forgot-password.ts";

export const ForgotPasswordForm = () => {
	const { form, sent, onSubmit } = useForgotPassword();

	return (
		<div className="mx-auto w-full max-w-md">
			<Card className="border-t-2 border-t-primary/50">
				<CardHeader>
					<p className="font-mono text-[10px] tracking-[0.18em] text-primary uppercase">Recovery</p>
					<CardTitle>{AUTH.resetPassword}</CardTitle>
					<CardDescription>{AUTH.resetDescription}</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					{sent ? (
						<p className="text-sm text-muted-foreground">{AUTH.resetRequested}</p>
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

							<form.Subscribe selector={(state) => state.isSubmitting}>
								{(isSubmitting) => (
									<Button type="submit" className="w-full" disabled={isSubmitting}>
										{isSubmitting ? <Loader2 className="animate-spin" /> : null}
										{isSubmitting ? "Sending…" : AUTH.resetPassword}
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
