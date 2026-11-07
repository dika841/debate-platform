import {
	DOMAIN_ERROR_CODE,
	DomainError,
	REPORT_STATUS,
	type ReportResolution,
	type ReportStatus,
} from "@app/shared";

export const REPORT_DETAILS = {
	MIN: 10,
	MAX: 2000,
} as const;

export const validateReportDetails = (value: string): string => {
	const trimmed = value.trim();

	if (trimmed.length < REPORT_DETAILS.MIN) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.INVALID_REPORT,
			`Details must be at least ${REPORT_DETAILS.MIN} characters`,
		);
	}

	if (trimmed.length > REPORT_DETAILS.MAX) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.INVALID_REPORT,
			`Details must be at most ${REPORT_DETAILS.MAX} characters`,
		);
	}

	return trimmed;
};

export const assertReportPending = (status: ReportStatus): void => {
	if (status !== REPORT_STATUS.PENDING) {
		throw new DomainError(
			DOMAIN_ERROR_CODE.INVALID_REPORT_STATE,
			"This report has already been resolved",
		);
	}
};

export const resolutionToStatus = (resolution: ReportResolution): ReportStatus => resolution;
