import { test, expect } from "./fixtures";
import { registerUser, createEncounter, STRONG_PASSWORD } from "./helpers/actions";
import { createTestIdentity } from "./helpers/isolation";

const IMPORTED_MONSTER = {
  name: "E2E Test Kobold",
  type: "humanoid",
  alignment: "lawful evil",
  size: "small",
  ac: 12,
  maxHp: 5,
  speed: "30 ft.",
  abilityScores: {
    strength: 7,
    dexterity: 15,
    constitution: 9,
    intelligence: 8,
    wisdom: 7,
    charisma: 8,
  },
  senses: { darkvision: "60 ft.", passivePerception: "8" },
  languages: ["Common", "Draconic"],
  challengeRating: 0.125,
  experiencePoints: 25,
  traits: [],
  actions: [],
};

test.beforeEach(async ({ page }) => {
  await page.context().clearCookies();
});

test.describe("Encounter creation — basic persistence", () => {
  test("creates encounter and it appears in the list", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    const encounterName = identity.name("Dungeon Ambush");

    await createEncounter(page, { name: encounterName });

    await expect(page.getByText(encounterName)).toBeVisible();
  });

  test("encounter persists after page reload", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    const encounterName = identity.name("Persistent Encounter");

    await createEncounter(page, { name: encounterName });
    await page.reload();

    await expect(page.getByText(encounterName)).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Encounter creation — with imported monster", () => {
  async function createEncounterWithMonster(
    page: import("@playwright/test").Page,
    encounterName: string,
  ): Promise<void> {
    const uploadRes = await page.request.post("/api/monsters/upload", {
      data: { monsters: [IMPORTED_MONSTER] },
    });
    expect(uploadRes.ok()).toBeTruthy();

    await page.goto("/encounters");
    await page.getByRole("button", { name: "Add New Encounter" }).click();
    await page.getByLabel("Name").fill(encounterName);

    await page.getByRole("button", { name: "Add Combatant" }).click();
    await expect(
      page.getByText(IMPORTED_MONSTER.name),
    ).toBeVisible({ timeout: 10000 });
    await page
      .getByRole("button", { name: `Add ${IMPORTED_MONSTER.name} to encounter` })
      .click();
    await page.getByRole("button", { name: "Close modal" }).click();

    await expect(page.getByText("Monsters (1)")).toBeVisible({ timeout: 5000 });

    await page.getByRole("button", { name: /Save Encounter/i }).click();
    await page
      .getByText(encounterName)
      .waitFor({ state: "visible", timeout: 15000 });
  }

  test("adds imported monster to encounter and saves successfully", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    const encounterName = identity.name("Kobold Lair");

    await createEncounterWithMonster(page, encounterName);

    await expect(page.getByText(encounterName)).toBeVisible();
  });

  test("encounter with imported monster persists on reload", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    const encounterName = identity.name("Persisted Monster Encounter");

    await createEncounterWithMonster(page, encounterName);

    await page.reload();
    await expect(page.getByText(encounterName)).toBeVisible({ timeout: 15000 });
  });
});
