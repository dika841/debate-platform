import { expect, test } from "@playwright/test";

test("renders the landing page", async ({ page }) => {
	await page.goto("/");
	await expect(page.getByRole("heading", { name: "Debate Platform" })).toBeVisible();
	await expect(page.getByRole("contentinfo")).toContainText("Challenge Ideas, Not People.");
});

test("opens the mobile navigation", async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto("/");

	await page.getByRole("button", { name: "Open navigation" }).click();
	await expect(page.getByRole("menuitem", { name: "Explore" })).toBeVisible();

	await page.getByRole("menuitem", { name: "Health" }).click();
	await expect(page).toHaveURL(/\/health$/);
});
