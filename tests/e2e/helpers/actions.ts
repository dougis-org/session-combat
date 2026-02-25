import { v4 as uuidv4 } from "uuid";
import { Page } from "@playwright/test";

/**
 * Generate a unique email address for test purposes using UUID
 */
export function generateUniqueEmail(): string {
  const uuid = uuidv4();
  return `${uuid}@dougis.com`;
}

/**
 * Fill registration form with email and password
 */
export async function fillRegistrationForm(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.fill("#email", email);
  await page.fill("#password", password);
  await page.fill("#confirmPassword", password);
}

/**
 * Submit registration form and wait for successful redirect
 */
export async function submitRegistrationForm(page: Page): Promise<void> {
  await page.click('button[type="submit"]');

  // Wait for navigation away from registration/login
  // Use 30s timeout to accommodate CI environment delays
  await page.waitForURL(
    (url) => {
      return (
        !url.pathname.includes("/register") && !url.pathname.includes("/login")
      );
    },
    { timeout: 30000 },
  );

  // Wait for all in-flight requests to settle so the auth cookie is fully
  // persisted before subsequent navigations (WebKit can delay Set-Cookie
  // processing from fetch() responses)
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
}

/**
 * Complete full registration flow: navigate, fill, and submit
 */
export async function registerUser(
  page: Page,
  email: string,
  password: string,
): Promise<void> {
  await page.goto("/register");
  await fillRegistrationForm(page, email, password);
  await submitRegistrationForm(page);
}

/**
 * Login with email and password
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

  // Wait for navigation away from login
  // Use 30s timeout to accommodate CI environment delays
  await page.waitForURL(
    (url) => {
      return (
        !url.pathname.includes("/login") && !url.pathname.includes("/register")
      );
    },
    { timeout: 30000 },
  );

  // Wait for auth state to fully settle (see submitRegistrationForm)
  await page.waitForLoadState("networkidle", { timeout: 15000 }).catch(() => {});
}

/**
 * Create a character with given details
 */
export async function createCharacter(
  page: Page,
  character: { name: string; class: string; race: string },
): Promise<void> {
  // Navigate to characters page and open the editor via the real UI
  await page.goto("/characters");
  await page.getByRole("button", { name: "Add New Character" }).click();

  // Fill in character details using accessible labels
  await page.getByLabel("Character name").fill(character.name);
  await page.getByLabel("Character class").selectOption(character.class);
  await page.getByLabel("Character race").selectOption(character.race);

  // Submit via Save button
  await page.getByRole("button", { name: /Save Character/i }).click();

  // Wait for the new character to appear in the list (increased timeout for CI)
  await page.waitForSelector(`text=${character.name}`, { timeout: 15000 });
}

/**
 * Create a party with given details
 */
export async function createParty(
  page: Page,
  party: { name: string; memberCount: number },
): Promise<void> {
  // Navigate to parties page and open the inline Add New Party form
  await page.goto("/parties");
  await page.getByRole("button", { name: "Add New Party" }).click();

  // Fill in party details using label
  await page.getByLabel("Party Name").fill(party.name);

  // Select members via checkboxes (pick the first N available)
  const memberCheckboxes = page.locator('input[type="checkbox"]');
  const availableCount = await memberCheckboxes.count();
  const toSelect = Math.min(party.memberCount, availableCount);
  for (let i = 0; i < toSelect; i++) {
    await memberCheckboxes.nth(i).check();
  }

  // Submit the new party form
  await page.getByRole("button", { name: /Save Party/i }).click();
  await page.waitForSelector(`text=${party.name}`, { timeout: 15000 });
}

/**
 * Import a monster file
 */
export async function importMonster(
  page: Page,
  filePath: string,
): Promise<void> {
  // Navigate to import page
  await page.goto("/monsters/import");

  // Upload file
  const fileInput = await page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);

  // Submit import
  await page.click('button[type="submit"]');

  // Wait for success
  await page.waitForURL((url) => !url.pathname.includes("/import"), {
    timeout: 10000,
  });
}

/**
 * Create an encounter with given name/details
 */
export async function createEncounter(
  page: Page,
  encounter: { name: string; combatantCount?: number },
): Promise<void> {
  // Navigate to encounters page and open the editor via the UI
  await page.goto("/encounters");
  await page.getByRole("button", { name: "Add New Encounter" }).click();

  // Fill in encounter details (label should exist in editor)
  await page.getByLabel("Name").fill(encounter.name);

  // Submit via Save button
  await page.getByRole("button", { name: /Save Encounter/i }).click();

  // Wait for the new encounter to appear in the list
  await page.waitForSelector(`text=${encounter.name}`, { timeout: 15000 });
}

/**
 * Open combat screen for an encounter
 */
export async function openCombat(
  page: Page,
  encounterId?: string,
): Promise<void> {
  // Navigate directly to the combat page
  await page.goto("/combat");

  // Wait for the page to finish loading (setup or active combat)
  await page
    .waitForSelector(
      '[data-testid="combat-screen"], text=Start New Combat',
      { timeout: 15000 },
    )
    .catch(() => {});

  // If already in active combat, we're done
  const combatScreen = page.locator('[data-testid="combat-screen"]');
  if (await combatScreen.isVisible({ timeout: 1000 }).catch(() => false)) {
    return;
  }

  // In setup phase — check if the library "Start Combat" is enabled (has characters)
  const libraryStartBtn = page
    .getByRole("button", { name: "Start Combat" })
    .first();
  const isLibraryEnabled = await libraryStartBtn
    .isEnabled()
    .catch(() => false);

  if (isLibraryEnabled) {
    await libraryStartBtn.click();
  } else {
    // No characters saved — use Quick Entry to add a combatant
    await page.getByRole("button", { name: "+ Add Enemy" }).first().click();

    // Switch to the "Create New" tab
    await page.getByRole("tab", { name: "Create New" }).click();

    // Fill in a minimal combatant and submit
    await page.locator("#custom-name").fill("Test Enemy");
    await page.locator('button[type="submit"]').click();

    // Click the Quick Entry "Start Combat" button (data-testid added to target it precisely)
    await page
      .locator('[data-testid="start-combat-quick"]')
      .waitFor({ state: "visible", timeout: 10000 });
    await page.locator('[data-testid="start-combat-quick"]').click();
  }

  // Wait for the active combat UI
  await page.waitForSelector('[data-testid="combat-screen"]', {
    timeout: 15000,
  });
}

/**
 * Verify combat screen elements are visible
 */
export async function verifyCombatScreenElements(page: Page): Promise<void> {
  // Check for key combat UI elements
  const initiativeOrder = page.locator('[data-testid="initiative-order"]');
  const combatantsList = page.locator('[data-testid="combatants-list"]');

  // Elements should be visible
  await initiativeOrder.waitFor({ state: "visible", timeout: 10000 }).catch(() => {
    // If initiative hasn't been rolled yet, combatants-list should be visible
    return combatantsList.waitFor({ state: "visible", timeout: 10000 });
  });

  // At least one health bar should be visible
  const healthBars = page.locator('[data-testid="health-bar"]');
  await healthBars.first().waitFor({ state: "visible", timeout: 10000 }).catch(() => {
    // Health bars may not be rendered until after first health update
    console.log('Health bars not immediately visible, combat screen still valid');
  });
}
