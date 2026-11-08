import { describe, expect, it } from "vitest";
import { createAuditLogger } from "./audit-logger.ts";
import type { NewAuditEvent, AuditRepository } from "./ports/audit-repository.ts";

const createRepository = () => {
	const events: NewAuditEvent[] = [];

	return {
		events,
		repository: {
			create: async (input: NewAuditEvent) => {
				events.push(input);
			},
		} satisfies AuditRepository,
	};
};

describe("audit logger", () => {
	it("records an immutable event with actor and metadata", async () => {
		const harness = createRepository();
		const logger = createAuditLogger({
			repository: harness.repository,
			clock: { now: () => new Date("2026-08-01T10:00:00.000Z") },
			generateId: () => "audit-1",
		});

		await logger.record({
			actorId: "admin-1",
			actorRole: "ADMIN",
			action: "report.resolve",
			entityType: "report",
			entityId: "report-1",
			metadata: { status: "ACTIONED" },
		});

		expect(harness.events).toEqual([
			{
				id: "audit-1",
				actorId: "admin-1",
				actorRole: "ADMIN",
				action: "report.resolve",
				entityType: "report",
				entityId: "report-1",
				metadata: { status: "ACTIONED" },
				createdAt: new Date("2026-08-01T10:00:00.000Z"),
			},
		]);
	});
});
