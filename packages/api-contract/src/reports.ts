import { REPORT_CATEGORY, REPORT_RESOLUTION, REPORT_STATUS } from "@app/shared";
import { z } from "zod";

export const reportCategorySchema = z.enum([
	REPORT_CATEGORY.HARASSMENT,
	REPORT_CATEGORY.HATE_SPEECH,
	REPORT_CATEGORY.SPAM,
	REPORT_CATEGORY.OFF_TOPIC,
	REPORT_CATEGORY.OTHER,
]);

export const reportStatusSchema = z.enum([
	REPORT_STATUS.PENDING,
	REPORT_STATUS.ACTIONED,
	REPORT_STATUS.DISMISSED,
]);

export const reportResolutionSchema = z.enum([
	REPORT_RESOLUTION.ACTIONED,
	REPORT_RESOLUTION.DISMISSED,
]);

export const reportRoomSchema = z.object({
	id: z.string(),
	title: z.string(),
});

export const reportReporterSchema = z.object({
	id: z.string(),
	displayName: z.string(),
	username: z.string().nullable(),
});

export const reportSchema = z.object({
	id: z.string(),
	room: reportRoomSchema,
	submissionId: z.string().nullable(),
	category: reportCategorySchema,
	details: z.string(),
	status: reportStatusSchema,
	resolutionNote: z.string().nullable(),
	reporter: reportReporterSchema,
	createdAt: z.string(),
	resolvedAt: z.string().nullable(),
});

export const createReportInputSchema = z.object({
	roomId: z.string().min(1),
	submissionId: z.string().min(1).nullable().optional(),
	category: reportCategorySchema,
	details: z.string().trim().min(10).max(2000),
});

export const listReportsInputSchema = z.object({
	status: reportStatusSchema.optional(),
	cursor: z.string().min(1).optional(),
	limit: z.number().int().min(1).max(50).optional(),
});

export const listReportsOutputSchema = z.object({
	items: z.array(reportSchema),
	nextCursor: z.string().nullable(),
});

export const resolveReportInputSchema = z.object({
	reportId: z.string().min(1),
	status: reportResolutionSchema,
	note: z.string().trim().max(1000).optional(),
});

export type ReportCategoryValue = z.infer<typeof reportCategorySchema>;
export type ReportStatusValue = z.infer<typeof reportStatusSchema>;
export type Report = z.infer<typeof reportSchema>;
export type CreateReportInput = z.infer<typeof createReportInputSchema>;
export type ListReportsInput = z.input<typeof listReportsInputSchema>;
export type ListReportsResult = z.infer<typeof listReportsOutputSchema>;
export type ResolveReportInput = z.infer<typeof resolveReportInputSchema>;
