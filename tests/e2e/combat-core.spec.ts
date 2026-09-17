import { test, expect } from "./fixtures";
import {
  registerTestUser,
  createEncounter,
  openCombat,
  verifyCombatScreenElements,
} from "./helpers/actions";

test.describe("Combat flows - core screen and HP", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  // ────────────────────────────────────────────────────────────
  // Combat screen
  // ────────────────────────────────────────────────────────────

  test("user can open combat screen for an encounter", async ({
    page,
  }, testInfo) => {
    const identity = await registerTestUser(page, testInfo);
    await createEncounter(page, { name: identity.name("Test Encounter") });
    await openCombat(page);
    await expect(page).toHaveURL(/\/combat/);
  });

  test("combat screen displays required UI elements", async ({
    page,
  }, testInfo) => {
    const identity = await registerTestUser(page, testInfo);
    await createEncounter(page, { name: identity.name("Combat UI Test") });
    await openCombat(page);
    await verifyCombatScreenElements(page);
  });

  // ────────────────────────────────────────────────────────────
  // Temp HP tracking
  // ────────────────────────────────────────────────────────────

  test("temp HP absorbs damage correctly and clears on combat end", async ({
    page,
  }, testInfo) => {
    const identity = await registerTestUser(page, testInfo);

    // Set up combat with one custom combatant (hp=30, maxHp=40)
    await page.goto("/combat");
    await page.getByRole("button", { name: "+ Add Enemy" }).first().click();
    await page.getByRole("tab", { name: "Create New" }).click();
    await page.locator("#custom-name").fill(identity.name("Test Fighter"));
    await page.locator("#custom-maxhp").fill("40");
    await page.locator("#custom-hp").fill("30");
    await page.locator('button[type="submit"]').click();
    await page.locator('[data-testid="start-combat-quick"]').waitFor({ state: "visible", timeout: 10000 });
    await page.locator('[data-testid="start-combat-quick"]').click();
    await page.waitForSelector('[data-testid="initiative-order"]', { timeout: 15000 });

    // The combatant has no initiativeRoll yet, so the initiative modal
    // auto-opens overlaying the card; dismiss it before interacting with the
    // card's own HP controls underneath.
    await page.keyboard.press("Escape");
    await page.locator('[data-testid="initiative-modal"]').waitFor({ state: "hidden", timeout: 5000 });

    // Find the combatant card's HP input — one combatant, one number input
    const hpInput = page.locator('input[placeholder="0"]').first();

    // Enable Temp mode, enter 14, click "Set Temp"
    await page.getByLabel("Temp", { exact: true }).first().check();
    await hpInput.fill("14");
    await page.getByRole("button", { name: "Set Temp" }).first().click();

    // Assert "+14 tmp" visible in HP display and temp HP bar visible
    await expect(page.getByText("14 tmp", { exact: false })).toBeVisible();
    await expect(page.locator('[data-testid="temp-hp-bar"]').first()).toBeVisible();

    // Enter 10 damage → 10 absorbed by temp HP (4 remaining), regular HP unchanged at 30
    await page.getByLabel("Temp", { exact: true }).first().uncheck();
    await hpInput.fill("10");
    await page.getByRole("button", { name: "Damage" }).first().click();
    await expect(page.getByText("4 tmp", { exact: false })).toBeVisible();
    // The HP span text content contains the current hp value
    await expect(page.getByText(/Current:.*30/).first()).toBeVisible();

    // Enter 10 damage → 4 absorbed, 6 overflow to regular HP (30 - 6 = 24)
    await hpInput.fill("10");
    await page.getByRole("button", { name: "Damage" }).first().click();
    await expect(page.locator('[data-testid="temp-hp-bar"]')).toHaveCount(0);
    await expect(page.getByText(/Current:.*24/).first()).toBeVisible();

    // End combat — accept the confirm dialog, then assert setup screen returns
    page.on("dialog", (dialog) => dialog.accept());
    await page.getByRole("button", { name: "End Combat" }).click();
    await expect(page.getByRole("heading", { name: "Start New Combat" })).toBeVisible({ timeout: 10000 });
  });
});
