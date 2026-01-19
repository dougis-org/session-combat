import { v4 as uuidv4 } from 'uuid';
import { Page } from '@playwright/test';

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
  password: string
): Promise<void> {
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
}

/**
 * Submit registration form and wait for successful redirect
 */
export async function submitRegistrationForm(page: Page): Promise<void> {
  await page.click('button[type="submit"]');
  
  // Wait for navigation away from registration/login
  await page.waitForURL((url) => {
    return !url.pathname.includes('/register') && !url.pathname.includes('/login');
  }, { timeout: 10000 });
}

/**
 * Complete full registration flow: navigate, fill, and submit
 */
export async function registerUser(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/register');
  await fillRegistrationForm(page, email, password);
  await submitRegistrationForm(page);
}

/**
 * Login with email and password
 */
export async function loginUser(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.goto('/login');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  
  // Wait for navigation away from login
  await page.waitForURL((url) => {
    return !url.pathname.includes('/login') && !url.pathname.includes('/register');
  }, { timeout: 10000 });
}

/**
 * Create a character with given details
 */
export async function createCharacter(
  page: Page,
  character: { name: string; class: string; race: string }
): Promise<void> {
  // Navigate to character creation page
  await page.goto('/characters/create');
  
  // Fill in character details
  await page.fill('input[placeholder*="Name"]', character.name);
  await page.selectOption('select[name="class"]', character.class);
  await page.selectOption('select[name="race"]', character.race);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for success or redirect
  await page.waitForURL((url) => !url.pathname.includes('/create'), { timeout: 5000 });
}

/**
 * Create a party with given details
 */
export async function createParty(
  page: Page,
  party: { name: string; memberCount: number }
): Promise<void> {
  // Navigate to party creation page
  await page.goto('/parties/create');
  
  // Fill in party details
  await page.fill('input[placeholder*="Name"]', party.name);
  
  // For member count, might need to add members via UI
  // This is a simplified version - adjust based on actual UI
  await page.fill('input[placeholder*="Member"]', party.memberCount.toString());
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for success or redirect
  await page.waitForURL((url) => !url.pathname.includes('/create'), { timeout: 5000 });
}

/**
 * Import a monster file
 */
export async function importMonster(
  page: Page,
  filePath: string
): Promise<void> {
  // Navigate to import page
  await page.goto('/monsters/import');
  
  // Upload file
  const fileInput = await page.locator('input[type="file"]');
  await fileInput.setInputFiles(filePath);
  
  // Submit import
  await page.click('button[type="submit"]');
  
  // Wait for success
  await page.waitForURL((url) => !url.pathname.includes('/import'), { timeout: 10000 });
}

/**
 * Create an encounter with given name/details
 */
export async function createEncounter(
  page: Page,
  encounter: { name: string; combatantCount?: number }
): Promise<void> {
  // Navigate to encounter creation page
  await page.goto('/encounters/create');
  
  // Fill in encounter details
  await page.fill('input[placeholder*="Name"]', encounter.name);
  
  // Submit form
  await page.click('button[type="submit"]');
  
  // Wait for success or redirect
  await page.waitForURL((url) => !url.pathname.includes('/create'), { timeout: 5000 });
}

/**
 * Open combat screen for an encounter
 */
export async function openCombat(page: Page, encounterId?: string): Promise<void> {
  // Navigate to combat page or click on an encounter to open combat
  if (encounterId) {
    await page.goto(`/combat/${encounterId}`);
  } else {
    // Click on the first available encounter to open combat
    await page.goto('/encounters');
    const firstEncounter = page.locator('[data-testid="encounter-card"]').first();
    await firstEncounter.click();
  }
  
  // Wait for combat UI to be visible
  await page.waitForSelector('[data-testid="combat-screen"]', { timeout: 5000 });
}

/**
 * Verify combat screen elements are visible
 */
export async function verifyCombatScreenElements(page: Page): Promise<void> {
  // Check for key combat UI elements
  const initiativeOrder = page.locator('[data-testid="initiative-order"]');
  const healthBars = page.locator('[data-testid="health-bar"]');
  const combatantsList = page.locator('[data-testid="combatants-list"]');
  
  // All should be visible
  await initiativeOrder.waitFor({ state: 'visible', timeout: 5000 });
  await healthBars.first().waitFor({ state: 'visible', timeout: 5000 });
  await combatantsList.waitFor({ state: 'visible', timeout: 5000 });
}
