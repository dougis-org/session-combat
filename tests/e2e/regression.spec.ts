import { test, expect } from "@playwright/test";
import {
  generateUniqueEmail,
  registerUser,
  loginUser,
  createCharacter,
  createParty,
  importMonster,
  createEncounter,
  openCombat,
  verifyCombatScreenElements,
} from "./helpers/actions";

/**
 * Create a strong test password that meets all requirements
 */
function getStrongPassword(): string {
  return "TestPassword123!";
}

test.describe.parallel("Regression Test Suite - Session Combat", () => {
  // ============================================================
  // SETUP & TEARDOWN
  // ============================================================
  test.beforeEach(async ({ page }) => {
    // Clear authentication before each test
    await page.context().clearCookies();
    // Wait for page to be ready
    await page.waitForLoadState("networkidle").catch(() => {
      // Network idle may timeout, that's okay - we just want DOM ready
    });
  });

  // ============================================================
  // REGISTRATION PAGE - EXISTENCE & ACCESSIBILITY
  // ============================================================
  test("register page loads and displays form", async ({ page }) => {
    await page.goto("/register");

    // Verify page title/heading
    await expect(page.locator("h1, h2").first()).toBeVisible({
      timeout: 10000,
    });

    // Verify form exists
    await expect(page.locator("form")).toBeVisible();
  });

  test("register form has all required input fields", async ({ page }) => {
    await page.goto("/register");

    // Check email field
    const emailInput = page.locator("#email");
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    expect(await emailInput.getAttribute("type")).toBe("email");

    // Check password field
    const passwordInput = page.locator("#password");
    await expect(passwordInput).toBeVisible();
    expect(await passwordInput.getAttribute("type")).toBe("password");

    // Check confirm password field
    const confirmInput = page.locator("#confirmPassword");
    await expect(confirmInput).toBeVisible();
    expect(await confirmInput.getAttribute("type")).toBe("password");
  });

  test("register form has submit button", async ({ page }) => {
    await page.goto("/register");

    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible({ timeout: 10000 });
  });

  test("email input accepts valid email format", async ({ page }) => {
    await page.goto("/register");

    const emailInput = page.locator("#email");
    const testEmail = generateUniqueEmail();

    await emailInput.fill(testEmail);
    const filledValue = await emailInput.inputValue();

    expect(filledValue).toBe(testEmail);
  });

  test("password input accepts text input", async ({ page }) => {
    await page.goto("/register");

    const passwordInput = page.locator("#password");
    const testPassword = getStrongPassword();

    await passwordInput.fill(testPassword);
    const filledValue = await passwordInput.inputValue();

    // Password should be filled (even though it appears as dots)
    expect(filledValue).toBe(testPassword);
  });

  test("confirm password input accepts text input", async ({ page }) => {
    await page.goto("/register");

    const confirmInput = page.locator("#confirmPassword");
    const testPassword = getStrongPassword();

    await confirmInput.fill(testPassword);
    const filledValue = await confirmInput.inputValue();

    expect(filledValue).toBe(testPassword);
  });

  test("password requirements are displayed", async ({ page }) => {
    await page.goto("/register");

    // Look for password requirements indicators
    const pageText = await page.textContent("body");
    expect(pageText).toMatch(
      /password|requirement|character|uppercase|lowercase|number/i,
    );
  });

  test("password requirements update based on input", async ({ page }) => {
    await page.goto("/register");

    const passwordInput = page.locator("#password");

    // Type a weak password and assert weak strength indicator
    await passwordInput.fill("weak");
    await expect(page.locator("text=Password Strength: Weak")).toBeVisible();

    // Type a strong password and assert the UI updates accordingly
    await passwordInput.fill(getStrongPassword());
    await expect(page.locator("text=Password Strength: Strong")).toBeVisible();

    // Password requirement list items should reflect satisfied rules (green text)
    await expect(page.locator("text=At least 8 characters")).toHaveClass(
      /text-green-400/,
    );
    await expect(page.locator("text=Lowercase letter (a-z)")).toHaveClass(
      /text-green-400/,
    );
    await expect(page.locator("text=Uppercase letter (A-Z)")).toHaveClass(
      /text-green-400/,
    );
    await expect(page.locator("text=Number (0-9)")).toHaveClass(
      /text-green-400/,
    );

    // Just verify the input value updated
    expect(await passwordInput.inputValue()).toBe(getStrongPassword());
  });

  test("can link to login page from register", async ({ page }) => {
    await page.goto("/register");

    // The register page always renders a login link — assert it is visible
    const loginLink = page
      .locator("a")
      .filter({ hasText: /log in|login|sign in/i })
      .first();

    await expect(loginLink).toBeVisible({ timeout: 10000 });
    await loginLink.click();
    await page.waitForLoadState("networkidle").catch(() => {});

    // Should navigate to login page
    const url = page.url();
    expect(url.includes("/login") || url.includes("/signin")).toBeTruthy();
  });

  // ============================================================
  // LOGIN PAGE - EXISTENCE & ACCESSIBILITY
  // ============================================================
  test("login page loads and displays form", async ({ page }) => {
    await page.goto("/login");

    // Verify page loads
    await expect(page.locator("form")).toBeVisible({ timeout: 10000 });
  });

  test("login form has email and password fields", async ({ page }) => {
    await page.goto("/login");

    // Check email field exists and is of correct type
    const emailInput = page.locator("#email");
    await expect(emailInput).toBeVisible();
    await expect(emailInput).toHaveAttribute("type", "email");

    // Check password field exists and is of correct type
    const passwordInput = page.locator("#password");
    await expect(passwordInput).toBeVisible();
    await expect(passwordInput).toHaveAttribute("type", "password");
  });

  test("login form has submit button", async ({ page }) => {
    await page.goto("/login");

    const submitBtn = page.locator('button[type="submit"]').first();
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeEnabled();
  });

  // ============================================================
  // NAVIGATION & ROUTING
  // ============================================================
  test("register and login pages are accessible", async ({ page }) => {
    // Test register page
    const registerResponse = await page.goto("/register", {
      waitUntil: "domcontentloaded",
    });
    expect([200, 304]).toContain(registerResponse?.status());

    // Test login page
    const loginResponse = await page.goto("/login", {
      waitUntil: "domcontentloaded",
    });
    expect([200, 304]).toContain(loginResponse?.status());
  });

  test("navigation does not produce console errors", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/register", { waitUntil: "networkidle" });

    // Only flag actual JS runtime errors — WebKit additionally logs HTTP
    // error statuses (e.g. 401 for unauthenticated /api/auth/me) as console
    // errors, which are expected and not indicative of a bug
    const criticalErrors = errors.filter(
      (e) =>
        e.includes("TypeError") ||
        e.includes("ReferenceError") ||
        e.includes("SyntaxError") ||
        (e.includes("Uncaught") && !e.toLowerCase().includes("warning")),
    );
    expect(criticalErrors.length).toBe(0);
  });

  // ============================================================
  // FORM INTERACTION REGRESSION
  // ============================================================
  test("form fields can be filled and cleared", async ({ page }) => {
    await page.goto("/register");

    const emailInput = page.locator("#email");
    const testEmail = generateUniqueEmail();

    // Fill
    await emailInput.fill(testEmail);
    expect(await emailInput.inputValue()).toBe(testEmail);

    // Clear
    await emailInput.clear();
    expect(await emailInput.inputValue()).toBe("");

    // Fill again
    await emailInput.fill(testEmail);
    expect(await emailInput.inputValue()).toBe(testEmail);
  });

  test("password inputs mask character entry", async ({ page }) => {
    await page.goto("/register");

    const passwordInput = page.locator("#password");
    const testPassword = getStrongPassword();

    // Fill password
    await passwordInput.fill(testPassword);

    // Input value should be the actual password (Playwright sees it)
    expect(await passwordInput.inputValue()).toBe(testPassword);

    // But the type should be password (visual masking on frontend)
    expect(await passwordInput.getAttribute("type")).toBe("password");
  });

  test("form shows/hides elements appropriately", async ({ page }) => {
    await page.goto("/register");

    // Get initial state
    const form = page.locator("form");
    const initial = await form.isVisible();

    expect(initial).toBeTruthy();

    // Interact with form
    const emailInput = page.locator("#email");
    await emailInput.fill(generateUniqueEmail());

    // Form should still be visible
    expect(await form.isVisible()).toBeTruthy();
  });

  test("page remains responsive after user input", async ({ page }) => {
    await page.goto("/register");

    const emailInput = page.locator("#email");
    const passwordInput = page.locator("#password");

    // Fill first field
    await emailInput.fill(generateUniqueEmail());

    // Should still be able to interact with second field
    await passwordInput.fill(getStrongPassword());

    expect(await passwordInput.inputValue()).toBe(getStrongPassword());
  });

  // ============================================================
  // UI CONSISTENCY TESTS
  // ============================================================
  test("register page has consistent styling", async ({ page }) => {
    await page.goto("/register");

    const form = page.locator("form");
    const inputs = form.locator("input");

    const count = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(3); // email, password, confirm

    // All inputs should be visible
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      expect(await input.isVisible()).toBeTruthy();
    }
  });

  test("form labels exist for accessibility", async ({ page }) => {
    await page.goto("/register");

    // Look for labels or aria-labels
    const labels = page.locator("label");
    const ariaLabels = page.locator("[aria-label]");

    const labelCount = await labels.count();
    const ariaCount = await ariaLabels.count();

    // Should have at least some labels or aria attributes
    expect(labelCount + ariaCount).toBeGreaterThan(0);
  });

  test("form elements are properly spaced and visible", async ({ page }) => {
    await page.goto("/register");

    const form = page.locator("form");
    const boundingBox = await form.boundingBox();

    // Form should have dimensions (be rendered)
    expect(boundingBox).not.toBeNull();
    expect(boundingBox?.width).toBeGreaterThan(0);
    expect(boundingBox?.height).toBeGreaterThan(0);
  });

  // ============================================================
  // EDGE CASES & ROBUSTNESS
  // ============================================================
  test("can reload register page multiple times", async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      await page.goto("/register", { waitUntil: "domcontentloaded" });

      const form = page.locator("form");
      expect(await form.isVisible()).toBeTruthy();
    }
  });

  test("can switch between register and login pages", async ({ page }) => {
    // Go to register
    await page.goto("/register");
    expect(page.url()).toContain("/register");

    // Go to login
    await page.goto("/login");
    expect(page.url()).toContain("/login");

    // Back to register
    await page.goto("/register");
    expect(page.url()).toContain("/register");
  });

  test("back button navigation works", async ({ page }) => {
    await page.goto("/register");
    await page.waitForLoadState("networkidle").catch(() => {});
    const registerUrlPath = page.url().split('?')[0]; // Get path without query params

    await page.goto("/login");
    await page.waitForLoadState("networkidle").catch(() => {});

    // Go back
    await page.goBack();
    // Wait for page to load after going back
    await page.waitForLoadState("networkidle").catch(() => {});
    await page.waitForTimeout(500);

    // Should be back at register
    const currentUrlPath = page.url().split('?')[0];
    expect(currentUrlPath).toBe(registerUrlPath);
  });

  test("form inputs persist during page interactions", async ({ page }) => {
    await page.goto("/register");

    const email = generateUniqueEmail();
    const password = getStrongPassword();

    // Fill form
    await page.fill("#email", email);
    await page.fill("#password", password);

    // Tab to another field and assert focus moves (no fixed waits)
    await page.press("#password", "Tab");
    await expect(page.locator("#confirmPassword")).toBeFocused();

    // Values should still be there
    expect(await page.inputValue("#email")).toBe(email);
    expect(await page.inputValue("#password")).toBe(password);
  });

  // ============================================================
  // INTEGRATION SANITY CHECKS
  // ============================================================
  test("application loads without critical errors", async ({ page }) => {
    const errors: string[] = [];

    page.on("console", (msg) => {
      if (msg.type() === "error") {
        errors.push(msg.text());
      }
    });

    await page.goto("/register", { waitUntil: "networkidle" });

    const criticalErrors = errors.filter(
      (e) =>
        e.includes("TypeError") ||
        e.includes("ReferenceError") ||
        e.includes("SyntaxError"),
    );

    expect(criticalErrors.length).toBe(0);
  });

  test("form is interactive and not stuck loading", async ({ page }) => {
    await page.goto("/register");

    const emailInput = page.locator("#email");

    // Wait for auth check to finish so inputs are enabled (disabled={loading})
    await expect(emailInput).toBeEnabled({ timeout: 10000 });
    await emailInput.click({ timeout: 5000 });
    await emailInput.type(generateUniqueEmail(), { delay: 50 });

    const filledValue = await emailInput.inputValue();
    expect(filledValue.length).toBeGreaterThan(0);
  });

  test("page responds to rapid user input", async ({ page }) => {
    await page.goto("/register");

    // Simulate rapid typing
    await page.fill("#email", generateUniqueEmail());
    await page.fill("#password", getStrongPassword());
    await page.fill("#confirmPassword", getStrongPassword());

    // All fields should have been filled
    expect((await page.inputValue("#email")).length).toBeGreaterThan(0);
    expect((await page.inputValue("#password")).length).toBeGreaterThan(0);
    expect((await page.inputValue("#confirmPassword")).length).toBeGreaterThan(
      0,
    );
  });

  // ============================================================
  // FULL USER FLOW: REGISTRATION TO CHARACTER CREATION
  // ============================================================
  test("complete user registration flow", async ({ page }) => {
    const email = generateUniqueEmail();
    const password = getStrongPassword();

    await registerUser(page, email, password);

    // Should be redirected to dashboard or home page after registration
    const url = page.url();
    expect(!url.includes("/register") && !url.includes("/login")).toBeTruthy();
  });

  test("user can login after registration", async ({ page }) => {
    const email = generateUniqueEmail();
    const password = getStrongPassword();

    // Register first
    await registerUser(page, email, password);

    // Logout by clearing cookies and going to login
    await page.context().clearCookies();

    // Login with same credentials
    await loginUser(page, email, password);

    // Should be logged in (not on login page)
    const url = page.url();
    expect(!url.includes("/login")).toBeTruthy();
  });

  // ============================================================
  // CHARACTER CREATION FLOW (AC Requirement)
  // ============================================================
  test("registered user can create a character", async ({ page }) => {
    const email = generateUniqueEmail();
    const password = getStrongPassword();
    const character = { name: "Aragorn", class: "Fighter", race: "Human" };

    // Register and login
    await registerUser(page, email, password);

    // Create character
    await createCharacter(page, character);

    // Should be redirected away from character creation page
    const url = page.url();
    expect(!url.includes("/characters/create")).toBeTruthy();
  });

  test("multiple characters can be created", async ({ page }) => {
    const email = generateUniqueEmail();
    const password = getStrongPassword();
    const char1 = { name: "Legolas", class: "Ranger", race: "Elf" };
    const char2 = { name: "Gimli", class: "Barbarian", race: "Dwarf" };

    // Register
    await registerUser(page, email, password);

    // Create first character
    await createCharacter(page, char1);

    // Create second character
    await createCharacter(page, char2);

    // Both should be created successfully
    const url = page.url();
    expect(!url.includes("/create")).toBeTruthy();
  });

  // ============================================================
  // PARTY CREATION FLOW (AC Requirement)
  // ============================================================
  test("user can create a party", async ({ page }) => {
    const email = generateUniqueEmail();
    const password = getStrongPassword();
    const party = { name: "Fellowship", memberCount: 4 };

    // Register and login
    await registerUser(page, email, password);

    // Create party
    await createParty(page, party);

    // Should be redirected away from party creation
    const url = page.url();
    expect(!url.includes("/parties/create")).toBeTruthy();
  });

  test("party with different member counts can be created", async ({
    page,
  }) => {
    const email = generateUniqueEmail();
    const password = getStrongPassword();
    const party1 = { name: "Small Group", memberCount: 2 };
    const party2 = { name: "Large Group", memberCount: 6 };

    // Register
    await registerUser(page, email, password);

    // Create party 1
    await createParty(page, party1);

    // Create party 2
    await createParty(page, party2);

    // Both should be created
    const url = page.url();
    expect(!url.includes("/create")).toBeTruthy();
  });

  // ============================================================
  // MONSTER IMPORT FLOW (AC Requirement)
  // ============================================================
  test("user can import monsters from file", async ({ page }) => {
    const email = generateUniqueEmail();
    const password = getStrongPassword();

    // Register and login
    await registerUser(page, email, password);

    // Import monster from sample file
    await importMonster(page, "samples/monster-upload-example.json");

    // Should be redirected away from import page
    const url = page.url();
    expect(!url.includes("/monsters/import")).toBeTruthy();
  });

  // ============================================================
  // ENCOUNTER CREATION FLOW (AC Requirement)
  // ============================================================
  test("user can create an encounter", async ({ page }) => {
    const email = generateUniqueEmail();
    const password = getStrongPassword();
    const encounter = { name: "Goblin Ambush", combatantCount: 3 };

    // Register and login
    await registerUser(page, email, password);

    // Create encounter
    await createEncounter(page, encounter);

    // Should be redirected away from encounter creation
    const url = page.url();
    expect(!url.includes("/encounters/create")).toBeTruthy();
  });

  // ============================================================
  // COMBAT FLOW (AC Requirement)
  // ============================================================
  test("user can open combat screen for an encounter", async ({ page }) => {
    const email = generateUniqueEmail();
    const password = getStrongPassword();
    const encounter = { name: "Test Encounter", combatantCount: 2 };

    // Register, login, and create encounter
    await registerUser(page, email, password);
    await createEncounter(page, encounter);

    // Open combat
    await openCombat(page);

    // Combat screen should be visible
    const url = page.url();
    expect(url.includes("/combat")).toBeTruthy();
  });

  test("combat screen displays required UI elements", async ({ page }) => {
    const email = generateUniqueEmail();
    const password = getStrongPassword();
    const encounter = { name: "Combat UI Test", combatantCount: 2 };

    // Setup: register, login, create encounter
    await registerUser(page, email, password);
    await createEncounter(page, encounter);

    // Open combat screen
    await openCombat(page);

    // Verify combat UI elements are present
    await verifyCombatScreenElements(page);
  });

  // ============================================================
  // COMPREHENSIVE FLOW: REGISTRATION TO COMBAT
  // ============================================================
  test("complete end-to-end flow from registration to combat", async ({
    page,
  }) => {
    const email = generateUniqueEmail();
    const password = getStrongPassword();
    const character = { name: "Thorin", class: "Barbarian", race: "Dwarf" };
    const party = { name: "Dwarven Company", memberCount: 13 };
    const encounter = { name: "Dragon Attack", combatantCount: 5 };

    // 1. Register user
    await registerUser(page, email, password);
    expect(!page.url().includes("/register")).toBeTruthy();

    // 2. Create character
    await createCharacter(page, character);
    expect(!page.url().includes("/characters/create")).toBeTruthy();

    // 3. Create party
    await createParty(page, party);
    expect(!page.url().includes("/parties/create")).toBeTruthy();

    // 4. Create encounter
    await createEncounter(page, encounter);
    expect(!page.url().includes("/encounters/create")).toBeTruthy();

    // 5. Open combat
    await openCombat(page);
    expect(page.url().includes("/combat")).toBeTruthy();

    // 6. Verify combat UI
    await verifyCombatScreenElements(page);
  });
});
