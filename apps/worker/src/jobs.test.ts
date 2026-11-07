import { describe, expect, it } from "vitest";
import { JOBS, runScheduledJobs } from "./jobs.ts";

describe("worker jobs", () => {
	it("skips the round-deadline job without a database URL", async () => {
		const results = await runScheduledJobs(new Date("2026-05-01T00:00:00.000Z"), {});
		const deadline = results.find((result) => result.name === JOBS.ROUND_DEADLINE);

		expect(deadline).toMatchObject({
			name: JOBS.ROUND_DEADLINE,
			executed: false,
			reason: "DATABASE_URL is not configured",
		});
	});

	it("keeps future jobs as no-ops", async () => {
		const results = await runScheduledJobs(new Date("2026-05-01T00:00:00.000Z"), {});
		const voting = results.find((result) => result.name === JOBS.VOTING_CLOSE);

		expect(voting?.executed).toBe(false);
	});
});
