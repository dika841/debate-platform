import { defineConfig } from "vitest/config";

export default defineConfig({
	test: {
		environment: "node",
		include: ["tests/**/*.test.ts"],
		fileParallelism: false,
		globalSetup: ["./tests/global-setup.ts"],
		hookTimeout: 60_000,
		testTimeout: 30_000,
	},
});
