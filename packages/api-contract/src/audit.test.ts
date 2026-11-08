import { describe, expect, it } from "vitest";
import { auditEventSchema, listAuditEventsOutputSchema } from "./audit.ts";

const event = {
	id: "audit-1",
	actorId: "admin-1",
	actorRole: "ADMIN",
	actor: { displayName: "Admin", username: "admin" },
	action: "report.resolve",
	entityType: "report",
	entityId: "report-1",
	metadata: { status: "ACTIONED" },
	createdAt: "2026-08-01T10:00:00.000Z",
};

describe("audit contract", () => {
	it("accepts an audit event", () => {
		expect(auditEventSchema.parse(event).action).toBe("report.resolve");
	});

	it("accepts a paginated list", () => {
		const parsed = listAuditEventsOutputSchema.parse({
			items: [event],
			nextCursor: null,
		});

		expect(parsed.items[0]?.actor?.username).toBe("admin");
	});

	it("accepts null metadata and actors", () => {
		expect(
			auditEventSchema.parse({ ...event, actorId: null, actor: null, metadata: null }).actor,
		).toBeNull();
	});
});
