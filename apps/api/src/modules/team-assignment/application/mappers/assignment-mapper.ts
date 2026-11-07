import type { AssignmentSummary } from "@app/api-contract";
import type { TeamCounts } from "../../domain/assignment.ts";

export const toAssignmentSummary = (
	counts: TeamCounts,
	assigned: number,
	finalizedAt: Date | null,
): AssignmentSummary => ({
	assigned,
	proCount: counts.PRO,
	contraCount: counts.CONTRA,
	finalizedAt: finalizedAt?.toISOString() ?? null,
});
