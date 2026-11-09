import { createFileRoute } from "@tanstack/react-router";
import { ResetPasswordForm } from "@/routes/_public/reset-password/_components/reset-password-form.tsx";

export type ResetPasswordSearch = {
	token?: string;
};

const validateSearch = (search: Record<string, unknown>): ResetPasswordSearch => ({
	token: typeof search.token === "string" ? search.token : undefined,
});

export const Route = createFileRoute("/_public/reset-password/")({
	validateSearch,
	component: ResetPasswordPage,
});

function ResetPasswordPage() {
	const { token } = Route.useSearch();

	return <ResetPasswordForm token={token} />;
}
