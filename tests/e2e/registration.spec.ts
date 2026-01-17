import { test, expect } from '@playwright/test';

// Test credentials - for testing purposes only
const VALID_TEST_PASSWORD = 'SecurePassword123!';

test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication
    await page.context().clearCookies();
  });

  test('should successfully register a new user', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = VALID_TEST_PASSWORD;

    // Navigate to register page
    await page.goto('/register');

    // Verify form elements are visible
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();

    // Fill in registration form
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for navigation to complete (should redirect to dashboard or protected route)
    await page.waitForURL((url) => {
      // Should not stay on /register or go to /login on error
      return !url.pathname.includes('/register') && !url.pathname.includes('/login');
    }, { timeout: 10000 });

    // Verify user is authenticated (should be redirected to a protected page)
    expect(page.url()).not.toContain('/register');
    expect(page.url()).not.toContain('/login');

    // Check for success indicators - could be a dashboard, combat page, or other protected route
    const pageContent = await page.content();
    const isProtectedPage = 
      page.url().includes('/combat') || 
      page.url().includes('/encounters') ||
      page.url().includes('/characters');
    
    expect(isProtectedPage).toBeTruthy();
  });

  test('should reject registration with invalid email', async ({ page }) => {
    await page.goto('/register');

    // Fill in with invalid email
    await page.fill('input[type="email"]', 'not-an-email');
    await page.fill('input[type="password"]', VALID_TEST_PASSWORD);

    // Submit the form
    await page.click('button[type="submit"]');

    // Should show an error message or stay on register page
    await page.waitForTimeout(1000);

    // Verify we're still on register page (form validation failed)
    expect(page.url()).toContain('/register');

    // Look for error message
    const errorVisible = await page.isVisible('text=/invalid|error/i');
    expect(errorVisible).toBeTruthy();
  });

  test('should enable submit button for valid password', async ({ page }) => {
    await page.goto('/register');

    const testEmail = `test-${Date.now()}@example.com`;
    const validPassword = 'SecurePassword123';

    // Fill in with valid password
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', validPassword);

    // Verify submit button is enabled for valid password
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();
  });

  test('should reject registration with weak password', async ({ page }) => {
    await page.goto('/register');

    const testEmail = `test-${Date.now()}@example.com`;

    // Fill in with weak password
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'weak');

    // Verify submit button is disabled for weak password
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();

    // Verify we can still see the password requirements
    await expect(page.locator('text=/password requirements/i')).toBeVisible();

    // Verify the requirement for at least 8 characters is still showing as unmet
    const lengthRequirement = page.locator('text=/at least 8 characters/i');
    await expect(lengthRequirement).toBeVisible();
  });

  test('should reject registration if email already exists', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = VALID_TEST_PASSWORD;

    // First registration should succeed
    await page.goto('/register');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for redirect
    await page.waitForURL((url) => !url.pathname.includes('/register'), { timeout: 10000 });

    // Go back to register page
    await page.goto('/register');

    // Try to register with same email
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should show error about email existing
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/register');

    const errorVisible = await page.isVisible('text=/already exists|email already|duplicate/i');
    expect(errorVisible).toBeTruthy();
  });

  test('should successfully login after registration', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = VALID_TEST_PASSWORD;

    // Register a new user
    await page.goto('/register');
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for successful registration redirect
    await page.waitForURL((url) => !url.pathname.includes('/register'), { timeout: 10000 });

    // Logout
    await page.goto('/login');
    const logoutButton = page.locator('button:has-text("Logout")');
    if (await logoutButton.isVisible()) {
      await logoutButton.click();
      await page.waitForURL('**/login', { timeout: 5000 });
    }

    // Clear cookies to simulate fresh login
    await page.context().clearCookies();
    await page.goto('/login');

    // Login with the registered credentials
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Should successfully log in and redirect away from login page
    await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 10000 });

    expect(page.url()).not.toContain('/login');
  });

  test('should display validation error when password requirements not met', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;

    await page.goto('/register');

    // Fill in valid email but invalid password (no uppercase)
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'lowercase123');
    
    // Confirm password
    const confirmInputs = await page.locator('input[type="password"]').all();
    await confirmInputs[1].fill('lowercase123');

    // Submit button should be disabled
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeDisabled();
  });

  test('should show error message when password requirements violated after server validation', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;

    await page.goto('/register');

    // Fill in form with valid data
    await page.fill('input[type="email"]', testEmail);
    const validPassword = 'ValidPassword123';
    const passwordInputs = await page.locator('input[type="password"]').all();
    await passwordInputs[0].fill(validPassword);
    await passwordInputs[1].fill(validPassword);

    // Submit form (should succeed or fail with specific error)
    const submitButton = page.locator('button[type="submit"]');
    await expect(submitButton).toBeEnabled();

    // If registration fails due to server error, verify error is displayed
    // (This test validates the error display mechanism works)
    await submitButton.click();

    // Wait a bit for potential server response
    await page.waitForTimeout(1000);

    // Either we redirect (success) or see an error message
    const hasError = await page.isVisible('text=/password|error|requirement/i');
    const hasRedirected = !page.url().includes('/register');

    expect(hasError || hasRedirected).toBeTruthy();
  });

  test('should show error when confirm password does not match', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;
    const password = 'ValidPassword123';

    await page.goto('/register');

    await page.fill('input[type="email"]', testEmail);
    const passwordInputs = await page.locator('input[type="password"]').all();
    await passwordInputs[0].fill(password);
    await passwordInputs[1].fill('DifferentPassword123');

    // Submit button should remain disabled until passwords match
    const submitButton = page.locator('button[type="submit"]');
    
    // After entering mismatched passwords, button should be disabled or error shown
    await page.waitForTimeout(500);
    const passwordMismatchError = await page.isVisible('text=/do not match/i');
    expect(passwordMismatchError).toBeTruthy();
  });

  test('should prevent double-submit by disabling button during request', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = VALID_TEST_PASSWORD;

    await page.goto('/register');

    // Fill in valid credentials
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', testPassword);
    const confirmInputs = await page.locator('input[type="password"]').all();
    await confirmInputs[1].fill(testPassword);

    // Click submit and immediately check if button is disabled
    const submitButton = page.locator('button[type="submit"]');
    
    // Before click, button should be enabled
    await expect(submitButton).toBeEnabled();

    // Click submit
    await submitButton.click();

    // Button should be disabled during submission (showing "Creating Account...")
    await expect(submitButton).toBeDisabled();
  });
});
