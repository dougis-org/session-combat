import { test, expect } from '@playwright/test';

test.describe('Registration Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing authentication
    await page.context().clearCookies();
  });

  test('should successfully register a new user', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'SecurePassword123!';

    // Navigate to register page
    await page.goto('/register');

    // Wait for the page to load
    await expect(page).toHaveTitle(/register|session-combat/i);

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
      page.url().includes('/players');
    
    expect(isProtectedPage).toBeTruthy();
  });

  test('should reject registration with invalid email', async ({ page }) => {
    await page.goto('/register');

    // Fill in with invalid email
    await page.fill('input[type="email"]', 'not-an-email');
    await page.fill('input[type="password"]', 'SecurePassword123!');

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

  test('should reject registration with weak password', async ({ page }) => {
    await page.goto('/register');

    const testEmail = `test-${Date.now()}@example.com`;

    // Fill in with weak password
    await page.fill('input[type="email"]', testEmail);
    await page.fill('input[type="password"]', 'weak');

    // Submit the form
    await page.click('button[type="submit"]');

    // Should show an error message or stay on register page
    await page.waitForTimeout(1000);

    // Verify we're still on register page
    expect(page.url()).toContain('/register');

    // Look for password requirement error
    const errorVisible = await page.isVisible('text=/password|requirement|weak/i');
    expect(errorVisible).toBeTruthy();
  });

  test('should reject registration if email already exists', async ({ page }) => {
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'SecurePassword123!';

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
    const testPassword = 'SecurePassword123!';

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
});
