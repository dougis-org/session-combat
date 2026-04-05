import { test, expect } from "./fixtures";
import { registerUser, createCharacter, STRONG_PASSWORD } from "./helpers/actions";
import { createTestIdentity } from "./helpers/isolation";
import characterFixtures from "./fixtures/characters.json";

test.beforeEach(async ({ page }) => {
  await page.context().clearCookies();
});

// ────────────────────────────────────────────────────────────
// Character creation — data-driven
// ────────────────────────────────────────────────────────────

test.describe("Character creation — data-driven", () => {
  for (const fixture of characterFixtures) {
    const { name, race, alignment } = fixture;
    const charClass = fixture.class;
    test(
      `create character: ${name} (${charClass} / ${race})`,
      async ({ page }, testInfo) => {
        const identity = createTestIdentity(testInfo);
        await registerUser(page, identity.email, STRONG_PASSWORD);
        await createCharacter(page, { name, class: charClass, race, alignment });
        await expect(page.getByText(name)).toBeVisible();
      },
    );
  }
});

// ────────────────────────────────────────────────────────────
// Character creation — validation
// ────────────────────────────────────────────────────────────

test.describe("Character creation — validation", () => {
  test("Save button is disabled when name field is cleared", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    await page.goto("/characters");
    await page.getByRole("button", { name: "Add New Character" }).click();

    await page.getByLabel("Character name").clear();

    await expect(
      page.getByRole("button", { name: /Save Character/i }),
    ).toBeDisabled();
  });

  test("Save button is disabled for whitespace-only name", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    await page.goto("/characters");
    await page.getByRole("button", { name: "Add New Character" }).click();

    await page.getByLabel("Character name").fill("   ");

    // Whitespace-only name does not bypass the empty-name check
    await expect(
      page.getByRole("button", { name: /Save Character/i }),
    ).toBeDisabled();
  });

  test('shows "Current HP cannot be greater than Max HP" when hp > maxHp', async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    await page.goto("/characters");
    await page.getByRole("button", { name: "Add New Character" }).click();

    await page.getByLabel("Character name").fill("Validation Test");
    await page.getByLabel("Current Hit Points").fill("20");
    await page.getByLabel("Maximum Hit Points").fill("10");

    await page.getByRole("button", { name: /Save Character/i }).click();

    await expect(
      page.getByText("Current HP cannot be greater than Max HP"),
    ).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────
// Character form interactions
// ────────────────────────────────────────────────────────────

test.describe("Character form interactions", () => {
  test('class dropdown is visible and accepts "Rogue"', async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    await page.goto("/characters");
    await page.getByRole("button", { name: "Add New Character" }).click();

    const classSelect = page.getByLabel("Character class");
    await expect(classSelect).toBeVisible();
    await classSelect.selectOption("Rogue");
    await expect(classSelect).toHaveValue("Rogue");
  });

  test('race dropdown is visible and accepts "Tiefling"', async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    await page.goto("/characters");
    await page.getByRole("button", { name: "Add New Character" }).click();

    const raceSelect = page.getByLabel("Character race");
    await expect(raceSelect).toBeVisible();
    await raceSelect.selectOption("Tiefling");
    await expect(raceSelect).toHaveValue("Tiefling");
  });

  test('alignment dropdown is visible and accepts "Chaotic Good"', async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    await page.goto("/characters");
    await page.getByRole("button", { name: "Add New Character" }).click();

    const alignmentSelect = page.getByLabel("Character alignment");
    await expect(alignmentSelect).toBeVisible();
    await alignmentSelect.selectOption("Chaotic Good");
    await expect(alignmentSelect).toHaveValue("Chaotic Good");
  });

  test("Add Class button appends a second class row", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    await page.goto("/characters");
    await page.getByRole("button", { name: "Add New Character" }).click();

    await expect(page.getByLabel("Character class")).toHaveCount(1);
    await page.getByRole("button", { name: "Add Class" }).click();
    await expect(page.getByLabel("Character class")).toHaveCount(2);
  });

  test("Remove button is disabled when only one class exists", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    await page.goto("/characters");
    await page.getByRole("button", { name: "Add New Character" }).click();

    await expect(page.getByRole("button", { name: "Remove" })).toBeDisabled();
  });
});

// ────────────────────────────────────────────────────────────
// Character persistence and display
// ────────────────────────────────────────────────────────────

test.describe("Character persistence and display", () => {
  test("character list card shows name and Paladin Level 1 after creation", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    const charName = identity.name("Persistence Test");
    await createCharacter(page, { name: charName, class: "Paladin", race: "Human" });
    await expect(page.getByText(charName)).toBeVisible();
    await expect(page.getByText("Paladin Level 1")).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────
// Character editing
// ────────────────────────────────────────────────────────────

test.describe("Character editing", () => {
  test("edited character name persists in list", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    const originalName = identity.name("Original Hero");
    const newName = identity.name("Renamed Hero");

    await createCharacter(page, {
      name: originalName,
      class: "Wizard",
      race: "Elf",
    });

    await page.getByRole("button", { name: "Edit" }).first().click();
    const nameInput = page.getByLabel("Character name");
    await nameInput.clear();
    await nameInput.fill(newName);
    await page.getByRole("button", { name: /Save Character/i }).click();

    await expect(page.getByText(newName)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(originalName)).toHaveCount(0);
  });
});

// ────────────────────────────────────────────────────────────
// Character deletion
// ────────────────────────────────────────────────────────────

test.describe("Character deletion", () => {
  test("deleted character disappears from list", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    const charName = identity.name("Delete Me");

    await createCharacter(page, {
      name: charName,
      class: "Barbarian",
      race: "Half-Orc",
    });

    page.once("dialog", (dialog) => void dialog.accept());
    const deleteResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "DELETE" &&
        response.url().includes("/api/characters/"),
    );
    await page.getByRole("button", { name: "Delete" }).first().click();
    const response = await deleteResponse;
    expect(response.ok()).toBeTruthy();

    await expect(page.getByText(charName)).toHaveCount(0);
  });
});
