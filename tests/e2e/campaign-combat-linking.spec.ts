import type { Page } from "@playwright/test";
import { test, expect } from "./fixtures";
import { registerUser, createEncounter, STRONG_PASSWORD } from "./helpers/actions";
import { createTestIdentity } from "./helpers/isolation";

test.beforeEach(async ({ page }) => {
  await page.context().clearCookies();
});

async function seedActiveCampaign(page: Page, name: string): Promise<string> {
  const response = await page.request.post("/api/campaigns", {
    data: { name },
  });
  await expect(response).toBeOK();
  const created = await response.json();
  expect(created.id).toBeDefined();
  return created.id as string;
}

/**
 * Assert the page has navigated to an exact pathname, without constructing a
 * RegExp from a dynamic string (Codacy flags `new RegExp(nonLiteral)` as a
 * potential ReDoS source, even though these paths are server-generated UUIDs).
 */
async function expectPathname(page: Page, pathname: string): Promise<void> {
  await expect.poll(() => new URL(page.url()).pathname, { timeout: 15000 }).toBe(pathname);
}

test.describe("Campaign list — Start Combat routing", () => {
  test("clicking Start Combat on a campaign card reaches campaign-scoped combat setup, not the encounter browser", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    const campaignName = identity.name("Combat Routing Campaign");
    const campaignId = await seedActiveCampaign(page, campaignName);

    await page.goto("/campaigns");
    await expect(page.getByRole("link", { name: "Start Combat" })).toBeVisible({ timeout: 15000 });

    await page.getByRole("link", { name: "Start Combat" }).click();

    await expectPathname(page, `/campaigns/${campaignId}/combat`);
    await expect(page.getByRole("heading", { name: "Start New Combat" })).toBeVisible({ timeout: 15000 });

    // Encounters link, asserted only in unit tests otherwise, also routes correctly.
    // Scoped by href, not role name, because the global NavBar also has an "Encounters" link.
    await page.goto("/campaigns");
    await page.locator(`a[href="/campaigns/${campaignId}/encounters"]`).click();
    await expectPathname(page, `/campaigns/${campaignId}/encounters`);
    await expect(page.getByRole("heading", { name: "Encounters" })).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Campaign Encounters tab — link/unlink reflected in combat-setup picker", () => {
  test("linking an encounter surfaces it in From Library, unlinking removes it from the picker but not from /encounters", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    const campaignName = identity.name("Linking Campaign");
    const campaignId = await seedActiveCampaign(page, campaignName);
    const encounterName = identity.name("Goblin Ambush");
    await createEncounter(page, { name: encounterName });

    // Link the encounter via the campaign's Encounters tab
    await page.goto(`/campaigns/${campaignId}/encounters`);
    await page.getByRole("button", { name: "Link Existing Encounter" }).click();
    const linkRow = page.getByText(encounterName).locator("..");
    await linkRow.getByRole("button", { name: "Link" }).click();
    await expect(page.getByText(encounterName)).toBeVisible({ timeout: 15000 });

    // Confirm it appears in the combat-setup "From Library" picker
    await page.goto(`/campaigns/${campaignId}/combat`);
    await expect(page.getByRole("heading", { name: "From Library" })).toBeVisible({ timeout: 15000 });
    const librarySelect = page.locator("select").first();
    await expect(librarySelect.locator(`option:text("${encounterName}")`)).toHaveCount(1, { timeout: 15000 });

    // Unlink it from the campaign
    await page.goto(`/campaigns/${campaignId}/encounters`);
    page.once("dialog", (dialog) => dialog.accept());
    const linkedCard = page.getByRole("heading", { name: encounterName }).locator("../..");
    await linkedCard.getByRole("button", { name: "Unlink" }).click();
    await expect(page.getByText(encounterName)).not.toBeVisible({ timeout: 15000 });

    // Confirm it no longer appears in the combat-setup picker (page must have actually rendered first)
    await page.goto(`/campaigns/${campaignId}/combat`);
    await expect(page.getByRole("heading", { name: "From Library" })).toBeVisible({ timeout: 15000 });
    await expect(
      page.locator("select").first().locator(`option:text("${encounterName}")`)
    ).toHaveCount(0, { timeout: 15000 });

    // Confirm it still exists on the global /encounters list
    await page.goto("/encounters");
    await expect(page.getByText(encounterName)).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Ad hoc combat — unaffected by campaign scoping", () => {
  test("Quick Entry still starts combat successfully, and the picker is unaffected by a campaign's linked encounters", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);

    // Seed a campaign and link an encounter to it — this must have zero effect
    // on the ad hoc /combat picker, which is unscoped and pulls from /api/encounters.
    const campaignId = await seedActiveCampaign(page, identity.name("Unrelated Campaign"));
    const encounterName = identity.name("Ad Hoc Visible Encounter");
    await createEncounter(page, { name: encounterName });
    await page.goto(`/campaigns/${campaignId}/encounters`);
    await page.getByRole("button", { name: "Link Existing Encounter" }).click();
    const linkRow = page.getByText(encounterName).locator("..");
    await linkRow.getByRole("button", { name: "Link" }).click();
    await expect(page.getByText(encounterName)).toBeVisible({ timeout: 15000 });

    await page.goto("/combat");
    await expect(page.getByRole("heading", { name: "From Library" })).toBeVisible({ timeout: 15000 });
    await expect(
      page.locator("select").first().locator(`option:text("${encounterName}")`)
    ).toHaveCount(1, { timeout: 15000 });

    await page.getByRole("button", { name: "+ Add Enemy" }).first().click();
    await page.getByRole("tab", { name: "Create New" }).click();
    await page.locator("#custom-name").fill("Test Enemy");
    await page.locator('button[type="submit"]').click();

    await page
      .locator('[data-testid="start-combat-quick"]')
      .waitFor({ state: "visible", timeout: 10000 });
    await page.locator('[data-testid="start-combat-quick"]').click();

    await page.waitForSelector('[data-testid="combat-screen"]', { timeout: 15000 });
    await expect(page.locator('[data-testid="combat-screen"]')).toBeVisible();
  });
});
