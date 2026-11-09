import { APP } from "@app/messages";
import { QueryClientProvider } from "@tanstack/react-query";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { match, P } from "ts-pattern";
import { sessionRefresh } from "./libs/auth/session.ts";
import { queryClient } from "./libs/tanstack-query/index.ts";
import { NotFound } from "./routes/_components/not-found.tsx";
import { RouteError } from "./routes/_components/route-error.tsx";
import { RoutePending } from "./routes/_components/route-pending.tsx";
import { routeTree } from "./routeTree.gen.ts";
import "./styles.css";

const router = createRouter({
	routeTree,
	context: { queryClient },
	defaultPreload: "intent",
	defaultPreloadDelay: 50,
	defaultPendingMs: 300,
	defaultPendingMinMs: 300,
	defaultPendingComponent: RoutePending,
	defaultErrorComponent: RouteError,
	defaultNotFoundComponent: NotFound,
	scrollRestoration: true,
});

declare module "@tanstack/react-router" {
	interface Register {
		router: typeof router;
	}
}

const bootstrap = async (): Promise<void> => {
	await sessionRefresh();

	const rootElement = document.getElementById("root");

	match(rootElement)
		.with(P.nullish, () => {
			throw new Error(APP.rootMissing);
		})
		.otherwise((root) => {
			createRoot(root).render(
				<StrictMode>
					<QueryClientProvider client={queryClient}>
						<RouterProvider router={router} />
					</QueryClientProvider>
				</StrictMode>,
			);
		});
};

void bootstrap();
