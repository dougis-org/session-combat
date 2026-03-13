import { test, expect } from "@playwright/test";
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
    await createParty(page, { name: identity.name("Fellowship"), memberCount: 4 });
    await expect(page).not.toHaveURL(/\/parties\/create/);
  });

  test("party with different member counts can be created", async ({ page }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    await createParty(page, { name: identity.name("Small Group"), memberCount: 2 });
    await createParty(page, { name: identity.name("Large Group"), memberCount: 6 });
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

  test("user can open combat screen for an encounter", async ({ page }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    await createEncounter(page, { name: identity.name("Test Encounter") });
    await openCombat(page);
    await expect(page).toHaveURL(/\/combat/);
  });

  test("combat screen displays required UI elements", async ({ page }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    await createEncounter(page, { name: identity.name("Combat UI Test") });
    await openCombat(page);
    await verifyCombatScreenElements(page);
  });

  // ────────────────────────────────────────────────────────────
  // End-to-end flow
  // ────────────────────────────────────────────────────────────

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
