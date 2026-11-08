import { beforeEach, describe, expect, it } from "vitest";
import { metrics } from "./metrics.ts";

describe("metrics registry", () => {
	beforeEach(() => {
		metrics.reset();
	});

	it("renders counters with labels", () => {
		metrics.increment("http_requests_total", {
			method: "GET",
			route: "/health",
			status: 200,
		});
		metrics.increment("http_requests_total", { method: "GET", route: "/health", status: 200 }, 2);

		const rendered = metrics.render();

		expect(rendered).toContain("# TYPE http_requests_total counter");
		expect(rendered).toContain('http_requests_total{method="GET",route="/health",status="200"} 3');
	});

	it("records request duration sums and counts", () => {
		metrics.observeRequest({
			method: "POST",
			route: "/rpc/test",
			status: 200,
			durationMs: 12.6,
		});

		const rendered = metrics.render();

		expect(rendered).toContain(
			'http_request_duration_ms_total{method="POST",route="/rpc/test"} 13',
		);
		expect(rendered).toContain('http_request_duration_ms_count{method="POST",route="/rpc/test"} 1');
	});
});
