import "vitest";

declare module "vitest" {
	export interface ProvidedContext {
		readonly apiBaseUrl: string;
		readonly runId: string;
	}
}
