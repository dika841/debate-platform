import { describe, expect, it } from "vitest";
import { createAuditLogger } from "./audit-logger.ts";
import type { NewAuditEvent, AuditRepository } from "./ports/audit-repository.ts";
import { listAuditEvents } from "./use-cases/list-audit-events.ts";

const createRepository = () => {
	const events: NewAuditEvent[] = [];

	return {
		events,
		repository: {
			create: async (input: NewAuditEvent) => {
				events.push(input);
			},
			list: async () => ({ items: [], nextCursor: null }),
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

	it("lists audit events for admins only", async () => {
		const harness = createRepository();
		const repository = {
			...harness.repository,
			list: async () => ({
				items: [
					{
						id: "audit-1",
						actorId: "admin-1",
						actorRole: "ADMIN",
						action: "report.resolve",
						entityType: "report",
						entityId: "report-1",
						metadata: null,
						createdAt: new Date("2026-08-01T10:00:00.000Z"),
						actor: { displayName: "Admin", username: "admin" },
					},
				],
				nextCursor: null,
			}),
		} satisfies AuditRepository;

		await expect(listAuditEvents({ repository }, "MODERATOR", {})).rejects.toMatchObject({
			code: "AUTHORIZATION_DENIED",
		});

		const result = await listAuditEvents({ repository }, "ADMIN", {});
		expect(result.items[0]?.actor?.username).toBe("admin");
	});
});
