import { test, expect } from '@playwright/test';

const VALID_TEST_PASSWORD = process.env.TEST_PASSWORD || 'TestPassword123!';

test.describe('Logout behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  test('logout clears client storage and redirects to login', async ({ page, context }) => {
    const testEmail = `test-${Date.now()}@example.com`;

    // Register via API to avoid UI interaction issues
    const registerResponse = await context.request.post('/api/auth/register', {
      data: {
        email: testEmail,
        password: VALID_TEST_PASSWORD,
      },
    });

    await expect(registerResponse).toBeOK();

    // Navigate to home page (should be logged in)
    await page.goto('/');
    await expect(page).toHaveURL(/.*\/$/);

    // Seed client-side storage that should be cleared on logout
    await page.evaluate(() => {
      localStorage.setItem('sessionData', JSON.stringify({ dummy: true }));
      localStorage.setItem('sessionCombat:v1:encounters:dummy', JSON.stringify({ id: 'dummy' }));
      localStorage.setItem('sessionCombat:v1:syncQueue', JSON.stringify([{ _id: 'sync-1', type: 'POST' }]));
    });

    // Click logout
    const logoutButton = page.locator('button:has-text("Logout")');
    await expect(logoutButton).toBeVisible();
    await logoutButton.click();

    // Wait for navigation to login
    await page.waitForURL('**/login', { timeout: 5000 });
    expect(page.url()).toContain('/login');

    // Verify client-side keys removed
    const sessionData = await page.evaluate(() => localStorage.getItem('sessionData'));
    expect(sessionData).toBeNull();

    const syncQueue = await page.evaluate(() => localStorage.getItem('sessionCombat:v1:syncQueue'));
    expect(syncQueue).toBeNull();

    // Verify no keys remain with the sessionCombat:v1 prefix
    const anySessionKeys = await page.evaluate(() => {
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('sessionCombat:v1:')) return true;
      }
      return false;
    });
    expect(anySessionKeys).toBe(false);

    // Going back should not reveal protected content
    await page.goBack();
    // Ensure still not signed-in (no welcome text)
    const containsWelcome = await page.locator('text=/welcome/i').count();
    expect(containsWelcome).toBe(0);
  });
});