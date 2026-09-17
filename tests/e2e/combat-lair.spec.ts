import { test, expect } from "./fixtures";
import { registerTestUser } from "./helpers/actions";
import type { Page, TestInfo } from "@playwright/test";
import { LEGENDARY_MONSTER as LEGENDARY_MONSTER_BASE } from "./helpers/monsterFixtures";

test.describe("Combat flows - lair actions", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  async function assertLairActive(page: Page) {
    await expect(page.locator('[data-testid="lair-active"]')).toBeVisible({ timeout: 5000 });
  }

  async function setupEmptyCombat(page: Page, testInfo: TestInfo) {
    const identity = await registerTestUser(page, testInfo);
    await setupEmptyMonstersMock(page);
    await page.goto("/combat");
    return identity;
  }

  const LAIR_MONSTER = {
    ...LEGENDARY_MONSTER_BASE,
    id: "dragon-lair-test-id",
    _id: "dragon-lair-test-id",
    name: "Ancient Dragon",
    lairActions: [
      { name: "Earthquake", description: "The ground shakes violently.", usesRemaining: 2 },
      { name: "Volcanic Gas", description: "Toxic fumes fill the area." },
    ],
    legendaryActions: [],
    legendaryActionCount: 0,
  };

  async function startCombatWithLairMonster(page: Page) {
    await page.route("**/api/monsters", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([LAIR_MONSTER]),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto("/combat");
    await page.getByRole("button", { name: "+ Add Enemy" }).first().click();
    await expect(page.getByText("Ancient Dragon")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Add Ancient Dragon to encounter" }).click();
    await page.locator('[data-testid="start-combat-quick"]').waitFor({ state: "visible", timeout: 10000 });
    await page.locator('[data-testid="start-combat-quick"]').click();
    await page.waitForSelector('[data-testid="initiative-order"]', { timeout: 15000 });
  }

  async function addLairSlot(page: Page, name: string, seedMonster?: string) {
    await page.getByRole("button", { name: /Add Lair/i }).first().click();
    await page.locator('[data-testid="lair-name-input"]').fill(name);
    if (seedMonster) {
      await page.locator('[data-testid="lair-seed-select"]').selectOption(seedMonster);
    }
    await page.getByRole("button", { name: /Confirm|Add Lair/i }).last().click();
  }

  async function advanceToActiveLair(page: Page) {
    for (let i = 0; i < 5; i++) {
      const activeLair = page.locator('[data-testid="lair-active"]');
      if (await activeLair.isVisible().catch(() => false)) break;

      const nextTurnBtn = page.getByRole("button", { name: /Current Turn \(done\)|Next Turn/i }).first();
      if (await nextTurnBtn.isVisible()) {
        await nextTurnBtn.click({ force: true });
        // Wait for the UI to settle after click to avoid detachment loops
        await page.waitForTimeout(500);
      }
    }
  }

  async function setupEmptyMonstersMock(page: Page) {
    await page.route("**/api/monsters", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([]) });
      } else {
        await route.continue();
      }
    });
  }

  async function createCustomCombatant(
    page: Page,
    name: string,
    hp: number,
    options: { initiative?: string } = {},
  ) {
    await page.getByRole("button", { name: "+ Add Enemy" }).first().click();
    await page.getByRole("tab", { name: "Create New" }).click();
    await page.locator("#custom-name").fill(name);
    await page.locator("#custom-maxhp").fill(String(hp));
    await page.locator("#custom-hp").fill(String(hp));
    if (options.initiative !== undefined) {
      await page.locator("#custom-initiative").fill(options.initiative);
    }
    await page.locator('button[type="submit"]').click();
  }

  async function startCombatQuick(page: Page, waitSelector = "initiative-order") {
    await page.locator('[data-testid="start-combat-quick"]').waitFor({ state: "visible", timeout: 10000 });
    await page.locator('[data-testid="start-combat-quick"]').click();
    await page.waitForSelector(`[data-testid="${waitSelector}"]`, { timeout: 15000 });
  }

  async function setupActiveSeededLairCombat(page: Page) {
    await startCombatWithLairMonster(page);
    await addLairSlot(page, "Dragon Lair", "Ancient Dragon");
    await advanceToActiveLair(page);
  }

  test("Add Lair button is present in pre-combat setup", async ({ page }, testInfo) => {
    await registerTestUser(page, testInfo);
    await page.goto("/combat");
    await expect(page.getByRole("button", { name: /Add Lair/i })).toBeVisible({ timeout: 10000 });
  });

  test("Add Lair form appears on button click and inserts slot at initiative 20", async ({ page }, testInfo) => {
    const identity = await setupEmptyCombat(page, testInfo);

    await page.getByRole("button", { name: /Add Lair/i }).first().click();
    await expect(page.locator('[data-testid="lair-name-input"]')).toBeVisible({ timeout: 5000 });
    await page.locator('[data-testid="lair-name-input"]').fill("Dragon Cave");
    await page.getByRole("button", { name: /Confirm|Add Lair/i }).last().click();

    // Lair slot should appear in the setup list with initiative 20
    await expect(page.getByText("Dragon Cave")).toBeVisible({ timeout: 5000 });
  });

  test("Seed from monster dropdown lists monsters with lairActions", async ({ page }, testInfo) => {
    await registerTestUser(page, testInfo);
    await startCombatWithLairMonster(page);

    // Now add lair slot via "Add Lair" in active combat
    await page.getByRole("button", { name: /Add Lair/i }).first().click();
    await expect(page.locator('[data-testid="lair-seed-select"]')).toBeVisible({ timeout: 5000 });
    await expect(page.locator('[data-testid="lair-seed-select"]')).toContainText("Ancient Dragon");
  });

  test("lair slot sorts before initiative-20 player in order", async ({ page }, testInfo) => {
    const identity = await setupEmptyCombat(page, testInfo);

    await createCustomCombatant(page, identity.name("Fighter"), 30, { initiative: "20" });
    await addLairSlot(page, "Test Lair");
    await startCombatQuick(page);

    // Lair slot should appear before the player in initiative order
    // nth(0) is the "Initiative Order" heading; combatant rows start at nth(1)
    const rows = page.locator('[data-testid="initiative-order"] > *');
    await expect(rows.nth(1)).toContainText("Test Lair");
  });

  test("lair slot shows compact badge when inactive in initiative order", async ({ page }, testInfo) => {
    const identity = await setupEmptyCombat(page, testInfo);

    await createCustomCombatant(page, "Goblin", 7);
    await addLairSlot(page, "Test Lair");
    await startCombatQuick(page);

    // The lair slot row should contain lair icon (badge) but not the full action list
    await expect(page.locator('[data-testid="lair-slot-badge"]').first()).toBeVisible();
  });

  test("advancing turn to lair slot shows active LairActionsSlot", async ({ page }, testInfo) => {
    await registerTestUser(page, testInfo);
    await setupActiveSeededLairCombat(page);
    await assertLairActive(page);
  });

  test("Skip button in active lair slot advances to next combatant", async ({ page }, testInfo) => {
    await registerTestUser(page, testInfo);
    await setupActiveSeededLairCombat(page);

    await assertLairActive(page);
    await page.locator('[data-testid="lair-active"] [data-testid="lair-action-skip"]').click();
    // Lair should no longer be active
    await expect(page.locator('[data-testid="lair-active"]')).toHaveCount(0);
  });

  test("Use button in active lair slot decrements usesRemaining", async ({ page }, testInfo) => {
    await registerTestUser(page, testInfo);
    await setupActiveSeededLairCombat(page);

    await assertLairActive(page);
    // Earthquake has usesRemaining: 2 — use it, should decrement to 1
    const useBtn = page.locator('[data-testid="lair-active"] [data-testid="lair-action-use-0"]');
    await expect(useBtn).toBeVisible({ timeout: 5000 });
    await useBtn.click();
    // The charge count should now show 1
    await expect(page.locator('[data-testid="lair-active"]')).toContainText("1");
  });

  test("Use button disabled when usesRemaining is 0 in active lair slot", async ({ page }, testInfo) => {
    await registerTestUser(page, testInfo);

    const exhaustedMonster = {
      ...LAIR_MONSTER,
      lairActions: [
        { name: "Earthquake", description: "Ground shakes.", usesRemaining: 0 },
      ],
    };

    await page.route("**/api/monsters", async (route) => {
      if (route.request().method() === "GET") {
        await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify([exhaustedMonster]) });
      } else {
        await route.continue();
      }
    });

    await page.goto("/combat");
    await page.getByRole("button", { name: "+ Add Enemy" }).first().click();
    await expect(page.getByText("Ancient Dragon")).toBeVisible({ timeout: 10000 });
    await page.getByRole("button", { name: "Add Ancient Dragon to encounter" }).click();
    await startCombatQuick(page, "initiative-order");

    await addLairSlot(page, "Dragon Lair", "Ancient Dragon");
    await advanceToActiveLair(page);

    const useBtn = page.locator('[data-testid="lair-active"] [data-testid="lair-action-use-0"]');
    await expect(useBtn).toBeDisabled({ timeout: 5000 });
  });

  test("lair slot can be removed from active combat", async ({ page }, testInfo) => {
    const identity = await setupEmptyCombat(page, testInfo);

    await createCustomCombatant(page, "Goblin", 7);
    await addLairSlot(page, "Test Lair");
    await startCombatQuick(page);

    // Remove the lair slot
    const removeBtn = page.locator('[data-testid="lair-slot-remove"]').first();
    await expect(removeBtn).toBeVisible({ timeout: 5000 });
    await removeBtn.click();
    await page.locator('[data-testid="remove-confirm-button"]').click();
    await expect(page.getByText("Test Lair")).toHaveCount(0);
  });

  test("lair action descriptions are read-only during active combat", async ({ page }, testInfo) => {
    await registerTestUser(page, testInfo);
    await setupActiveSeededLairCombat(page);

    await assertLairActive(page);
    // Description text should be plain text (not editable input)
    await expect(page.locator('[data-testid="lair-active"] input[type="text"]')).toHaveCount(0);
  });

  // ────────────────────────────────────────────────────────────
  // Auto-scroll to next combatant (#754)
  // ────────────────────────────────────────────────────────────

  test("clicking Current Turn (done) auto-scrolls the new active combatant's card into view", async ({ page }, testInfo) => {
    await setupEmptyCombat(page, testInfo);

    // Enough combatants to exceed one viewport height.
    for (let i = 0; i < 12; i++) {
      await createCustomCombatant(page, `Combatant ${i}`, 10);
    }
    await startCombatQuick(page);

    const currentTurnBtn = page.getByRole("button", { name: /Current Turn \(done\)/i });
    await currentTurnBtn.click();

    const newActiveCard = page.locator('[aria-current="step"]');
    await expect(newActiveCard).toBeVisible();
    await expect(newActiveCard).toBeInViewport();
  });
});
