import { test, expect } from "@playwright/test";

// Test credentials - for testing purposes only
const VALID_TEST_PASSWORD = "SecurePassword123!";

test.describe("Registration Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication
    await page.context().clearCookies();
  });

  test("should successfully register a new user", async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = VALID_TEST_PASSWORD;

    // Navigate to register page
    await page.goto("/register");

    // Verify form elements are visible
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator("#password")).toBeVisible();

    // Fill in registration form
    await page.fill("#email", testEmail);
    await page.fill("#password", testPassword);
    await page.fill("#confirmPassword", testPassword);

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for navigation to complete (should redirect to dashboard or protected route)
    // Use 30s timeout to accommodate CI environment delays
    await page.waitForURL(
      (url) => {
        // Should not stay on /register or go to /login on error
        return (
          !url.pathname.includes("/register") &&
          !url.pathname.includes("/login")
        );
      },
      { timeout: 30000 },
    );

    // Verify user is authenticated (should be redirected away from register)
    expect(page.url()).not.toContain("/register");
    expect(page.url()).not.toContain("/login");
  });

  test("should reject registration with invalid email", async ({ page }) => {
    await page.goto("/register");

    // Fill in with invalid email
    await page.fill("#email", "not-an-email");
    await page.fill("#password", VALID_TEST_PASSWORD);
    await page.fill("#confirmPassword", VALID_TEST_PASSWORD);

    // Submit the form
    await page.click('button[type="submit"]');

    // Should remain on register page — no navigation on a validation error
    await expect(page).toHaveURL(/\/register/);
  });

  test("should enable submit button for valid password", async ({ page }) => {
    await page.goto("/register");

    const testEmail = `test-${Date.now()}@example.com`;
    const validPassword = "SecurePassword123";

    // Fill in with valid password
    await page.fill("#email", testEmail);
    await page.fill("#password", validPassword);

    // Verify submit button is enabled for valid password
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
  });

  test("should reject registration with weak password", async ({ page }) => {
    await page.goto("/register");

    const testEmail = `test-${Date.now()}@example.com`;

    // Fill in with weak password
    await page.fill("#email", testEmail);
    await page.fill("#password", "weak");
    await page.fill("#confirmPassword", "weak");

    // Verify submit button is disabled for weak password
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();

    // Verify we can still see the password requirements
    await expect(page.locator("text=/password requirements/i")).toBeVisible();

    // Verify the requirement for at least 8 characters is still showing as unmet
    const lengthRequirement = page.locator("text=/at least 8 characters/i");
    await expect(lengthRequirement).toBeVisible();
  });

  test("should reject registration if email already exists", async ({
    page,
    context,
  }) => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = VALID_TEST_PASSWORD;

    // First registration should succeed
    await page.goto("/register");
    await page.fill("#email", testEmail);
    await page.fill("#password", testPassword);
    await page.fill("#confirmPassword", testPassword);
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL((url) => !url.pathname.includes("/register"), {
      timeout: 10000,
    });

    // Clear cookies to log out user before second registration attempt
    await context.clearCookies();

    // Go back to register page
    await page.goto("/register");
    await page.waitForLoadState("networkidle").catch(() => {});

    // Try to register with same email
    await page.fill("#email", testEmail);
    await page.fill("#password", testPassword);
    await page.fill("#confirmPassword", testPassword);
    await page.click('button[type="submit"]');

    // Wait briefly to see if we navigate — if the email is taken we stay on /register
    await page.waitForURL((url) => !url.pathname.includes("/register"), { timeout: 5000 }).catch(() => {});

    // Should still be on register page (duplicate email should show error)
    expect(page.url()).toContain("/register");
  });

  test("should successfully login after registration", async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = VALID_TEST_PASSWORD;

    // Register a new user
    await page.goto("/register");
    await page.fill("#email", testEmail);
    await page.fill("#password", testPassword);
    await page.fill("#confirmPassword", testPassword);
    await page.click('button[type="submit"]');

    // Wait for successful registration redirect
    await page.waitForURL((url) => !url.pathname.includes("/register"), {
      timeout: 10000,
    });

    // Logout — page.goto follows the authenticated redirect to home, where
    // the Logout button lives
    await page.goto("/login");
    const logoutButton = page.locator('button:has-text("Logout")');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForURL("**/login", { timeout: 5000 });
      // Wait for the client-side logout navigation to fully settle before
      // issuing another page.goto — in WebKit a racing router.replace and
      // page.goto to the same URL both trigger "navigation interrupted"
      await page.waitForLoadState("networkidle").catch(() => {});
    }

    // Clear cookies to simulate fresh login
    await page.context().clearCookies();
    await page.goto("/login");

    // Wait for auth check to complete so inputs are stable and enabled
    await expect(page.locator('button[type="submit"]')).toBeEnabled({
      timeout: 10000,
    });

    // Login with the registered credentials
    await page.locator('#email').fill(testEmail);
    await page.locator('#password').fill(testPassword);
    await page.click('button[type="submit"]');

    // Should successfully log in and redirect away from login page
    await page.waitForURL((url) => !url.pathname.includes("/login"), {
      timeout: 10000,
    });

    expect(page.url()).not.toContain("/login");
  });
});
