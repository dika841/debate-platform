import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@app/components/ui/card";
import { FieldError, hasFieldError } from "@app/components/ui/field-error";
import { Input } from "@app/components/ui/input";
import { Label } from "@app/components/ui/label";
import { AUTH } from "@app/messages";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { PasswordInput } from "@/routes/_components/password-input.tsx";
import { useRegister } from "@/routes/_public/register/_hooks/use-register.ts";

export const RegisterForm = () => {
	const { form, serverError, info, onSubmit } = useRegister();

	return (
		<div className="mx-auto w-full max-w-md">
			<Card className="border-t-2 border-t-primary/50">
				<CardHeader>
					<p className="font-mono text-[10px] tracking-[0.18em] text-primary uppercase">
						New member
					</p>
					<CardTitle>{AUTH.signUp}</CardTitle>
					<CardDescription>Create an account to host and join debates.</CardDescription>
				</CardHeader>
				<CardContent>
					<form className="space-y-4" onSubmit={onSubmit}>
						<form.Field name="name">
							{(field) => (
								<div className="space-y-2">
									<Label htmlFor={field.name}>Display name</Label>
									<Input
										id={field.name}
										name={field.name}
										autoComplete="name"
										aria-invalid={hasFieldError(field.state.meta.errorMap)}
										value={field.state.value}
										onBlur={field.handleBlur}
										onChange={(event) => field.handleChange(event.target.value)}
									/>
									<FieldError errorMap={field.state.meta.errorMap} />
								</div>
							)}
						</form.Field>

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
									<Label htmlFor={field.name}>Confirm password</Label>
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

						{info ? <p className="text-sm text-muted-foreground">{info}</p> : null}

						<form.Subscribe selector={(state) => state.isSubmitting}>
							{(isSubmitting) => (
								<Button type="submit" className="w-full" disabled={isSubmitting}>
									{isSubmitting ? <Loader2 className="animate-spin" /> : null}
									{isSubmitting ? "Creating account…" : AUTH.signUp}
								</Button>
							)}
						</form.Subscribe>
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
};
