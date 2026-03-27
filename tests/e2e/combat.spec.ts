import { test, expect } from "./fixtures";
import {
  registerUser,
  createCharacter,
  createParty,
  importMonster,
  createEncounter,
  openCombat,
  verifyCombatScreenElements,
} from "./helpers/actions";
import {
  createDuplicateNameConflictPayload,
  createImportedCharacterApiPayload,
  createPersistedImportedCharacter,
  DND_BEYOND_CHARACTER_URL,
  EXISTING_IMPORTED_CHARACTER_ID,
  IMPORT_WARNING,
} from "@/tests/helpers/dndBeyondImport";
import { createTestIdentity } from "./helpers/isolation";

const STRONG_PASSWORD = "TestPassword123!";

test.describe("Combat flows", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("registered user can import a D&D Beyond character after resolving a duplicate-name conflict", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);

    let characters = [
      createPersistedImportedCharacter({
        id: EXISTING_IMPORTED_CHARACTER_ID,
        userId: "test-user-id",
        ac: 15,
        hp: 30,
        maxHp: 30,
        abilityScores: {
          strength: 10,
          dexterity: 14,
          constitution: 12,
          intelligence: 13,
          wisdom: 10,
          charisma: 16,
        },
        classes: [{ class: "Warlock", level: 3 }],
      }),
    ];

    await page.route("**/api/characters", async (route) => {
      const request = route.request();
      if (request.method() === "GET") {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(characters),
        });
        return;
      }

      await route.continue();
    });

    await page.route("**/api/characters/import", async (route) => {
      const request = route.request();
      const body = request.postDataJSON() as {
        url?: string;
        overwrite?: boolean;
      };

      expect(body.url).toBe(DND_BEYOND_CHARACTER_URL);

      if (!body.overwrite) {
        await route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify(
            createDuplicateNameConflictPayload({ warnings: [IMPORT_WARNING] }),
          ),
        });
        return;
      }

      characters = [
        createPersistedImportedCharacter({
          id: EXISTING_IMPORTED_CHARACTER_ID,
          userId: "test-user-id",
          ac: 18,
        }),
      ];

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(
          createImportedCharacterApiPayload({
            character: characters[0],
            warnings: [IMPORT_WARNING],
          }),
        ),
      });
    });

    await page.goto("/characters");
    await expect(
      page.getByRole("heading", { name: "Characters" }),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Import from D&D Beyond" })
      .first()
      .click();
    await page.locator("#dnd-beyond-url").fill(DND_BEYOND_CHARACTER_URL);
    await page
      .getByRole("button", { name: "Import from D&D Beyond" })
      .last()
      .click();

    await expect(page.getByText(/Character already exists/i)).toBeVisible();
    await expect(
      page.getByText(/Alignment was not supported and was omitted\./i),
    ).toBeVisible();

    await page
      .getByRole("button", { name: "Overwrite Existing Character" })
      .click();

    await expect(page.getByText(/Import warnings/i)).toBeVisible();
    await expect(page.getByText(/Rogue Level 5/i)).toBeVisible();
    await expect(page.getByText(/Warlock Level 7/i)).toBeVisible();
    await expect(page.locator("#dnd-beyond-url")).toHaveCount(0);
  });

  // ────────────────────────────────────────────────────────────
  // Character creation
  // ────────────────────────────────────────────────────────────

  test("registered user can create a character", async ({ page }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    await createCharacter(page, {
      name: identity.name("Aragorn"),
      class: "Fighter",
      race: "Human",
    });
    await expect(page).not.toHaveURL(/\/characters\/create/);
  });

  test("multiple characters can be created", async ({ page }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    await createCharacter(page, {
      name: identity.name("Legolas"),
      class: "Ranger",
      race: "Elf",
    });
    await createCharacter(page, {
      name: identity.name("Gimli"),
      class: "Barbarian",
      race: "Dwarf",
    });
    await expect(page).not.toHaveURL(/\/create/);
  });

  // ────────────────────────────────────────────────────────────
  // Party creation
  // ────────────────────────────────────────────────────────────

  test("user can create a party", async ({ page }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    await createParty(page, {
      name: identity.name("Fellowship"),
      memberCount: 4,
    });
    await expect(page).not.toHaveURL(/\/parties\/create/);
  });

  test("party with different member counts can be created", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    await createParty(page, {
      name: identity.name("Small Group"),
      memberCount: 2,
    });
    await createParty(page, {
      name: identity.name("Large Group"),
      memberCount: 6,
    });
    await expect(page).not.toHaveURL(/\/create/);
  });

  // ────────────────────────────────────────────────────────────
  // Monster import
  // ────────────────────────────────────────────────────────────

  test("user can import monsters from file", async ({ page }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    await importMonster(page, "samples/monster-upload-example.json");
    await expect(page).not.toHaveURL(/\/monsters\/import/);
  });

  // ────────────────────────────────────────────────────────────
  // Encounter creation
  // ────────────────────────────────────────────────────────────

  test("user can create an encounter", async ({ page }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    await createEncounter(page, { name: identity.name("Goblin Ambush") });
    await expect(page).not.toHaveURL(/\/encounters\/create/);
  });

  // ────────────────────────────────────────────────────────────
  // Combat screen
  // ────────────────────────────────────────────────────────────

  test("user can open combat screen for an encounter", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    await createEncounter(page, { name: identity.name("Test Encounter") });
    await openCombat(page);
    await expect(page).toHaveURL(/\/combat/);
  });

  test("combat screen displays required UI elements", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    await createEncounter(page, { name: identity.name("Combat UI Test") });
    await openCombat(page);
    await verifyCombatScreenElements(page);
  });

  // ────────────────────────────────────────────────────────────
  // End-to-end flow
  // ────────────────────────────────────────────────────────────

  // ────────────────────────────────────────────────────────────
  // Temp HP tracking
  // ────────────────────────────────────────────────────────────

  test("temp HP absorbs damage correctly and clears on combat end", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);

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
    await page.waitForSelector('[data-testid="combatants-list"]', { timeout: 15000 });

    // Find the combatant card's HP input — one combatant, one number input
    const hpInput = page.locator('input[placeholder="0"]').first();

    // Enable Temp mode, enter 14, click "Set Temp"
    await page.getByLabel("Temp").first().check();
    await hpInput.fill("14");
    await page.getByRole("button", { name: "Set Temp" }).first().click();

    // Assert "+14 tmp" visible in HP display and temp HP bar visible
    await expect(page.getByText("14 tmp", { exact: false })).toBeVisible();
    await expect(page.locator('[data-testid="temp-hp-bar"]').first()).toBeVisible();

    // Enter 10 damage → 10 absorbed by temp HP (4 remaining), regular HP unchanged at 30
    await page.getByLabel("Temp").first().uncheck();
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

  // ────────────────────────────────────────────────────────────
  // Legendary action tracking
  // ────────────────────────────────────────────────────────────

  const LEGENDARY_MONSTER = {
    id: "aboleth-test-id",
    _id: "aboleth-test-id",
    userId: "GLOBAL",
    name: "Aboleth",
    size: "large" as const,
    type: "aberration",
    alignment: "lawful evil",
    ac: 17,
    hp: 135,
    maxHp: 135,
    speed: "10 ft., swim 40 ft.",
    abilityScores: { strength: 21, dexterity: 9, constitution: 15, intelligence: 18, wisdom: 15, charisma: 18 },
    savingThrows: {},
    skills: { history: 12, perception: 10 },
    senses: { passive_perception: "20" },
    languages: ["Deep Speech", "telepathy 120 ft."],
    challengeRating: 10,
    experiencePoints: 5900,
    source: "SRD",
    traits: [],
    actions: [],
    bonusActions: [],
    reactions: [],
    lairActions: [],
    legendaryActionCount: 3,
    legendaryActions: [
      { name: "Detect", description: "The aboleth makes a Wisdom (Perception) check.", cost: 1 },
      { name: "Tail Swipe", description: "The aboleth makes one tail attack.", cost: 1 },
      { name: "Tentacle Attack", description: "The aboleth makes one tentacle attack.", cost: 1 },
    ],
    isGlobal: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  async function addLegendaryMonsterToCombat(page: import("@playwright/test").Page) {
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
    await page.waitForSelector('[data-testid="combatants-list"]', { timeout: 15000 });
  }

  test("legendary monster badge visible in combatant row with correct count", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    await addLegendaryMonsterToCombat(page);

    const badge = page.locator('[data-testid="legendary-action-badge"]').first();
    await expect(badge).toBeVisible();
    await expect(badge).toContainText("⚡ 3/3");
  });

  test("clicking Use decrements legendary actions remaining and badge updates", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
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
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
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
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    await addLegendaryMonsterToCombat(page);

    // Open detail panel
    await page.locator('[data-testid="combatant-detail-toggle"]').first().click();

    const poolEditor = page.locator('[data-testid="legendary-action-pool-editor"]').first();
    await expect(poolEditor).toBeVisible({ timeout: 5000 });

    // Click [−] to reduce pool from 3 to 2; remaining clamps to new count (3→2)
    await poolEditor.getByRole("button", { name: "−" }).click();
    const badge = page.locator('[data-testid="legendary-action-badge"]').first();
    await expect(badge).toContainText("⚡ 2/2");

    // Click [+] to increase pool from 2 to 3; remaining stays at 2 (no implicit restore)
    await poolEditor.getByRole("button", { name: "+" }).click();
    await expect(badge).toContainText("⚡ 2/3");
  });

  test("advancing turn to legendary combatant resets remaining to pool", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);

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
    await page.waitForSelector('[data-testid="combatants-list"]', { timeout: 15000 });

    // Open Aboleth detail panel and use 2 actions
    const infoBtns = page.locator("svg.w-5.h-5.text-gray-400");
    await infoBtns.first().click();
    const useBtn = page.locator('[data-testid="legendary-action-use-0"]').first();
    await expect(useBtn).toBeVisible({ timeout: 5000 });
    await useBtn.click();
    await useBtn.click();

    const badge = page.locator('[data-testid="legendary-action-badge"]').first();
    await expect(badge).toContainText("⚡ 1/3");

    // Close detail panel and advance turns until we come back to Aboleth
    await page.keyboard.press("Escape");
    // Click "Current Turn (done)" to advance — do this twice to cycle through both combatants
    const currentTurnBtn = page.getByRole("button", { name: /Current Turn \(done\)/i });
    await currentTurnBtn.click(); // advance to next combatant
    await currentTurnBtn.click(); // advance back to Aboleth (or first combatant)

    // After cycling back to Aboleth, remaining should be reset to 3
    await expect(badge).toContainText("⚡ 3/3");
  });

  test("complete end-to-end flow from registration to combat", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    await expect(page).not.toHaveURL(/\/register/);

    await createCharacter(page, {
      name: identity.name("Thorin"),
      class: "Barbarian",
      race: "Dwarf",
    });
    await expect(page).not.toHaveURL(/\/characters\/create/);

    await createParty(page, {
      name: identity.name("Dwarven Company"),
      memberCount: 13,
    });
    await expect(page).not.toHaveURL(/\/parties\/create/);

    await createEncounter(page, { name: identity.name("Dragon Attack") });
    await expect(page).not.toHaveURL(/\/encounters\/create/);

    await openCombat(page);
    await expect(page).toHaveURL(/\/combat/);

    await verifyCombatScreenElements(page);
  });
});
