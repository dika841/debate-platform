import { describe, expect, it } from "vitest";
import {
	createSubmissionInputSchema,
	listSubmissionsOutputSchema,
	roundSchema,
	SUBMISSION_CONTENT_MAX,
	SUBMISSION_CONTENT_MIN,
} from "./execution.ts";

const submission = {
	id: "submission-1",
	roundId: "round-1",
	roomId: "room-1",
	authorId: "user-1",
	author: { id: "user-1", displayName: "Member", username: "member" },
	team: "PRO" as const,
	content: "x".repeat(SUBMISSION_CONTENT_MIN),
	submittedAt: "2026-04-01T10:00:00.000Z",
};

describe("execution contract", () => {
	it("accepts a round payload", () => {
		const parsed = roundSchema.parse({
			id: "round-1",
			roomId: "room-1",
			roundNumber: 1,
			status: "OPEN",
			opensAt: "2026-04-01T10:00:00.000Z",
			submissionDeadline: "2026-04-01T10:30:00.000Z",
			submissionCount: 2,
		});

		expect(parsed.status).toBe("OPEN");
	});

	it("accepts submission payloads", () => {
		const parsed = listSubmissionsOutputSchema.parse({ items: [submission] });
		expect(parsed.items[0]?.team).toBe("PRO");
	});

	it("enforces submission length", () => {
		expect(
			createSubmissionInputSchema.parse({
				roundId: "round-1",
				content: "x".repeat(SUBMISSION_CONTENT_MIN),
			}).content,
		).toHaveLength(SUBMISSION_CONTENT_MIN);

		expect(() =>
			createSubmissionInputSchema.parse({ roundId: "round-1", content: "short" }),
		).toThrow();
		expect(() =>
			createSubmissionInputSchema.parse({
				roundId: "round-1",
				content: "x".repeat(SUBMISSION_CONTENT_MAX + 1),
			}),
		).toThrow();
	});

	it("rejects unknown round statuses", () => {
		expect(() =>
			roundSchema.parse({
				id: "round-1",
				roomId: "room-1",
				roundNumber: 1,
				status: "PAUSED",
				opensAt: null,
				submissionDeadline: null,
				submissionCount: 0,
			}),
		).toThrow();
	});
});
