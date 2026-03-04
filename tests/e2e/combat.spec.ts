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
    await createCharacter(page, { name: "Legolas", class: "Ranger", race: "Elf" });
    await createCharacter(page, { name: "Gimli", class: "Barbarian", race: "Dwarf" });
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

  test("party with different member counts can be created", async ({ page }) => {
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
