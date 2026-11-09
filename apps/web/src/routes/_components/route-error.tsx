import { Button } from "@app/components/ui/button";
import { ERROR } from "@app/messages";
import { type ErrorComponentProps, Link, useRouter, useRouterState } from "@tanstack/react-router";
import { match } from "ts-pattern";
import { isForbidden } from "@/libs/auth/forbidden.ts";
import { isServerUnreachable } from "@/libs/auth/server-unreachable.ts";

const ERROR_TITLE_ID = "route-error-title";

export const RouteError = ({ error }: ErrorComponentProps) => {
	const router = useRouter();
	const isRetrying = useRouterState({ select: (state) => state.isLoading });
	const forbidden = isForbidden(error);
	const unreachable = isServerUnreachable(error);
	const copy = match({ forbidden, unreachable })
		.with({ forbidden: true }, () => ({
			title: ERROR.forbiddenTitle,
			body: ERROR.forbiddenBody,
			next: ERROR.forbiddenNext,
		}))
		.with({ unreachable: true }, () => ({
			title: ERROR.serverUnreachableTitle,
			body: ERROR.serverUnreachableBody,
			next: ERROR.serverUnreachableNext,
		}))
		.otherwise(() => ({
			title: ERROR.unexpectedTitle,
			body: ERROR.unexpectedBody,
			next: ERROR.unexpectedNext,
		}));

	return (
		<div className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground">
			<section aria-labelledby={ERROR_TITLE_ID} className="max-w-md space-y-3 text-center">
				<h1 id={ERROR_TITLE_ID} className="text-xl font-semibold">
					{copy.title}
				</h1>
				<p role="alert" className="text-sm text-muted-foreground">
					{copy.body}
				</p>
				<p className="text-sm text-muted-foreground">{copy.next}</p>
				{match(forbidden)
					.with(true, () => (
						<Button variant="outline" asChild>
							<Link to="/">{ERROR.goHome}</Link>
						</Button>
					))
					.otherwise(() => (
						<Button
							variant="outline"
							disabled={isRetrying}
							onClick={() => void router.invalidate()}
						>
							{isRetrying ? ERROR.retrying : ERROR.retry}
						</Button>
					))}
			</section>
		</div>
	);
};
