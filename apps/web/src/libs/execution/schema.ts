import { EXECUTION } from "@app/messages";
import { z } from "zod";

export const SUBMISSION_MIN = 50;
export const SUBMISSION_MAX = 5000;

export const submissionSchema = z.object({
	content: z
		.string()
		.trim()
		.min(SUBMISSION_MIN, EXECUTION.argumentInvalid)
		.max(SUBMISSION_MAX, EXECUTION.argumentTooLong),
});

export type SubmissionInput = z.infer<typeof submissionSchema>;
