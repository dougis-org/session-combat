import { test, expect } from "./fixtures";
import {
  registerTestUser,
  createCharacter,
  createParty,
  seedCharacter,
  importMonster,
  createEncounter,
} from "./helpers/actions";
import {
  createDuplicateNameConflictPayload,
  createImportedCharacterApiPayload,
  createPersistedImportedCharacter,
  DND_BEYOND_CHARACTER_URL,
  EXISTING_IMPORTED_CHARACTER_ID,
  IMPORT_WARNING,
} from "@/tests/helpers/dndBeyondImport";

test.describe("Combat flows - import and setup", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test("registered user can import a D&D Beyond character after resolving a duplicate-name conflict", async ({
    page,
  }, testInfo) => {
    await registerTestUser(page, testInfo);

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
      page.getByRole("heading", { name: "Characters", exact: true }),
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
    const identity = await registerTestUser(page, testInfo);
    await createCharacter(page, {
      name: identity.name("Aragorn"),
      class: "Fighter",
      race: "Human",
    });
    await expect(page).not.toHaveURL(/\/characters\/create/);
  });

  test("multiple characters can be created", async ({ page }, testInfo) => {
    const identity = await registerTestUser(page, testInfo);
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
    const identity = await registerTestUser(page, testInfo);
    const aragorn = identity.name("Aragorn");
    const legolas = identity.name("Legolas");
    const gimli = identity.name("Gimli");
    const gandalf = identity.name("Gandalf");
    await Promise.all([
      seedCharacter(page, { name: aragorn }),
      seedCharacter(page, { name: legolas }),
      seedCharacter(page, { name: gimli }),
      seedCharacter(page, { name: gandalf }),
    ]);
    await createParty(page, {
      name: identity.name("Fellowship"),
      memberNames: [aragorn, legolas, gimli, gandalf],
    });
    await expect(page.getByText("Members: 4")).toBeVisible();
    await expect(page).not.toHaveURL(/\/parties\/create/);
  });

  test("party with different member counts shows correct member count", async ({
    page,
  }, testInfo) => {
    const identity = await registerTestUser(page, testInfo);
    const frodo = identity.name("Frodo");
    const sam = identity.name("Sam");
    const merry = identity.name("Merry");
    const pippin = identity.name("Pippin");
    const aragorn = identity.name("Aragorn");
    const boromir = identity.name("Boromir");
    await Promise.all([
      seedCharacter(page, { name: frodo }),
      seedCharacter(page, { name: sam }),
      seedCharacter(page, { name: merry }),
      seedCharacter(page, { name: pippin }),
      seedCharacter(page, { name: aragorn }),
      seedCharacter(page, { name: boromir }),
    ]);
    await createParty(page, {
      name: identity.name("Small Group"),
      memberNames: [frodo, sam],
    });
    await expect(page.getByText("Members: 2")).toBeVisible();
    await createParty(page, {
      name: identity.name("Large Group"),
      memberNames: [frodo, sam, merry, pippin, aragorn, boromir],
    });
    await expect(page.getByText("Members: 6")).toBeVisible();
    await expect(page).not.toHaveURL(/\/create/);
  });

  // ────────────────────────────────────────────────────────────
  // Monster import
  // ────────────────────────────────────────────────────────────

  test("user can import monsters from file", async ({ page }, testInfo) => {
    await registerTestUser(page, testInfo);
    await importMonster(page, "samples/monster-upload-example.json");
    await expect(page).not.toHaveURL(/\/monsters\/import/);
  });

  // ────────────────────────────────────────────────────────────
  // Encounter creation
  // ────────────────────────────────────────────────────────────

  test("user can create an encounter", async ({ page }, testInfo) => {
    const identity = await registerTestUser(page, testInfo);
    await createEncounter(page, { name: identity.name("Goblin Ambush") });
    await expect(page).not.toHaveURL(/\/encounters\/create/);
  });
});
