import { test, expect } from "@playwright/test";
import {
  generateUniqueEmail,
  registerUser,
  createCharacter,
  createParty,
  importMonster,
  createEncounter,
  openCombat,
  verifyCombatScreenElements,
} from "./helpers/actions";
import { clearTestCollections } from "./helpers/db";

const STRONG_PASSWORD = "TestPassword123!";

test.describe("Combat flows", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await clearTestCollections();
  });

  test("registered user can import a D&D Beyond character after resolving a duplicate-name conflict", async ({
    page,
  }) => {
    await registerUser(page, generateUniqueEmail(), STRONG_PASSWORD);

    let characters = [
      {
        id: "existing-character-id",
        userId: "test-user-id",
        name: "Dolor Vagarpie",
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
      },
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

      expect(body.url).toBe(
        "https://www.dndbeyond.com/characters/91913267/BRdgB3",
      );

      if (!body.overwrite) {
        await route.fulfill({
          status: 409,
          contentType: "application/json",
          body: JSON.stringify({
            conflict: "duplicate-name",
            error: "Character already exists",
            existingCharacter: {
              id: "existing-character-id",
              name: "Dolor Vagarpie",
            },
            warnings: ["Alignment was not supported and was omitted."],
          }),
        });
        return;
      }

      characters = [
        {
          id: "existing-character-id",
          userId: "test-user-id",
          name: "Dolor Vagarpie",
          ac: 18,
          hp: 92,
          maxHp: 92,
          abilityScores: {
            strength: 10,
            dexterity: 17,
            constitution: 14,
            intelligence: 16,
            wisdom: 10,
            charisma: 21,
          },
          classes: [
            { class: "Rogue", level: 5 },
            { class: "Warlock", level: 7 },
          ],
        },
      ];

      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          character: characters[0],
          warnings: ["Alignment was not supported and was omitted."],
        }),
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
    await page
      .locator("#dnd-beyond-url")
      .fill("https://www.dndbeyond.com/characters/91913267/BRdgB3");
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

  test("registered user can create a character", async ({ page }) => {
    await registerUser(page, generateUniqueEmail(), STRONG_PASSWORD);
    await createCharacter(page, {
      name: "Aragorn",
      class: "Fighter",
      race: "Human",
    });
    await expect(page).not.toHaveURL(/\/characters\/create/);
  });

  test("multiple characters can be created", async ({ page }) => {
    await registerUser(page, generateUniqueEmail(), STRONG_PASSWORD);
    await createCharacter(page, {
      name: "Legolas",
      class: "Ranger",
      race: "Elf",
    });
    await createCharacter(page, {
      name: "Gimli",
      class: "Barbarian",
      race: "Dwarf",
    });
    await expect(page).not.toHaveURL(/\/create/);
  });

  // ────────────────────────────────────────────────────────────
  // Party creation
  // ────────────────────────────────────────────────────────────

  test("user can create a party", async ({ page }) => {
    await registerUser(page, generateUniqueEmail(), STRONG_PASSWORD);
    await createParty(page, { name: "Fellowship", memberCount: 4 });
    await expect(page).not.toHaveURL(/\/parties\/create/);
  });

  test("party with different member counts can be created", async ({
    page,
  }) => {
    await registerUser(page, generateUniqueEmail(), STRONG_PASSWORD);
    await createParty(page, { name: "Small Group", memberCount: 2 });
    await createParty(page, { name: "Large Group", memberCount: 6 });
    await expect(page).not.toHaveURL(/\/create/);
  });

  // ────────────────────────────────────────────────────────────
  // Monster import
  // ────────────────────────────────────────────────────────────

  test("user can import monsters from file", async ({ page }) => {
    await registerUser(page, generateUniqueEmail(), STRONG_PASSWORD);
    await importMonster(page, "samples/monster-upload-example.json");
    await expect(page).not.toHaveURL(/\/monsters\/import/);
  });

  // ────────────────────────────────────────────────────────────
  // Encounter creation
  // ────────────────────────────────────────────────────────────

  test("user can create an encounter", async ({ page }) => {
    await registerUser(page, generateUniqueEmail(), STRONG_PASSWORD);
    await createEncounter(page, { name: "Goblin Ambush" });
    await expect(page).not.toHaveURL(/\/encounters\/create/);
  });

  // ────────────────────────────────────────────────────────────
  // Combat screen
  // ────────────────────────────────────────────────────────────

  test("user can open combat screen for an encounter", async ({ page }) => {
    await registerUser(page, generateUniqueEmail(), STRONG_PASSWORD);
    await createEncounter(page, { name: "Test Encounter" });
    await openCombat(page);
    await expect(page).toHaveURL(/\/combat/);
  });

  test("combat screen displays required UI elements", async ({ page }) => {
    await registerUser(page, generateUniqueEmail(), STRONG_PASSWORD);
    await createEncounter(page, { name: "Combat UI Test" });
    await openCombat(page);
    await verifyCombatScreenElements(page);
  });

  // ────────────────────────────────────────────────────────────
  // End-to-end flow
  // ────────────────────────────────────────────────────────────

  test("complete end-to-end flow from registration to combat", async ({
    page,
  }) => {
    await registerUser(page, generateUniqueEmail(), STRONG_PASSWORD);
    await expect(page).not.toHaveURL(/\/register/);

    await createCharacter(page, {
      name: "Thorin",
      class: "Barbarian",
      race: "Dwarf",
    });
    await expect(page).not.toHaveURL(/\/characters\/create/);

    await createParty(page, { name: "Dwarven Company", memberCount: 13 });
    await expect(page).not.toHaveURL(/\/parties\/create/);

    await createEncounter(page, { name: "Dragon Attack" });
    await expect(page).not.toHaveURL(/\/encounters\/create/);

    await openCombat(page);
    await expect(page).toHaveURL(/\/combat/);

    await verifyCombatScreenElements(page);
  });
});
