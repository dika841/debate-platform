import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./tests",
	fullyParallel: true,
	forbidOnly: Boolean(process.env.CI),
	retries: process.env.CI ? 2 : 0,
	reporter: "list",
	use: {
		baseURL: process.env.E2E_BASE_URL ?? "http://localhost:5173",
		trace: "on-first-retry",
	},
	projects: [
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
		},
	],
	webServer: process.env.E2E_BASE_URL
		? undefined
		: {
				command: "pnpm --filter @app/web dev",
				url: "http://localhost:5173",
				reuseExistingServer: true,
				timeout: 120_000,
			},
});
