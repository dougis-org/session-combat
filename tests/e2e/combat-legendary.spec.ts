import { test, expect } from "./fixtures";
import {
  registerTestUser,
  createCharacter,
  createParty,
  createEncounter,
  openCombat,
  verifyCombatScreenElements,
} from "./helpers/actions";
import type { Page } from "@playwright/test";
import { LEGENDARY_MONSTER } from "./helpers/monsterFixtures";

test.describe("Combat flows - legendary actions and end-to-end", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  // ────────────────────────────────────────────────────────────
  // Legendary action tracking
  // ────────────────────────────────────────────────────────────

  async function addLegendaryMonsterToCombat(page: Page) {
    // Mock /api/monsters to include the legendary monster
    await page.route("**/api/monsters", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([LEGENDARY_MONSTER]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/combat");
    await page.getByRole("button", { name: "+ Add Enemy" }).first().click();
    // "Monsters" tab is default; wait for Aboleth to appear
    await expect(page.getByText("Aboleth")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Add Aboleth to encounter" }).click();
    await page.locator('[data-testid="start-combat-quick"]').waitFor({ state: "visible", timeout: 10000 });
    await page.locator('[data-testid="start-combat-quick"]').click();
    await page.waitForSelector('[data-testid="initiative-order"]', { timeout: 15000 });
  }

  test("legendary monster badge visible in combatant row with correct count", async ({
    page,
  }, testInfo) => {
    await registerTestUser(page, testInfo);
    await addLegendaryMonsterToCombat(page);

    const badge = page.locator('[data-testid="legendary-action-badge"]').first();
    await expect(badge).toBeVisible();
    await expect(badge).toContainText("⚡ 3/3");
  });

  test("clicking Use decrements legendary actions remaining and badge updates", async ({
    page,
  }, testInfo) => {
    await registerTestUser(page, testInfo);
    await addLegendaryMonsterToCombat(page);

    // Open detail panel
    await page.locator('[data-testid="combatant-detail-toggle"]').first().click();

    // Click the first Use button
    const useBtn = page.locator('[data-testid="legendary-action-use-0"]').first();
    await expect(useBtn).toBeVisible({ timeout: 5000 });
    await expect(useBtn).toBeEnabled();
    await useBtn.click();

    // Badge should now show 2/3
    const badge = page.locator('[data-testid="legendary-action-badge"]').first();
    await expect(badge).toContainText("⚡ 2/3");
  });

  test("Restore All resets legendary actions remaining to pool", async ({
    page,
  }, testInfo) => {
    await registerTestUser(page, testInfo);
    await addLegendaryMonsterToCombat(page);

    // Open detail panel and use one action
    await page.locator('[data-testid="combatant-detail-toggle"]').first().click();
    await page.locator('[data-testid="legendary-action-use-0"]').first().click();
    const badge = page.locator('[data-testid="legendary-action-badge"]').first();
    await expect(badge).toContainText("⚡ 2/3");

    // Restore All
    await page.locator('[data-testid="legendary-action-restore"]').first().click();
    await expect(badge).toContainText("⚡ 3/3");
  });

  test("pool editor [+] and [−] adjust legendaryActionCount and remaining", async ({
    page,
  }, testInfo) => {
    await registerTestUser(page, testInfo);
    await addLegendaryMonsterToCombat(page);

    // Open detail panel
    await page.locator('[data-testid="combatant-detail-toggle"]').first().click();

    const poolEditor = page.locator('[data-testid="legendary-action-pool-editor"]').first();
    await expect(poolEditor).toBeVisible({ timeout: 5000 });

    // Click [−] to reduce pool from 3 to 2; remaining clamps to new count (3→2)
    await poolEditor.getByRole("button", { name: "Decrease legendary action pool" }).click();
    const badge = page.locator('[data-testid="legendary-action-badge"]').first();
    await expect(badge).toContainText("⚡ 2/2");

    // Click [+] to increase pool from 2 to 3; remaining stays at 2 (no implicit restore)
    await poolEditor.getByRole("button", { name: "Increase legendary action pool" }).click();
    await expect(badge).toContainText("⚡ 2/3");
  });

  test("advancing turn to legendary combatant resets remaining to pool", async ({
    page,
  }, testInfo) => {
    await registerTestUser(page, testInfo);

    // Add a second (non-legendary) combatant so we can advance turns
    await page.route("**/api/monsters", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([LEGENDARY_MONSTER]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/combat");

    // Add Aboleth from library
    await page.getByRole("button", { name: "+ Add Enemy" }).first().click();
    await expect(page.getByText("Aboleth")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Add Aboleth to encounter" }).click();

    // Add a custom combatant (non-legendary)
    await page.getByRole("button", { name: "+ Add Enemy" }).first().click();
    await page.getByRole("tab", { name: "Create New" }).click();
    await page.locator("#custom-name").fill("Goblin");
    await page.locator("#custom-maxhp").fill("7");
    await page.locator("#custom-hp").fill("7");
    await page.locator('button[type="submit"]').click();

    // Start combat
    await page.locator('[data-testid="start-combat-quick"]').waitFor({ state: "visible", timeout: 10000 });
    await page.locator('[data-testid="start-combat-quick"]').click();
    await page.waitForSelector('[data-testid="initiative-order"]', { timeout: 15000 });

    // Open Aboleth detail panel and use 2 actions
    const aboletCard = page.locator('[data-testid="initiative-order"] > *').filter({ hasText: "Aboleth" });
    const detailToggle = aboletCard.locator('[data-testid="combatant-detail-toggle"]');
    await detailToggle.click();
    const useBtn = page.locator('[data-testid="legendary-action-use-0"]').first();
    await expect(useBtn).toBeVisible({ timeout: 5000 });
    await useBtn.click();
    await useBtn.click();

    const badge = page.locator('[data-testid="legendary-action-badge"]').first();
    await expect(badge).toContainText("⚡ 1/3");

    // Close detail panel and advance turns until we come back to Aboleth
    await page.keyboard.press("Escape");

    await expect(page.locator('[aria-current="step"]')).toBeVisible();
    const currentActive = await page.locator('[aria-current="step"]').innerText();
    const currentTurnBtn = page.getByRole("button", { name: /Current Turn \(done\)/i });

    if (currentActive.includes("Aboleth")) {
      await currentTurnBtn.click();
      await expect(page.locator('[aria-current="step"]')).not.toContainText("Aboleth");
      await currentTurnBtn.click();
      await expect(page.locator('[aria-current="step"]')).toContainText("Aboleth");
    } else {
      await currentTurnBtn.click();
      await expect(page.locator('[aria-current="step"]')).toContainText("Aboleth");
    }

    // After cycling back to Aboleth, remaining should be reset to 3
    await expect(badge).toContainText("⚡ 3/3");
  });

  test("complete end-to-end flow from registration to combat", async ({
    page,
  }, testInfo) => {
    const identity = await registerTestUser(page, testInfo);
    await expect(page).not.toHaveURL(/\/register/);

    await createCharacter(page, {
      name: identity.name("Thorin"),
      class: "Barbarian",
      race: "Dwarf",
    });
    await expect(page).not.toHaveURL(/\/characters\/create/);

    await createParty(page, {
      name: identity.name("Dwarven Company"),
      memberNames: [identity.name("Thorin")],
    });
    await expect(page).not.toHaveURL(/\/parties\/create/);

    await createEncounter(page, { name: identity.name("Dragon Attack") });
    await expect(page).not.toHaveURL(/\/encounters\/create/);

    await openCombat(page);
    await expect(page).toHaveURL(/\/combat/);

    await verifyCombatScreenElements(page);
  });
});
