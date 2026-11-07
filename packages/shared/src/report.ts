export const REPORT_CATEGORY = {
	HARASSMENT: "HARASSMENT",
	HATE_SPEECH: "HATE_SPEECH",
	SPAM: "SPAM",
	OFF_TOPIC: "OFF_TOPIC",
	OTHER: "OTHER",
} as const;

export type ReportCategory = (typeof REPORT_CATEGORY)[keyof typeof REPORT_CATEGORY];

export const REPORT_STATUS = {
	PENDING: "PENDING",
	ACTIONED: "ACTIONED",
	DISMISSED: "DISMISSED",
} as const;

export type ReportStatus = (typeof REPORT_STATUS)[keyof typeof REPORT_STATUS];

export const REPORT_RESOLUTION = {
	ACTIONED: "ACTIONED",
	DISMISSED: "DISMISSED",
} as const;

export type ReportResolution = (typeof REPORT_RESOLUTION)[keyof typeof REPORT_RESOLUTION];
