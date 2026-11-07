import { expect, test, type Page } from "@playwright/test";

const ARGUMENT =
	"Mandatory voting strengthens civic responsibility and makes legislatures more representative of the population they serve.";

const register = async (page: Page, displayName: string): Promise<void> => {
	const email = `execution-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;

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
	await page.getByLabel("Rounds").fill("2");
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

const submitArgument = async (page: Page, roomUrl: string, content: string): Promise<void> => {
	await page.goto(roomUrl);
	await page.getByLabel("Your argument").fill(content);
	await page.getByRole("button", { name: "Submit argument" }).click();
	await expect(page.getByText("Your argument", { exact: true }).first()).toBeVisible();
};

test("starts a debate, accepts submissions and advances the round", async ({ browser }) => {
	const hostContext = await browser.newContext();
	const hostPage = await hostContext.newPage();
	await register(hostPage, "Execution Host");
	const roomUrl = await publishRoom(hostPage, `E2E Execution ${Date.now()}`);

	const memberOneContext = await browser.newContext();
	const memberOnePage = await memberOneContext.newPage();
	await joinAsParticipant(memberOnePage, roomUrl, "Exec Member One");

	const memberTwoContext = await browser.newContext();
	const memberTwoPage = await memberTwoContext.newPage();
	await joinAsParticipant(memberTwoPage, roomUrl, "Exec Member Two");

	await hostPage.reload();
	await hostPage.getByRole("button", { name: "Auto-assign teams" }).click();
	await hostPage.getByRole("button", { name: "Finalize teams" }).click();
	await expect(hostPage.getByText(/Teams finalized/).first()).toBeVisible();

	await hostPage.getByRole("button", { name: "Start debate" }).click();
	await expect(hostPage.getByText("Round 1", { exact: true })).toBeVisible();
	await expect(hostPage.getByText("Submissions open", { exact: true })).toBeVisible();
	await expect(hostPage.getByRole("button", { name: "Advance round" })).toBeDisabled();

	await submitArgument(memberOnePage, roomUrl, ARGUMENT);
	await submitArgument(memberTwoPage, roomUrl, ARGUMENT);

	await hostPage.reload();
	const advanceButton = hostPage.getByRole("button", { name: "Advance round" });
	await expect(advanceButton).toBeEnabled();
	await advanceButton.click();

	await expect(hostPage.getByText("Round 2", { exact: true })).toBeVisible();
	await expect(hostPage.getByText("Closed", { exact: true })).toBeVisible();
	await expect(hostPage.getByText("Submissions open", { exact: true })).toBeVisible();

	await memberOnePage.reload();
	await expect(memberOnePage.getByLabel("Your argument")).toBeVisible();

	await hostContext.close();
	await memberOneContext.close();
	await memberTwoContext.close();
});
