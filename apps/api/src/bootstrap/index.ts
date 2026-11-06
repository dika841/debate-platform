import type { RouterClient } from "@orpc/server";
import type { appRouter } from "#/bootstrap/router.ts";

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<AppRouter>;
