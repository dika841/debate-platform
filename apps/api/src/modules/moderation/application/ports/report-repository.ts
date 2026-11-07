import type { ReportCategory, ReportStatus } from "@app/shared";

export type ReportRecord = {
	readonly id: string;
	readonly roomId: string;
	readonly submissionId: string | null;
	readonly reporterId: string;
	readonly category: ReportCategory;
	readonly details: string;
	readonly status: ReportStatus;
	readonly resolutionNote: string | null;
	readonly resolvedById: string | null;
	readonly resolvedAt: Date | null;
	readonly createdAt: Date;
	readonly updatedAt: Date;
};

export type ReportRoom = {
	readonly id: string;
	readonly title: string;
};

export type ReportReporter = {
	readonly id: string;
	readonly displayName: string;
	readonly username: string | null;
};

export type ReportWithRelations = {
	readonly report: ReportRecord;
	readonly room: ReportRoom;
	readonly reporter: ReportReporter;
};

export type NewReport = {
	readonly id: string;
	readonly roomId: string;
	readonly submissionId: string | null;
	readonly reporterId: string;
	readonly category: ReportCategory;
	readonly details: string;
	readonly createdAt: Date;
};

export type ReportListFilter = {
	readonly status?: ReportStatus;
	readonly cursor?: string | null;
	readonly limit: number;
};

export type ReportPage = {
	readonly items: readonly ReportWithRelations[];
	readonly nextCursor: string | null;
};

export type ResolveReportPatch = {
	readonly status: ReportStatus;
	readonly resolutionNote: string | null;
	readonly resolvedById: string;
	readonly resolvedAt: Date;
};

export interface ReportRepository {
	create(input: NewReport): Promise<ReportWithRelations>;
	findById(id: string): Promise<ReportWithRelations | null>;
	list(filter: ReportListFilter): Promise<ReportPage>;
	resolve(id: string, patch: ResolveReportPatch): Promise<ReportWithRelations>;
}
