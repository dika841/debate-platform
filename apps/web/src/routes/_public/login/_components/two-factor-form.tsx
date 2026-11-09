import { Button } from "@app/components/ui/button";
import { FieldError, hasFieldError } from "@app/components/ui/field-error";
import { Input } from "@app/components/ui/input";
import { Label } from "@app/components/ui/label";
import { AUTH } from "@app/messages";
import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import type { SubmitEvent } from "react";
import { twoFactorSchema, type TwoFactorInput } from "@/libs/auth/login-schema.ts";

const DEFAULT_VALUES: TwoFactorInput = {
	code: "",
};

type TwoFactorFormProps = {
	readonly serverError: string | null;
	readonly onVerify: (code: string) => Promise<void>;
};

export const TwoFactorForm = ({ serverError, onVerify }: TwoFactorFormProps) => {
	const form = useForm({
		defaultValues: DEFAULT_VALUES,
		validators: {
			onChange: twoFactorSchema,
			onSubmit: twoFactorSchema,
		},
		onSubmit: async ({ value }) => {
			await onVerify(value.code);
		},
	});

	const onSubmit = (event: SubmitEvent<HTMLFormElement>): void => {
		event.preventDefault();
		void form.handleSubmit();
	};

	return (
		<form className="space-y-4" onSubmit={onSubmit}>
			<p className="text-sm text-muted-foreground">{AUTH.twoFactorRequired}</p>

			<form.Field name="code">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor={field.name}>{AUTH.twoFactorCode}</Label>
						<Input
							id={field.name}
							name={field.name}
							inputMode="numeric"
							autoComplete="one-time-code"
							autoFocus
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
						{isSubmitting ? AUTH.verifyingCode : AUTH.verifyCode}
					</Button>
				)}
			</form.Subscribe>
		</form>
	);
};
