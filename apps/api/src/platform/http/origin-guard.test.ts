import { Hono } from "hono";
import { describe, expect, it } from "vitest";
import { originGuard } from "./origin-guard.ts";

const buildApp = () => {
	const app = new Hono();
	app.use("*", originGuard(["https://debate.example.com"]));
	app.post("/", (context) => context.text("ok"));
	app.get("/", (context) => context.text("ok"));
	return app;
};

describe("origin guard", () => {
	it("allows the configured origin", async () => {
		const response = await buildApp().request("/", {
			method: "POST",
			headers: { origin: "https://debate.example.com" },
		});
		expect(response.status).toBe(200);
	});

	it("rejects other origins", async () => {
		const response = await buildApp().request("/", {
			method: "POST",
			headers: { origin: "https://evil.example.com" },
		});
		expect(response.status).toBe(403);
	});

	it("allows safe methods and non-browser clients", async () => {
		const app = buildApp();

		expect((await app.request("/")).status).toBe(200);
		expect((await app.request("/", { method: "POST" })).status).toBe(200);
	});

	it("validates the referer fallback", async () => {
		const app = buildApp();
		const response = await app.request("/", {
			method: "POST",
			headers: { referer: "https://evil.example.com/page" },
		});
		expect(response.status).toBe(403);
	});
});
