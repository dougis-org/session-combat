import { test, expect } from "@playwright/test";
import {
  generateUniqueEmail,
  fillRegistrationForm,
  submitRegistrationForm,
  registerUser,
  loginUser,
} from "./helpers/actions";

const STRONG_PASSWORD = "TestPassword123!";

test.describe("Auth", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  // ────────────────────────────────────────────────────────────
  // Registration page — structure & accessibility
  // ────────────────────────────────────────────────────────────

  test("register page loads and displays form", async ({ page }) => {
    await page.goto("/register");
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible({
      timeout: 10000,
    });
    await expect(page.locator("form")).toBeVisible();
  });

  test("register form has all required input fields", async ({ page }) => {
    await page.goto("/register");

    const emailInput = page.locator("#email");
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    expect(await emailInput.getAttribute("type")).toBe("email");

    const passwordInput = page.locator("#password");
    await expect(passwordInput).toBeVisible();
    expect(await passwordInput.getAttribute("type")).toBe("password");

    const confirmInput = page.locator("#confirmPassword");
    await expect(confirmInput).toBeVisible();
    expect(await confirmInput.getAttribute("type")).toBe("password");
  });

  test("register form has submit button", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator('button[type="submit"]')).toBeVisible({
      timeout: 10000,
    });
  });

  test("email input accepts valid email format", async ({ page }) => {
    await page.goto("/register");
    const email = generateUniqueEmail();
    await page.locator("#email").fill(email);
    expect(await page.locator("#email").inputValue()).toBe(email);
  });

  test("password input accepts text input", async ({ page }) => {
    await page.goto("/register");
    await page.locator("#password").fill(STRONG_PASSWORD);
    expect(await page.locator("#password").inputValue()).toBe(STRONG_PASSWORD);
  });

  test("confirm password input accepts text input", async ({ page }) => {
    await page.goto("/register");
    await page.locator("#confirmPassword").fill(STRONG_PASSWORD);
    expect(await page.locator("#confirmPassword").inputValue()).toBe(
      STRONG_PASSWORD,
    );
  });

  test("password requirements are displayed", async ({ page }) => {
    await page.goto("/register");
    const pageText = await page.textContent("body");
    expect(pageText).toMatch(
      /password|requirement|character|uppercase|lowercase|number/i,
    );
  });

  test("password requirements update based on input", async ({ page }) => {
    await page.goto("/register");

    await page.locator("#password").fill("weak");
    await expect(
      page.locator('[data-testid="password-strength"]'),
    ).toHaveAttribute("data-strength", "weak");

    await page.locator("#password").fill(STRONG_PASSWORD);
    await expect(
      page.locator('[data-testid="password-strength"]'),
    ).toHaveAttribute("data-strength", "strong");

    await expect(page.locator('[data-testid="req-length"]')).toHaveAttribute(
      "data-satisfied",
      "true",
    );
    await expect(page.locator('[data-testid="req-lowercase"]')).toHaveAttribute(
      "data-satisfied",
      "true",
    );
    await expect(page.locator('[data-testid="req-uppercase"]')).toHaveAttribute(
      "data-satisfied",
      "true",
    );
    await expect(page.locator('[data-testid="req-number"]')).toHaveAttribute(
      "data-satisfied",
      "true",
    );
  });

  test("can link to login page from register", async ({ page }) => {
    await page.goto("/register");
    const loginLink = page
      .locator("a")
      .filter({ hasText: /log in|login|sign in/i })
      .first();
    await expect(loginLink).toBeVisible();
    await loginLink.click();
    await expect(page).toHaveURL(/\/(login|signin)/);
  });

  // ────────────────────────────────────────────────────────────
  // Login page — structure
  // ────────────────────────────────────────────────────────────

  test("login page loads and displays form", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("form")).toBeVisible({ timeout: 10000 });
  });

  test("login form has email and password fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#email")).toHaveAttribute("type", "email");
    await expect(page.locator("#password")).toBeVisible();
    await expect(page.locator("#password")).toHaveAttribute("type", "password");
  });

  test("login form has submit button", async ({ page }) => {
    await page.goto("/login");
    const submitBtn = page.locator('button[type="submit"]').first();
    await expect(submitBtn).toBeVisible();
    await expect(submitBtn).toBeEnabled();
  });

  // ────────────────────────────────────────────────────────────
  // Navigation & routing
  // ────────────────────────────────────────────────────────────

  test("register and login pages are accessible", async ({ page }) => {
    const registerResponse = await page.goto("/register", {
      waitUntil: "domcontentloaded",
    });
    expect([200, 304]).toContain(registerResponse?.status());

    const loginResponse = await page.goto("/login", {
      waitUntil: "domcontentloaded",
    });
    expect([200, 304]).toContain(loginResponse?.status());
  });

  test("navigation does not produce console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });

    await page.goto("/register", { waitUntil: "domcontentloaded" });

    const criticalErrors = errors.filter(
      (e) =>
        e.includes("TypeError") ||
        e.includes("ReferenceError") ||
        e.includes("SyntaxError") ||
        (e.includes("Uncaught") && !e.toLowerCase().includes("warning")),
    );
    expect(criticalErrors.length).toBe(0);
  });

  // ────────────────────────────────────────────────────────────
  // Form interaction regression
  // ────────────────────────────────────────────────────────────

  test("form fields can be filled and cleared", async ({ page }) => {
    await page.goto("/register");
    const email = generateUniqueEmail();
    const emailInput = page.locator("#email");

    await emailInput.fill(email);
    expect(await emailInput.inputValue()).toBe(email);

    await emailInput.clear();
    expect(await emailInput.inputValue()).toBe("");

    await emailInput.fill(email);
    expect(await emailInput.inputValue()).toBe(email);
  });

  test("password inputs mask character entry", async ({ page }) => {
    await page.goto("/register");
    await page.locator("#password").fill(STRONG_PASSWORD);
    expect(await page.locator("#password").inputValue()).toBe(STRONG_PASSWORD);
    expect(await page.locator("#password").getAttribute("type")).toBe(
      "password",
    );
  });

  test("form shows/hides elements appropriately", async ({ page }) => {
    await page.goto("/register");
    await expect(page.locator("form")).toBeVisible();
    await page.locator("#email").fill(generateUniqueEmail());
    await expect(page.locator("form")).toBeVisible();
  });

  test("page remains responsive after user input", async ({ page }) => {
    await page.goto("/register");
    await page.locator("#email").fill(generateUniqueEmail());
    await page.locator("#password").fill(STRONG_PASSWORD);
    expect(await page.locator("#password").inputValue()).toBe(STRONG_PASSWORD);
  });

  // ────────────────────────────────────────────────────────────
  // UI consistency
  // ────────────────────────────────────────────────────────────

  test("register page has consistent styling", async ({ page }) => {
    await page.goto("/register");
    const inputs = page.locator("form input");
    const count = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(3);
    for (let i = 0; i < count; i++) {
      expect(await inputs.nth(i).isVisible()).toBeTruthy();
    }
  });

  test("form labels exist for accessibility", async ({ page }) => {
    await page.goto("/register");
    const labelCount = await page.locator("label").count();
    const ariaCount = await page.locator("[aria-label]").count();
    expect(labelCount + ariaCount).toBeGreaterThan(0);
  });

  test("form elements are properly spaced and visible", async ({ page }) => {
    await page.goto("/register");
    const boundingBox = await page.locator("form").boundingBox();
    expect(boundingBox).not.toBeNull();
    expect(boundingBox?.width).toBeGreaterThan(0);
    expect(boundingBox?.height).toBeGreaterThan(0);
  });

  // ────────────────────────────────────────────────────────────
  // Edge cases & robustness
  // ────────────────────────────────────────────────────────────

  test("can reload register page multiple times", async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      await page.goto("/register", { waitUntil: "domcontentloaded" });
      await expect(page.locator("form")).toBeVisible();
    }
  });

  test("can switch between register and login pages", async ({ page }) => {
    await page.goto("/register");
    expect(page.url()).toContain("/register");

    await page.goto("/login");
    expect(page.url()).toContain("/login");

    await page.goto("/register");
    expect(page.url()).toContain("/register");
  });

  test("back button navigation works", async ({ page }) => {
    await page.goto("/register", { waitUntil: "domcontentloaded" });
    const registerPath = page.url().split("?")[0];

    await page.goto("/login", { waitUntil: "domcontentloaded" });

    await page.goBack();
    await expect(page.locator("form")).toBeVisible({ timeout: 10000 });

    expect(page.url().split("?")[0]).toBe(registerPath);
  });

  test("form inputs persist during page interactions", async ({ page }) => {
    await page.goto("/register");
    const email = generateUniqueEmail();

    await page.fill("#email", email);
    await page.fill("#password", STRONG_PASSWORD);
    await page.press("#password", "Tab");
    await expect(page.locator("#confirmPassword")).toBeFocused();

    expect(await page.inputValue("#email")).toBe(email);
    expect(await page.inputValue("#password")).toBe(STRONG_PASSWORD);
  });

  test("form is interactive and not stuck loading", async ({ page }) => {
    await page.goto("/register");
    const emailInput = page.locator("#email");
    await emailInput.click({ timeout: 5000 });
    await emailInput.fill(generateUniqueEmail());
    expect((await emailInput.inputValue()).length).toBeGreaterThan(0);
  });

  test("page responds to rapid user input", async ({ page }) => {
    await page.goto("/register");
    await page.fill("#email", generateUniqueEmail());
    await page.fill("#password", STRONG_PASSWORD);
    await page.fill("#confirmPassword", STRONG_PASSWORD);

    expect((await page.inputValue("#email")).length).toBeGreaterThan(0);
    expect((await page.inputValue("#password")).length).toBeGreaterThan(0);
    expect((await page.inputValue("#confirmPassword")).length).toBeGreaterThan(
      0,
    );
  });

  // ────────────────────────────────────────────────────────────
  // Registration flows — real submissions
  // ────────────────────────────────────────────────────────────

  test("complete user registration flow", async ({ page }) => {
    await registerUser(page, generateUniqueEmail(), STRONG_PASSWORD);
    await expect(page).not.toHaveURL(/\/(register|login)/);
  });

  test("user can login after registration", async ({ page }) => {
    const email = generateUniqueEmail();
    await registerUser(page, email, STRONG_PASSWORD);
    await page.context().clearCookies();
    // Navigate to /login first so the browser settles into a clean unauthenticated
    // state before loginUser fills and submits the form. Without this, WebKit can
    // race a background auth-check redirect against the explicit goto inside loginUser.
    await page.goto("/login", { waitUntil: "domcontentloaded" });
    await loginUser(page, email, STRONG_PASSWORD);
    await expect(page).not.toHaveURL(/\/login/);
  });

  test("should reject registration with invalid email", async ({ page }) => {
    await page.goto("/register");
    await page.fill("#email", "not-an-email");
    await page.fill("#password", STRONG_PASSWORD);
    await page.fill("#confirmPassword", STRONG_PASSWORD);
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL(/\/register/);
  });

  test("should reject registration with weak password — submit button disabled", async ({
    page,
  }) => {
    await page.goto("/register");
    await page.fill("#email", generateUniqueEmail());
    await page.fill("#password", "weak");
    await page.fill("#confirmPassword", "weak");
    await expect(page.locator('button[type="submit"]')).toBeDisabled();
  });

  test("should reject registration if email already exists", async ({
    page,
    context,
  }) => {
    const email = generateUniqueEmail();

    await page.goto("/register");
    await fillRegistrationForm(page, email, STRONG_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL((url) => !url.pathname.includes("/register"), {
      timeout: 10000,
    });

    await context.clearCookies();
    // Settle into a clean unauthenticated state before navigating to /register.
    // In WebKit, clearing cookies while on an authenticated page can trigger a
    // concurrent auth-middleware redirect to /login, which interrupts our own
    // goto("/login") and causes Playwright to throw. We catch that specific error
    // (both navigations land on /login anyway) and then confirm via waitForURL.
    await page
      .goto("/login", { waitUntil: "domcontentloaded" })
      .catch((e: Error) => {
        if (!e.message.includes("interrupted by another navigation")) throw e;
      });
    await page.waitForURL(/\/login/);
    await page.goto("/register");

    await fillRegistrationForm(page, email, STRONG_PASSWORD);
    const duplicateRegisterResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/api/auth/register") &&
        response.request().method() === "POST",
    );
    await page.click('button[type="submit"]');

    const duplicateRegisterResponse = await duplicateRegisterResponsePromise;
    expect(duplicateRegisterResponse.status()).toBe(409);
    await expect(page).toHaveURL(/\/register/);
  });

  // ────────────────────────────────────────────────────────────
  // Logout
  // ────────────────────────────────────────────────────────────

  test("logout clears client storage and redirects to login", async ({
    page,
    context,
  }) => {
    const email = generateUniqueEmail();

    const registerResponse = await context.request.post("/api/auth/register", {
      data: { email, password: STRONG_PASSWORD },
    });
    await expect(registerResponse).toBeOK();

    await page.goto("/");
    await expect(page).toHaveURL(/.*\/$/);

    await page.evaluate(() => {
      localStorage.setItem("sessionData", JSON.stringify({ dummy: true }));
      localStorage.setItem(
        "sessionCombat:v1:encounters:dummy",
        JSON.stringify({ id: "dummy" }),
      );
      localStorage.setItem(
        "sessionCombat:v1:syncQueue",
        JSON.stringify([{ _id: "sync-1", type: "POST" }]),
      );
    });

    const logoutButton = page.locator('[data-testid="logout-button"]');
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    await page.waitForURL("**/login", { timeout: 5000 });
    expect(page.url()).toContain("/login");

    expect(
      await page.evaluate(() => localStorage.getItem("sessionData")),
    ).toBeNull();
    expect(
      await page.evaluate(() =>
        localStorage.getItem("sessionCombat:v1:syncQueue"),
      ),
    ).toBeNull();

    const anySessionKeys = await page.evaluate(() => {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith("sessionCombat:v1:")) return true;
      }
      return false;
    });
    expect(anySessionKeys).toBe(false);

    await page.goBack();
    expect(await page.locator("text=/welcome/i").count()).toBe(0);
  });
});
