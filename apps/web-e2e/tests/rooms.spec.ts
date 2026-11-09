import { expect, test, type Page } from "@playwright/test";

const register = async (page: Page): Promise<void> => {
	const email = `rooms-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;

	await page.goto("/register");
	await page.getByLabel("Display name").fill("Room Host");
	await page.getByLabel("Email").fill(email);
	await page.getByLabel("Password", { exact: true }).fill("Password123!");
	await page.getByLabel("Confirm password").fill("Password123!");
	await page.getByRole("button", { name: "Create account" }).click();
	await expect(page).toHaveURL(/\/profile$/);
};

const createDraft = async (page: Page, title: string): Promise<void> => {
	await page.goto("/rooms/new");
	await page.getByLabel("Title").fill(title);
	await page.getByLabel("Motion").fill("This house would phase out fossil fuel subsidies");
	await page.getByLabel("Team size").fill("3");
	await page.getByLabel("Rounds").fill("3");
	await page.getByRole("button", { name: "Create draft" }).click();
	await expect(page).toHaveURL(/\/rooms\/[0-9a-f-]+$/);
	await expect(page.getByRole("heading", { name: title })).toBeVisible();
};

test("creates a draft, publishes it and shows it on the explore page", async ({ page }) => {
	await register(page);
	const title = `E2E Climate Debate ${Date.now()}`;
	await createDraft(page, title);

	await expect(page.getByText("Draft", { exact: true })).toBeVisible();

	await page.getByRole("button", { name: "Publish debate" }).click();
	await expect(page.getByText("Open", { exact: true })).toBeVisible();

	await page.goto("/");
	await expect(page.getByRole("heading", { name: "Open debates" })).toBeVisible();
	await expect(page.getByRole("link", { name: title })).toBeVisible();
});

test("edits a draft room", async ({ page }) => {
	await register(page);
	await createDraft(page, "Draft Before Edit");

	await page.getByRole("link", { name: "Edit debate" }).click();
	await expect(page).toHaveURL(/\/rooms\/[0-9a-f-]+\/edit$/);

	await page.getByLabel("Title").fill("Draft After Edit");
	await page.getByRole("button", { name: "Save changes" }).click();

	await expect(page).toHaveURL(/\/rooms\/[0-9a-f-]+$/);
	await expect(page.getByRole("heading", { name: "Draft After Edit" })).toBeVisible();
});

test("cancels a published room", async ({ page }) => {
	await register(page);
	await createDraft(page, "E2E Cancelled Debate");

	await page.getByRole("button", { name: "Publish debate" }).click();
	await expect(page.getByText("Open", { exact: true })).toBeVisible();

	await page.getByRole("button", { name: "Cancel debate" }).click();
	await expect(page.getByText("Cancelled", { exact: true })).toBeVisible();
});

test("filters rooms with debounced search", async ({ page }) => {
	await register(page);
	const title = `E2E Search Debate ${Date.now()}`;
	await createDraft(page, title);
	await page.getByRole("button", { name: "Publish debate" }).click();
	await expect(page.getByText("Open", { exact: true })).toBeVisible();

	await page.goto("/");
	const search = page.getByRole("combobox", { name: "Search debates" });

	await search.fill("no-such-room-xyz");
	await expect(page.getByText("No debates match your search.")).toBeVisible();

	await search.fill(title);
	await expect(page.getByRole("link", { name: title })).toBeVisible();

	await search.press("Enter");
	await search.fill("");
	await expect(page.getByRole("option", { name: title })).toBeVisible();
});
