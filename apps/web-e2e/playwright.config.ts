import { defineConfig, devices } from "@playwright/test";

const reuseExistingServer = !process.env.CI;

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
	webServer:
		process.env.E2E_BASE_URL !== undefined
			? undefined
			: [
					{
						command: "pnpm --filter @app/api start",
						url: "http://localhost:3001/health",
						reuseExistingServer,
						timeout: 120_000,
					},
					{
						command: "pnpm --filter @app/web dev",
						url: "http://localhost:5173",
						reuseExistingServer,
						timeout: 120_000,
					},
				],
});
