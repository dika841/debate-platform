import { expect, test, type Page } from "@playwright/test";

const ARGUMENT =
	"Mandatory voting strengthens civic responsibility and makes legislatures more representative of the population they serve.";

const register = async (page: Page, displayName: string): Promise<void> => {
	const email = `results-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;

	await page.goto("/register");
	await page.getByLabel("Display name").fill(displayName);
	await page.getByLabel("Email").fill(email);
	await page.getByLabel("Password", { exact: true }).fill("Password123!");
	await page.getByLabel("Confirm password").fill("Password123!");
	await page.getByRole("button", { name: "Create account" }).click();
	await expect(page).toHaveURL(/\/profile$/);
};

const publishRoom = async (page: Page, title: string): Promise<string> => {
	await page.goto("/rooms/new");
	await page.getByLabel("Title").fill(title);
	await page.getByLabel("Motion").fill("This house would make voting mandatory");
	await page.getByLabel("Team size").fill("1");
	await page.getByLabel("Rounds").fill("1");
	await page.getByRole("button", { name: "Create draft" }).click();
	await expect(page).toHaveURL(/\/rooms\/[0-9a-f-]+$/);

	await page.getByRole("button", { name: "Publish debate" }).click();
	await expect(page.getByText("Open", { exact: true })).toBeVisible();

	return page.url();
};

const join = async (
	page: Page,
	roomUrl: string,
	displayName: string,
	role: "participant" | "spectator",
): Promise<void> => {
	await register(page, displayName);
	await page.goto(roomUrl);
	await page
		.getByRole("button", {
			name: role === "participant" ? "Join as participant" : "Join as spectator",
		})
		.click();
	await expect(page.getByRole("button", { name: "Leave debate" })).toBeVisible();
};

test("finalizes round and room results and submits a report", async ({ browser }) => {
	const hostContext = await browser.newContext();
	const hostPage = await hostContext.newPage();
	await register(hostPage, "Results Host");
	const roomUrl = await publishRoom(hostPage, `E2E Results ${Date.now()}`);

	const memberOneContext = await browser.newContext();
	const memberOnePage = await memberOneContext.newPage();
	await join(memberOnePage, roomUrl, "Results Member One", "participant");

	const memberTwoContext = await browser.newContext();
	const memberTwoPage = await memberTwoContext.newPage();
	await join(memberTwoPage, roomUrl, "Results Member Two", "participant");

	const spectatorContext = await browser.newContext();
	const spectatorPage = await spectatorContext.newPage();
	await join(spectatorPage, roomUrl, "Results Spectator", "spectator");

	await hostPage.reload();
	await hostPage.getByRole("button", { name: "Auto-assign teams" }).click();
	await hostPage.getByRole("button", { name: "Finalize teams" }).click();
	await hostPage.getByRole("button", { name: "Start debate" }).click();

	for (const page of [memberOnePage, memberTwoPage]) {
		await page.goto(roomUrl);
		await page.getByLabel("Your argument").fill(ARGUMENT);
		await page.getByRole("button", { name: "Submit argument" }).click();
		await expect(page.getByText("Your argument", { exact: true }).first()).toBeVisible();
	}

	await hostPage.reload();
	await hostPage.getByRole("button", { name: "Start voting" }).click();
	await expect(hostPage.getByText("Voting open", { exact: true })).toBeVisible();

	await spectatorPage.reload();
	await spectatorPage.getByRole("button", { name: "Vote PRO" }).click();
	await expect(spectatorPage.getByText("Your vote: PRO")).toBeVisible();

	await hostPage.reload();
	await hostPage.getByRole("button", { name: "Close voting" }).click();
	await expect(hostPage.getByText("Closed", { exact: true })).toBeVisible();

	await hostPage.reload();
	await hostPage.getByRole("button", { name: "Finalize round" }).click();
	await expect(hostPage.getByText("PRO 1 · CONTRA 0 · 1 votes")).toBeVisible();

	await hostPage.getByRole("button", { name: "Finalize debate" }).click();
	await expect(hostPage.getByText("Winner: PRO")).toBeVisible();
	await expect(hostPage.getByText("Completed", { exact: true })).toBeVisible();

	await memberOnePage.goto(roomUrl);
	await memberOnePage.getByLabel("Category").click();
	await memberOnePage.getByRole("option", { name: "Spam" }).click();
	await memberOnePage
		.getByLabel("Details")
		.fill("This argument is repeated advertising spam across several rounds.");
	await memberOnePage.getByRole("button", { name: "Submit report" }).click();
	await expect(memberOnePage.getByText(/Report submitted/)).toBeVisible();

	await hostContext.close();
	await memberOneContext.close();
	await memberTwoContext.close();
	await spectatorContext.close();
});
