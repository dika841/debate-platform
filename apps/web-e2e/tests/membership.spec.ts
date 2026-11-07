import { expect, test, type Page } from "@playwright/test";

const register = async (page: Page, displayName: string): Promise<void> => {
	const email = `membership-${Date.now()}-${Math.random().toString(16).slice(2)}@example.com`;

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
	await page.getByLabel("Team size").fill("3");
	await page.getByRole("button", { name: "Create draft" }).click();
	await expect(page).toHaveURL(/\/rooms\/[0-9a-f-]+$/);

	await page.getByRole("button", { name: "Publish debate" }).click();
	await expect(page.getByText("Open", { exact: true })).toBeVisible();

	return page.url();
};

test("joins and leaves a published room", async ({ browser }) => {
	const hostContext = await browser.newContext();
	const hostPage = await hostContext.newPage();
	await register(hostPage, "Membership Host");
	const title = `E2E Membership ${Date.now()}`;
	const roomUrl = await publishRoom(hostPage, title);

	const memberContext = await browser.newContext();
	const memberPage = await memberContext.newPage();
	await register(memberPage, "Membership Member");
	await memberPage.goto(roomUrl);
	await expect(memberPage.getByRole("heading", { name: title })).toBeVisible();

	await memberPage.getByRole("button", { name: "Join as participant" }).click();
	await expect(memberPage.getByRole("button", { name: "Leave debate" })).toBeVisible();
	await expect(memberPage.getByText("Participant", { exact: true })).toBeVisible();

	await hostPage.reload();
	await expect(hostPage.getByText(/Participants:\s*1\/6/)).toBeVisible();

	await memberPage.getByRole("button", { name: "Leave debate" }).click();
	await expect(memberPage.getByRole("button", { name: "Join as participant" })).toBeVisible();

	await hostPage.reload();
	await expect(hostPage.getByText(/Participants:\s*0\/6/)).toBeVisible();

	await hostContext.close();
	await memberContext.close();
});

test("lets anonymous visitors see the roster but asks them to sign in to join", async ({
	browser,
}) => {
	const hostContext = await browser.newContext();
	const hostPage = await hostContext.newPage();
	await register(hostPage, "Roster Host");
	const roomUrl = await publishRoom(hostPage, `E2E Roster ${Date.now()}`);
	await hostContext.close();

	const guestContext = await browser.newContext();
	const guestPage = await guestContext.newPage();
	await guestPage.goto(roomUrl);

	await expect(guestPage.getByText("Participants & spectators")).toBeVisible();
	await expect(guestPage.getByText("Host", { exact: true })).toBeVisible();
	await expect(guestPage.getByRole("link", { name: "Sign in to join" })).toBeVisible();

	await guestContext.close();
});
