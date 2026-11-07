import { Button } from "@app/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@app/components/ui/card";
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
import { useState, type FormEvent } from "react";
import { useCreateReport } from "@/libs/api/queries.ts";

type ReportCategory = keyof typeof REPORT.categories;

const CATEGORIES = Object.keys(REPORT.categories) as ReportCategory[];

export const ReportForm = ({ roomId }: { roomId: string }) => {
	const create = useCreateReport();
	const [category, setCategory] = useState<ReportCategory>("HARASSMENT");
	const [details, setDetails] = useState("");
	const [feedback, setFeedback] = useState<string | null>(null);

	const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
		event.preventDefault();
		setFeedback(null);

		try {
			await create.mutateAsync({ roomId, category, details });
			setDetails("");
			setFeedback(REPORT.submitted);
		} catch (error) {
			setFeedback(error instanceof Error ? error.message : "Unable to submit report");
		}
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle>{REPORT.title}</CardTitle>
				<CardDescription>{REPORT.description}</CardDescription>
			</CardHeader>
			<CardContent>
				<form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
					<div className="space-y-2">
						<Label htmlFor="report-category">{REPORT.category}</Label>
						<Select
							value={category}
							onValueChange={(value) => setCategory(value as ReportCategory)}
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
					</div>

					<div className="space-y-2">
						<Label htmlFor="report-details">{REPORT.details}</Label>
						<Textarea
							id="report-details"
							value={details}
							onChange={(event) => setDetails(event.target.value)}
							placeholder={REPORT.detailsPlaceholder}
							rows={4}
							minLength={10}
							maxLength={2000}
							required
						/>
					</div>

					{feedback ? <p className="text-sm text-muted-foreground">{feedback}</p> : null}

					<Button type="submit" variant="outline" disabled={create.isPending}>
						{create.isPending ? REPORT.submitting : REPORT.submit}
					</Button>
				</form>
			</CardContent>
		</Card>
	);
};
