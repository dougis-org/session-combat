import { v4 as uuidv4 } from "uuid";
import { expect, Page } from "@playwright/test";

export const STRONG_PASSWORD = "TestPassword123!";

/**
 * Generate a unique email address for test purposes using UUID
 */
export function generateUniqueEmail(): string {
  const uuid = uuidv4();
  return `${uuid}@example.com`;
}

/**
 * Fill registration form with email and password
 */
export async function fillRegistrationForm(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  const emailField = page.locator("#email");
  await expect(emailField).toBeVisible({ timeout: 15000 });
  await expect(emailField).toBeEnabled({ timeout: 15000 });
  await emailField.fill(email);

  const passwordField = page.locator("#password");
  await expect(passwordField).toBeVisible({ timeout: 15000 });
  await expect(passwordField).toBeEnabled({ timeout: 15000 });
  await passwordField.fill(password);

  const confirmPasswordField = page.locator("#confirmPassword");
  await expect(confirmPasswordField).toBeVisible({ timeout: 15000 });
  await expect(confirmPasswordField).toBeEnabled({ timeout: 15000 });
  await confirmPasswordField.fill(password);
}

/**
 * Submit registration form and wait for navigation away from auth pages
 */
export async function submitRegistrationForm(page: Page): Promise<void> {
  await page.click('button[type="submit"]');

  await page.waitForURL(
    (url) => {
      return (
        !url.pathname.includes("/register") && !url.pathname.includes("/login")
      );
    },
    { timeout: 30000 },
  );
}

/**
 * Complete full registration flow: navigate, fill, submit, and wait for
 * the authenticated state (logout button visible) before returning.
 */
export async function registerUser(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/register");
  await fillRegistrationForm(page, email, password);
  await submitRegistrationForm(page);
  await expect(page.locator('[data-testid="logout-button"]')).toBeVisible({
    timeout: 15000,
  });
}

/**
 * Login with email and password, waits for the authenticated state before returning.
 */
export async function loginUser(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/login");
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.click('button[type="submit"]');

  await page.waitForURL(
    (url) => {
      return (
        !url.pathname.includes("/login") && !url.pathname.includes("/register")
      );
    },
    { timeout: 30000 },
  );

  await expect(page.locator('[data-testid="logout-button"]')).toBeVisible({
    timeout: 15000,
  });
}

/**
 * Create a character with given details
 */
export async function createCharacter(
  page: Page,
  character: {
    name: string;
    class: string;
    race: string;
    alignment?: string;
  },
): Promise<void> {
  await page.goto("/characters");
  await page.getByRole("button", { name: "Add New Character" }).click();

  await page.getByLabel("Character name").fill(character.name);
  await page.getByLabel("Character class").selectOption(character.class);
  await page.getByLabel("Character race").selectOption(character.race);
  if (character.alignment !== undefined) {
    await page
      .getByLabel("Character alignment")
      .selectOption(character.alignment);
  }

  await page.getByRole("button", { name: /Save Character/i }).click();

  await page.getByText(character.name).waitFor({ timeout: 15000 });
}

/**
 * Create a party with given details
 */
export async function createParty(
  page: Page,
  party: { name: string; description?: string; memberCount: number },
): Promise<void> {
  await page.goto("/parties");
  await page.getByRole("button", { name: "Add New Party" }).click();

  await page.getByLabel("Party Name").fill(party.name);
  if (party.description !== undefined) {
    await page.getByPlaceholder("Optional party description").fill(
      party.description,
    );
  }

  const memberCheckboxes = page.locator('input[type="checkbox"]');
  const availableCount = await memberCheckboxes.count();
  const toSelect = Math.min(party.memberCount, availableCount);
  for (let i = 0; i < toSelect; i++) {
    await memberCheckboxes.nth(i).check();
  }

  await page.getByRole("button", { name: /Save Party/i }).click();
  await page.getByText(party.name).waitFor({ timeout: 15000 });
}

/**
 * Seed a character directly through the API for tests that need an existing
 * character without paying the full UI setup cost.
 */
export async function seedCharacter(
  page: Page,
  character: {
    name: string;
    class?: string;
    race?: string;
    alignment?: string;
  },
): Promise<string> {
  const response = await page.request.post("/api/characters", {
    data: {
      name: character.name,
      classes: [{ class: character.class ?? "Fighter", level: 1 }],
      race: character.race ?? "Human",
      alignment: character.alignment,
      hp: 10,
      maxHp: 10,
      ac: 10,
    },
  });

  expect(response).toBeOK();
  const created = await response.json();
  expect(created.id).toBeDefined();
  return created.id as string;
}

/**
 * Import a monster file
 */
export async function importMonster(
  page: Page,
  filePath: string,
): Promise<void> {
  await page.goto("/monsters/import");

  const fileInput = await page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);

  await page.click('button[type="submit"]');

  await page.waitForURL((url) => !url.pathname.includes("/import"), {
    timeout: 10000,
  });
}

/**
 * Create an encounter with given name/details
 */
export async function createEncounter(
  page: Page,
  encounter: { name: string },
): Promise<void> {
  await page.goto("/encounters");
  await page.getByRole("button", { name: "Add New Encounter" }).click();

  await page.getByLabel("Name").fill(encounter.name);

  await page.getByRole("button", { name: /Save Encounter/i }).click();

  await page
    .getByText(encounter.name)
    .waitFor({ state: "visible", timeout: 15000 });
}

/**
 * Open combat screen for an encounter
 */
export async function openCombat(
  page: Page,
  encounterId?: string,
): Promise<void> {
  const combatUrl = encounterId
    ? `/combat?encounterId=${encodeURIComponent(encounterId)}`
    : "/combat";
  await page.goto(combatUrl);

  await page
    .locator('[data-testid="combat-screen"]')
    .or(page.getByText("Start New Combat"))
    .waitFor({ timeout: 15000 });

  const combatScreen = page.locator('[data-testid="combat-screen"]').first();
  if ((await combatScreen.count()) > 0 && (await combatScreen.isVisible())) {
    return;
  }

  const libraryStartBtn = page
    .getByRole("button", { name: "Start Combat" })
    .first();
  const hasLibraryStartButton = (await libraryStartBtn.count()) > 0;
  const isLibraryEnabled = hasLibraryStartButton && (await libraryStartBtn.isEnabled());

  if (isLibraryEnabled) {
    await libraryStartBtn.click();
  } else {
    await page.getByRole("button", { name: "+ Add Enemy" }).first().click();

    await page.getByRole("tab", { name: "Create New" }).click();

    await page.locator("#custom-name").fill("Test Enemy");
    await page.locator('button[type="submit"]').click();

    await page
      .locator('[data-testid="start-combat-quick"]')
      .waitFor({ state: "visible", timeout: 10000 });
    await page.locator('[data-testid="start-combat-quick"]').click();
  }

  await page.waitForSelector('[data-testid="combat-screen"]', {
    timeout: 15000,
  });
}

/**
 * Verify combat screen elements are visible
 */
export async function verifyCombatScreenElements(page: Page): Promise<void> {
  const initiativeOrder = page.locator('[data-testid="initiative-order"]');
  const combatantsList = page.locator('[data-testid="combatants-list"]');

  await initiativeOrder
    .or(combatantsList)
    .waitFor({ state: "visible", timeout: 10000 });
}
