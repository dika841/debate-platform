import { expect, test, type Page } from "@playwright/test";

const register = async (page: Page, displayName: string): Promise<void> => {
	const email = `assignment-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;

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
	await page.getByLabel("Motion").fill("This house would abolish homework");
	await page.getByLabel("Team size").fill("1");
	await page.getByRole("button", { name: "Create draft" }).click();
	await expect(page).toHaveURL(/\/rooms\/[0-9a-f-]+$/);

	await page.getByRole("button", { name: "Publish debate" }).click();
	await expect(page.getByText("Open", { exact: true })).toBeVisible();

	return page.url();
};

const joinAsParticipant = async (
	page: Page,
	roomUrl: string,
	displayName: string,
): Promise<void> => {
	await register(page, displayName);
	await page.goto(roomUrl);
	await page.getByRole("button", { name: "Join as participant" }).click();
	await expect(page.getByRole("button", { name: "Leave debate" })).toBeVisible();
};

test("auto-assigns, finalizes and locks teams", async ({ browser }) => {
	const hostContext = await browser.newContext();
	const hostPage = await hostContext.newPage();
	await register(hostPage, "Assignment Host");
	const roomUrl = await publishRoom(hostPage, `E2E Assignment ${Date.now()}`);

	const memberOneContext = await browser.newContext();
	const memberOnePage = await memberOneContext.newPage();
	await joinAsParticipant(memberOnePage, roomUrl, "Member One");

	await hostPage.reload();
	await hostPage.getByRole("button", { name: "Auto-assign teams" }).click();
	await expect(hostPage.getByRole("button", { name: "Finalize teams" })).toBeDisabled();

	const memberTwoContext = await browser.newContext();
	const memberTwoPage = await memberTwoContext.newPage();
	await joinAsParticipant(memberTwoPage, roomUrl, "Member Two");

	await hostPage.reload();
	await hostPage.getByRole("button", { name: "Auto-assign teams" }).click();

	const finalizeButton = hostPage.getByRole("button", { name: "Finalize teams" });
	await expect(finalizeButton).toBeEnabled();
	await finalizeButton.click();

	await expect(hostPage.getByText("Teams finalized", { exact: false }).first()).toBeVisible();
	await expect(
		hostPage.getByText("Team assignments are locked. Joining and leaving are disabled."),
	).toBeVisible();

	await memberOnePage.reload();
	await expect(memberOnePage.getByText(/Your team:/)).toBeVisible();
	await expect(memberOnePage.getByRole("button", { name: "Leave debate" })).toHaveCount(0);

	await hostContext.close();
	await memberOneContext.close();
	await memberTwoContext.close();
});
