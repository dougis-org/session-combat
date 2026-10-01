import { test, expect } from "./fixtures";
import { registerUser, createEncounter, seedCharacter, STRONG_PASSWORD } from "./helpers/actions";
import { createTestIdentity } from "./helpers/isolation";

test.beforeEach(async ({ page }) => {
  await page.context().clearCookies();
});

test.describe("Combat setup — encounter picker sort and search", () => {
  test("search narrows the encounter select and the filtered encounter can be chosen", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    const goblin = identity.name("Goblin Ambush");
    const owlbear = identity.name("Owlbear Den");
    await seedCharacter(page, { name: identity.name("Picker Hero") });
    await createEncounter(page, { name: owlbear });
    await createEncounter(page, { name: goblin });

    await page.goto("/combat");
    const search = page.getByRole("textbox", { name: "Search encounters" });
    await expect(search).toBeVisible({ timeout: 15000 });

    const select = page.locator("select").filter({ has: page.locator("option", { hasText: "No encounter" }) }).first();
    await expect(select.locator("option", { hasText: goblin })).toHaveCount(1);
    await expect(select.locator("option", { hasText: owlbear })).toHaveCount(1);

    await search.fill("goblin ambush");
    await expect(select.locator("option", { hasText: owlbear })).toHaveCount(0);
    await select.selectOption({ label: goblin });
    await expect(select).toHaveValue(/.+/);

    await page.getByRole("button", { name: "Start Combat" }).first().click();
    await expect(page.getByTestId("initiative-order")).toBeVisible({ timeout: 15000 });
  });

  test("campaign-scoped combat setup shows the search input", async ({ page }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    const createdCampaign = await page.request.post("/api/campaigns", {
      data: { name: identity.name("Picker Campaign") },
    });
    await expect(createdCampaign).toBeOK();
    const { id: campaignId } = await createdCampaign.json();

    const encounterName = identity.name("Linked Encounter");
    await createEncounter(page, { name: encounterName });
    const encounters = await (await page.request.get("/api/encounters")).json();
    const encounter = encounters.find((e: { name: string }) => e.name === encounterName);
    const linked = await page.request.post(`/api/campaigns/${campaignId}/encounters`, {
      data: { encounterId: encounter.id },
    });
    await expect(linked).toBeOK();

    await page.goto(`/campaigns/${campaignId}/combat`);
    await expect(page.getByRole("textbox", { name: "Search encounters" })).toBeVisible({ timeout: 15000 });
  });
});
