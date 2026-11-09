import { expect, test, type Page } from "@playwright/test";

const register = async (page: Page): Promise<{ email: string; password: string }> => {
	const email = `e2e-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;
	const password = "Password123!";

	await page.goto("/register");
	await page.getByLabel("Display name").fill("E2E User");
	await page.getByLabel("Email").fill(email);
	await page.getByLabel("Password", { exact: true }).fill(password);
	await page.getByLabel("Confirm password").fill(password);
	await page.getByRole("button", { name: "Create account" }).click();
	await expect(page).toHaveURL(/\/profile$/);

	return { email, password };
};

test("registers, updates the profile and signs out", async ({ page }) => {
	const { email } = await register(page);

	await expect(page.getByRole("textbox", { name: "Display name" })).toHaveValue("E2E User");
	await expect(page.getByText(email)).toBeVisible();

	await page.getByLabel("Display name").fill("E2E Updated");
	await page.getByRole("button", { name: "Save profile" }).click();
	await expect(page.getByText("Profile updated")).toBeVisible();
	await expect(page.getByRole("link", { name: "E2E Updated" })).toBeVisible();

	await page.getByRole("button", { name: "Sign out", exact: true }).click();
	await expect(page).toHaveURL(/\/$/);
	await expect(page.getByRole("banner").getByRole("link", { name: "Sign in" })).toBeVisible();
});

test("redirects anonymous users to login and returns to the profile", async ({ page }) => {
	const { email, password } = await register(page);

	await page.getByRole("button", { name: "Sign out", exact: true }).click();
	await expect(page).toHaveURL(/\/$/);

	await page.goto("/profile");
	await expect(page).toHaveURL(/\/login\?redirect=/);

	await page.getByLabel("Email").fill(email);
	await page.getByLabel("Password", { exact: true }).fill(password);
	await page.getByRole("button", { name: "Sign in" }).click();

	await expect(page).toHaveURL(/\/profile$/);
	await expect(page.getByRole("textbox", { name: "Display name" })).toBeVisible();
});

test("shows an error for invalid credentials", async ({ page }) => {
	await page.goto("/login");
	await page.getByLabel("Email").fill("missing@example.com");
	await page.getByLabel("Password", { exact: true }).fill("WrongPassword123!");
	await page.getByRole("button", { name: "Sign in" }).click();

	await expect(page.getByText(/incorrect/i)).toBeVisible();
});

test("changes the password and signs in with the new one", async ({ page }) => {
	const { email, password } = await register(page);
	const newPassword = "NewPassword123!";

	await page.locator("#currentPassword").fill(password);
	await page.getByLabel("New password", { exact: true }).fill(newPassword);
	await page.getByLabel("Confirm password").fill(newPassword);
	await page.getByRole("button", { name: "Update password" }).click();
	await expect(page.getByText("Password updated")).toBeVisible();

	await page.getByRole("button", { name: "Sign out", exact: true }).click();
	await expect(page).toHaveURL(/\/$/);

	await page.goto("/login?redirect=/profile");
	await page.getByLabel("Email").fill(email);
	await page.getByLabel("Password", { exact: true }).fill(newPassword);
	await page.getByRole("button", { name: "Sign in" }).click();
	await expect(page).toHaveURL(/\/profile$/);
});

test("requests a password reset without leaking account existence", async ({ page }) => {
	await page.goto("/forgot-password");
	await page.getByLabel("Email").fill("missing@example.com");
	await page.getByRole("button", { name: "Reset password" }).click();
	await expect(page.getByText(/If an account exists/)).toBeVisible();
});
