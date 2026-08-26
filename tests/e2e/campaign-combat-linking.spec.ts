import { test, expect } from "./fixtures";
import { registerUser, createEncounter, STRONG_PASSWORD } from "./helpers/actions";
import { createTestIdentity } from "./helpers/isolation";

test.beforeEach(async ({ page }) => {
  await page.context().clearCookies();
});

async function seedActiveCampaign(
  page: import("@playwright/test").Page,
  name: string,
): Promise<string> {
  const response = await page.request.post("/api/campaigns", {
    data: { name },
  });
  expect(response).toBeOK();
  const created = await response.json();
  expect(created.id).toBeDefined();
  return created.id as string;
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

    await expect(page).toHaveURL(new RegExp(`/campaigns/${campaignId}/combat$`));
    await expect(page.getByRole("heading", { name: "Start New Combat" })).toBeVisible({ timeout: 15000 });
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
    const encounterSelect = page.locator("select").filter({ has: page.locator(`option:text("${encounterName}")`) });
    await expect(encounterSelect).toHaveCount(1, { timeout: 15000 });

    // Unlink it from the campaign
    await page.goto(`/campaigns/${campaignId}/encounters`);
    page.once("dialog", (dialog) => dialog.accept());
    const linkedCard = page.getByRole("heading", { name: encounterName }).locator("../..");
    await linkedCard.getByRole("button", { name: "Unlink" }).click();
    await expect(page.getByText(encounterName)).not.toBeVisible({ timeout: 15000 });

    // Confirm it no longer appears in the combat-setup picker
    await page.goto(`/campaigns/${campaignId}/combat`);
    await expect(
      page.locator("select").filter({ has: page.locator(`option:text("${encounterName}")`) })
    ).toHaveCount(0, { timeout: 15000 });

    // Confirm it still exists on the global /encounters list
    await page.goto("/encounters");
    await expect(page.getByText(encounterName)).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Ad hoc combat — unaffected by campaign scoping", () => {
  test("Quick Entry still starts combat successfully with zero campaign-linked encounters", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);

    await page.goto("/combat");
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
