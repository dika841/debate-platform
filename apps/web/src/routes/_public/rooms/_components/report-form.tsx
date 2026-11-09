import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@app/components/ui/card";
import { FieldError, hasFieldError } from "@app/components/ui/field-error";
import { Label } from "@app/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@app/components/ui/select";
import { Textarea } from "@app/components/ui/textarea";
import { REPORT } from "@app/messages";
import { useForm } from "@tanstack/react-form";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import { useCreateReport } from "@/libs/api/queries.ts";
import {
	reportFormSchema,
	type ReportCategory,
	type ReportFormInput,
} from "@/libs/report/schema.ts";

const CATEGORIES = Object.keys(REPORT.categories) as ReportCategory[];

const DEFAULT_VALUES: ReportFormInput = {
	category: "HARASSMENT",
	details: "",
};

export const ReportForm = ({ roomId }: { roomId: string }) => {
	const create = useCreateReport();
	const [feedback, setFeedback] = useState<{ message: string; error: boolean } | null>(null);

	const form = useForm({
		defaultValues: DEFAULT_VALUES,
		validators: {
			onChange: reportFormSchema,
			onSubmit: reportFormSchema,
		},
		onSubmit: async ({ value }) => {
			setFeedback(null);

			try {
				await create.mutateAsync({ roomId, category: value.category, details: value.details });
				form.reset();
				setFeedback({ message: REPORT.submitted, error: false });
			} catch (error) {
				setFeedback({
					message: error instanceof Error ? error.message : "Unable to submit report",
					error: true,
				});
			}
		},
	});

	return (
		<Card>
			<CardHeader>
				<CardTitle>{REPORT.title}</CardTitle>
				<CardDescription>{REPORT.description}</CardDescription>
			</CardHeader>
			<CardContent>
				<form
					className="space-y-4"
					onSubmit={(event) => {
						event.preventDefault();
						void form.handleSubmit();
					}}
				>
					<form.Field name="category">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor="report-category">{REPORT.category}</Label>
								<Select
									value={field.state.value}
									onValueChange={(value) => field.handleChange(value as ReportCategory)}
								>
									<SelectTrigger id="report-category" className="w-full">
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{CATEGORIES.map((value) => (
											<SelectItem key={value} value={value}>
												{REPORT.categories[value]}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
								<FieldError errorMap={field.state.meta.errorMap} />
							</div>
						)}
					</form.Field>

					<form.Field name="details">
						{(field) => (
							<div className="space-y-2">
								<Label htmlFor="report-details">{REPORT.details}</Label>
								<Textarea
									id="report-details"
									name={field.name}
									placeholder={REPORT.detailsPlaceholder}
									rows={4}
									aria-invalid={hasFieldError(field.state.meta.errorMap)}
									value={field.state.value}
									onBlur={field.handleBlur}
									onChange={(event) => field.handleChange(event.target.value)}
								/>
								<FieldError errorMap={field.state.meta.errorMap} />
							</div>
						)}
					</form.Field>

					{feedback ? (
						<p
							className={
								feedback.error ? "text-sm text-destructive" : "text-sm text-muted-foreground"
							}
						>
							{feedback.message}
						</p>
					) : null}

					<form.Subscribe selector={(state) => state.isSubmitting}>
						{(isSubmitting) => (
							<Button type="submit" variant="outline" disabled={isSubmitting}>
								{isSubmitting ? <Loader2 className="animate-spin" /> : null}
								{isSubmitting ? REPORT.submitting : REPORT.submit}
							</Button>
						)}
					</form.Subscribe>
				</form>
			</CardContent>
		</Card>
	);
};
