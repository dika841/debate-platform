import { createFileRoute } from "@tanstack/react-router";
import { LoginForm } from "@/routes/_public/login/_components/login-form.tsx";
import { LoginPending } from "@/routes/_public/login/_components/login-pending.tsx";

export type LoginSearch = {
	redirect?: string;
};

const validateSearch = (search: Record<string, unknown>): LoginSearch => ({
	redirect: typeof search.redirect === "string" ? search.redirect : undefined,
});

function LoginPage() {
	const { redirect } = Route.useSearch();

	return <LoginForm redirect={redirect} />;
}

export const Route = createFileRoute("/_public/login/")({
	validateSearch,
	component: LoginPage,
	pendingComponent: LoginPending,
});
