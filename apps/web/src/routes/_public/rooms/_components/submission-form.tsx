import { Button } from "@app/components/ui/button";
import { FieldError, hasFieldError } from "@app/components/ui/field-error";
import { Label } from "@app/components/ui/label";
import { Textarea } from "@app/components/ui/textarea";
import { EXECUTION } from "@app/messages";
import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useCreateSubmission } from "@/libs/api/queries.ts";
import {
	SUBMISSION_MAX,
	SUBMISSION_MIN,
	submissionSchema,
	type SubmissionInput,
} from "@/libs/execution/schema.ts";

const DEFAULT_VALUES: SubmissionInput = { content: "" };

export const SubmissionForm = ({ roundId }: { roundId: string }) => {
	const submit = useCreateSubmission();
	const [serverError, setServerError] = useState<string | null>(null);

	const form = useForm({
		defaultValues: DEFAULT_VALUES,
		validators: {
			onChange: submissionSchema,
			onSubmit: submissionSchema,
		},
		onSubmit: async ({ value }) => {
			setServerError(null);

			try {
				await submit.mutateAsync({ roundId, content: value.content });
				form.reset();
			} catch (error) {
				setServerError(error instanceof Error ? error.message : "Unable to submit argument");
			}
		},
	});

	return (
		<form
			className="space-y-2"
			onSubmit={(event) => {
				event.preventDefault();
				void form.handleSubmit();
			}}
		>
			<form.Field name="content">
				{(field) => (
					<div className="space-y-2">
						<Label htmlFor="submission-content">{EXECUTION.yourArgument}</Label>
						<Textarea
							id="submission-content"
							name={field.name}
							placeholder={EXECUTION.argumentPlaceholder}
							rows={6}
							maxLength={SUBMISSION_MAX}
							aria-invalid={hasFieldError(field.state.meta.errorMap)}
							value={field.state.value}
							onBlur={field.handleBlur}
							onChange={(event) => field.handleChange(event.target.value)}
						/>
						<FieldError errorMap={field.state.meta.errorMap} />

						<div className="flex flex-wrap items-center justify-between gap-2">
							<p className="text-xs text-muted-foreground">
								{EXECUTION.argumentHint(field.state.value.trim().length, SUBMISSION_MIN)}
							</p>
							<form.Subscribe selector={(state) => state.isSubmitting}>
								{(isSubmitting) => (
									<Button type="submit" size="sm" disabled={isSubmitting}>
										{isSubmitting ? <Loader2 className="animate-spin" /> : null}
										{isSubmitting ? EXECUTION.submitting : EXECUTION.submit}
									</Button>
								)}
							</form.Subscribe>
						</div>
					</div>
				)}
			</form.Field>

			<FieldError errors={serverError ? [{ message: serverError }] : []} />
		</form>
	);
};
