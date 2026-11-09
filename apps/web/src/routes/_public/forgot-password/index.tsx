import { createFileRoute } from "@tanstack/react-router";
import { ForgotPasswordForm } from "@/routes/_public/forgot-password/_components/forgot-password-form.tsx";

export const Route = createFileRoute("/_public/forgot-password/")({
	component: ForgotPasswordPage,
});

function ForgotPasswordPage() {
	return <ForgotPasswordForm />;
}
