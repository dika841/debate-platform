import { describe, expect, it } from "vitest";
import { isMetricsAuthorized } from "./metrics-auth.ts";

describe("metrics authorization", () => {
	it("uses the bearer token when configured", () => {
		expect(
			isMetricsAuthorized({
				authorization: "Bearer secret-token",
				token: "secret-token",
				production: true,
			}),
		).toBe(true);
		expect(
			isMetricsAuthorized({
				authorization: "Bearer wrong",
				token: "secret-token",
				production: true,
			}),
		).toBe(false);
	});

	it("disables metrics in production without a token", () => {
		expect(
			isMetricsAuthorized({
				authorization: undefined,
				token: undefined,
				production: true,
			}),
		).toBe(false);
	});

	it("allows local development without a token", () => {
		expect(
			isMetricsAuthorized({
				authorization: undefined,
				token: undefined,
				production: false,
			}),
		).toBe(true);
	});
});
