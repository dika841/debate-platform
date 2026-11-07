import type { CreateReportInput, Report } from "@app/api-contract";
import {
	APPLICATION_ERROR_CODE,
	ApplicationError,
	type Clock,
	isPublicRoomStatus,
	systemClock,
} from "@app/shared";
import type { SubmissionRepository } from "#/modules/debate-execution/application/ports/submission-repository.ts";
import type { RoomParticipationReader } from "#/modules/debate-room/application/ports/room-participation-reader.ts";
import type { RoomRepository } from "#/modules/debate-room/application/ports/room-repository.ts";
import { loadRoom } from "#/modules/debate-room/application/room-access.ts";
import { validateReportDetails } from "../../domain/report.ts";
import { toReportDto } from "../mappers/report-mapper.ts";
import type { ReportRepository } from "../ports/report-repository.ts";

export type CreateReportDeps = {
	readonly rooms: RoomRepository;
	readonly submissions: SubmissionRepository;
	readonly reports: ReportRepository;
	readonly participation: RoomParticipationReader;
	readonly clock?: Clock;
	readonly generateId?: () => string;
};

export const createReport = async (
	deps: CreateReportDeps,
	actorId: string,
	input: CreateReportInput,
): Promise<Report> => {
	const found = await loadRoom(deps.rooms, input.roomId);

	if (!isPublicRoomStatus(found.room.status) && found.room.hostId !== actorId) {
		const participation = await deps.participation.snapshot(input.roomId, actorId);

		if (participation.viewerRole === null) {
			throw new ApplicationError(APPLICATION_ERROR_CODE.RESOURCE_NOT_FOUND, "Room not found");
		}
	}

	if (input.submissionId) {
		const submission = await deps.submissions.findById(input.submissionId);

		if (!submission || submission.submission.roomId !== input.roomId) {
			throw new ApplicationError(
				APPLICATION_ERROR_CODE.RESOURCE_NOT_FOUND,
				"Submission not found in this room",
			);
		}
	}

	const clock = deps.clock ?? systemClock;
	const generateId = deps.generateId ?? (() => crypto.randomUUID());

	const created = await deps.reports.create({
		id: generateId(),
		roomId: input.roomId,
		submissionId: input.submissionId ?? null,
		reporterId: actorId,
		category: input.category,
		details: validateReportDetails(input.details),
		createdAt: clock.now(),
	});

	return toReportDto(created);
};
