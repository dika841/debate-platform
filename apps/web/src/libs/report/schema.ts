import { reportCategorySchema } from "@app/api-contract";
import { REPORT } from "@app/messages";
import { z } from "zod";

export const reportFormSchema = z.object({
	category: reportCategorySchema,
	details: z.string().trim().min(10, REPORT.detailsInvalid).max(2000, REPORT.detailsTooLong),
});

export type ReportFormInput = z.infer<typeof reportFormSchema>;
export type ReportCategory = ReportFormInput["category"];
