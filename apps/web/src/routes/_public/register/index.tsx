import { createFileRoute } from "@tanstack/react-router";
import { RegisterForm } from "@/routes/_public/register/_components/register-form.tsx";

export const Route = createFileRoute("/_public/register/")({
	component: RegisterPage,
});

function RegisterPage() {
	return <RegisterForm />;
}
