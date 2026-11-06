import { expect, test } from "@playwright/test";

test("renders the landing page", async ({ page }) => {
	await page.goto("/");
	await expect(page.getByRole("heading", { name: "Debate Platform" })).toBeVisible();
	await expect(page.getByRole("contentinfo")).toContainText("Challenge Ideas, Not People.");
});
