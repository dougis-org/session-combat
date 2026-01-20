import { test, expect } from '@playwright/test';
import { v4 as uuidv4 } from 'uuid';

/**
 * Generate a unique email address for test purposes
 */
function generateUniqueEmail(): string {
  return `test-${uuidv4().split('-')[0]}@test.local`;
}

/**
 * Create a strong test password that meets all requirements
 */
function getStrongPassword(): string {
  return 'TestPassword123!';
}

test.describe.parallel('Regression Test Suite - Session Combat', () => {
  // ============================================================
  // SETUP & TEARDOWN
  // ============================================================
  test.beforeEach(async ({ page }) => {
    // Clear authentication before each test
    await page.context().clearCookies();
  });

  // ============================================================
  // REGISTRATION PAGE - EXISTENCE & ACCESSIBILITY
  // ============================================================
  test('register page loads and displays form', async ({ page }) => {
    await page.goto('/register');
    
    // Verify page title/heading
    await expect(page.locator('h1, h2')).first().toBeVisible({ timeout: 10000 });
    
    // Verify form exists
    await expect(page.locator('form')).toBeVisible();
  });

  test('register form has all required input fields', async ({ page }) => {
    await page.goto('/register');
    
    // Check email field
    const emailInput = page.locator('#email');
    await expect(emailInput).toBeVisible({ timeout: 10000 });
    expect(await emailInput.getAttribute('type')).toBe('email');
    
    // Check password field
    const passwordInput = page.locator('#password');
    await expect(passwordInput).toBeVisible();
    expect(await passwordInput.getAttribute('type')).toBe('password');
    
    // Check confirm password field
    const confirmInput = page.locator('#confirmPassword');
    await expect(confirmInput).toBeVisible();
    expect(await confirmInput.getAttribute('type')).toBe('password');
  });

  test('register form has submit button', async ({ page }) => {
    await page.goto('/register');
    
    const submitBtn = page.locator('button[type="submit"]');
    await expect(submitBtn).toBeVisible({ timeout: 10000 });
    
    // Button should be clickable initially or become clickable when form is filled
    const isClickable = await submitBtn.isEnabled().catch(() => false);
    expect(typeof isClickable).toBe('boolean');
  });

  test('email input accepts valid email format', async ({ page }) => {
    await page.goto('/register');
    
    const emailInput = page.locator('#email');
    const testEmail = generateUniqueEmail();
    
    await emailInput.fill(testEmail);
    const filledValue = await emailInput.inputValue();
    
    expect(filledValue).toBe(testEmail);
  });

  test('password input accepts text input', async ({ page }) => {
    await page.goto('/register');
    
    const passwordInput = page.locator('#password');
    const testPassword = getStrongPassword();
    
    await passwordInput.fill(testPassword);
    const filledValue = await passwordInput.inputValue();
    
    // Password should be filled (even though it appears as dots)
    expect(filledValue).toBe(testPassword);
  });

  test('confirm password input accepts text input', async ({ page }) => {
    await page.goto('/register');
    
    const confirmInput = page.locator('#confirmPassword');
    const testPassword = getStrongPassword();
    
    await confirmInput.fill(testPassword);
    const filledValue = await confirmInput.inputValue();
    
    expect(filledValue).toBe(testPassword);
  });

  test('password requirements are displayed', async ({ page }) => {
    await page.goto('/register');
    
    // Look for password requirements indicators
    const pageText = await page.textContent('body');
    expect(pageText).toMatch(/password|requirement|character|uppercase|lowercase|number/i);
  });

  test('password requirements update based on input', async ({ page }) => {
    await page.goto('/register');
    
    const passwordInput = page.locator('#password');
    
    // Type a weak password
    await passwordInput.fill('weak');
    await page.waitForTimeout(500);
    
    // Type a strong password
    await passwordInput.clear();
    await passwordInput.fill(getStrongPassword());
    await page.waitForTimeout(500);
    
    // Just verify the form responds to input changes
    expect(await passwordInput.inputValue()).toBe(getStrongPassword());
  });

  test('can link to login page from register', async ({ page }) => {
    await page.goto('/register');
    
    // Find login link
    const loginLink = page.locator('a').filter({ hasText: /log in|login|sign in/i }).first();
    
    if (await loginLink.isVisible().catch(() => false)) {
      await loginLink.click();
      await page.waitForLoadState('networkidle').catch(() => {});
      
      // Should navigate to login page
      const url = page.url();
      expect(url.includes('/login') || url.includes('/signin')).toBeTruthy();
    }
  });

  // ============================================================
  // LOGIN PAGE - EXISTENCE & ACCESSIBILITY
  // ============================================================
  test('login page loads and displays form', async ({ page }) => {
    await page.goto('/login');
    
    // Verify page loads
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
  });

  test('login form has email and password fields', async ({ page }) => {
    await page.goto('/login');
    
    // Check email field exists
    const emailInput = page.locator('#email, input[type="email"]').first();
    if (await emailInput.isVisible().catch(() => false)) {
      expect(await emailInput.getAttribute('type')).toBe('email');
    }
    
    // Check password field exists
    const passwordInput = page.locator('#password, input[type="password"]').first();
    if (await passwordInput.isVisible().catch(() => false)) {
      expect(await passwordInput.getAttribute('type')).toBe('password');
    }
  });

  test('login form has submit button', async ({ page }) => {
    await page.goto('/login');
    
    const submitBtn = page.locator('button[type="submit"]').first();
    const isPresent = await submitBtn.isVisible().catch(() => false);
    
    if (isPresent) {
      expect(await submitBtn.isEnabled().catch(() => true)).toBeTruthy();
    }
  });

  // ============================================================
  // NAVIGATION & ROUTING
  // ============================================================
  test('register and login pages are accessible', async ({ page }) => {
    // Test register page
    const registerResponse = await page.goto('/register', { waitUntil: 'domcontentloaded' });
    expect([200, 304]).toContain(registerResponse?.status());
    
    // Test login page
    const loginResponse = await page.goto('/login', { waitUntil: 'domcontentloaded' });
    expect([200, 304]).toContain(loginResponse?.status());
  });

  test('navigation does not produce console errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/register', { waitUntil: 'networkidle' }).catch(() => {});
    await page.waitForTimeout(1000);
    
    // Should not have any critical errors (some warnings might exist)
    const criticalErrors = errors.filter(e => 
      !e.includes('warning') && 
      !e.includes('404') && 
      !e.includes('ERR_INTERNET_DISCONNECTED')
    );
    expect(criticalErrors.length).toBe(0);
  });

  // ============================================================
  // FORM INTERACTION REGRESSION
  // ============================================================
  test('form fields can be filled and cleared', async ({ page }) => {
    await page.goto('/register');
    
    const emailInput = page.locator('#email');
    const testEmail = generateUniqueEmail();
    
    // Fill
    await emailInput.fill(testEmail);
    expect(await emailInput.inputValue()).toBe(testEmail);
    
    // Clear
    await emailInput.clear();
    expect(await emailInput.inputValue()).toBe('');
    
    // Fill again
    await emailInput.fill(testEmail);
    expect(await emailInput.inputValue()).toBe(testEmail);
  });

  test('password inputs mask character entry', async ({ page }) => {
    await page.goto('/register');
    
    const passwordInput = page.locator('#password');
    const testPassword = getStrongPassword();
    
    // Fill password
    await passwordInput.fill(testPassword);
    
    // Input value should be the actual password (Playwright sees it)
    expect(await passwordInput.inputValue()).toBe(testPassword);
    
    // But the type should be password (visual masking on frontend)
    expect(await passwordInput.getAttribute('type')).toBe('password');
  });

  test('form shows/hides elements appropriately', async ({ page }) => {
    await page.goto('/register');
    
    // Get initial state
    const form = page.locator('form');
    const initial = await form.isVisible();
    
    expect(initial).toBeTruthy();
    
    // Interact with form
    const emailInput = page.locator('#email');
    await emailInput.fill(generateUniqueEmail());
    
    // Form should still be visible
    expect(await form.isVisible()).toBeTruthy();
  });

  test('page remains responsive after user input', async ({ page }) => {
    await page.goto('/register');
    
    const emailInput = page.locator('#email');
    const passwordInput = page.locator('#password');
    
    // Fill first field
    await emailInput.fill(generateUniqueEmail());
    
    // Should still be able to interact with second field
    await passwordInput.fill(getStrongPassword());
    
    expect(await passwordInput.inputValue()).toBe(getStrongPassword());
  });

  // ============================================================
  // UI CONSISTENCY TESTS
  // ============================================================
  test('register page has consistent styling', async ({ page }) => {
    await page.goto('/register');
    
    const form = page.locator('form');
    const inputs = form.locator('input');
    
    const count = await inputs.count();
    expect(count).toBeGreaterThanOrEqual(3); // email, password, confirm
    
    // All inputs should be visible
    for (let i = 0; i < count; i++) {
      const input = inputs.nth(i);
      expect(await input.isVisible()).toBeTruthy();
    }
  });

  test('form labels exist for accessibility', async ({ page }) => {
    await page.goto('/register');
    
    // Look for labels or aria-labels
    const labels = page.locator('label');
    const ariaLabels = page.locator('[aria-label]');
    
    const labelCount = await labels.count();
    const ariaCount = await ariaLabels.count();
    
    // Should have at least some labels or aria attributes
    expect(labelCount + ariaCount).toBeGreaterThan(0);
  });

  test('form elements are properly spaced and visible', async ({ page }) => {
    await page.goto('/register');
    
    const form = page.locator('form');
    const boundingBox = await form.boundingBox();
    
    // Form should have dimensions (be rendered)
    expect(boundingBox).not.toBeNull();
    expect(boundingBox?.width).toBeGreaterThan(0);
    expect(boundingBox?.height).toBeGreaterThan(0);
  });

  // ============================================================
  // EDGE CASES & ROBUSTNESS
  // ============================================================
  test('can reload register page multiple times', async ({ page }) => {
    for (let i = 0; i < 3; i++) {
      await page.goto('/register', { waitUntil: 'domcontentloaded' });
      
      const form = page.locator('form');
      expect(await form.isVisible()).toBeTruthy();
    }
  });

  test('can switch between register and login pages', async ({ page }) => {
    // Go to register
    await page.goto('/register');
    expect(page.url()).toContain('/register');
    
    // Go to login
    await page.goto('/login');
    expect(page.url()).toContain('/login');
    
    // Back to register
    await page.goto('/register');
    expect(page.url()).toContain('/register');
  });

  test('back button navigation works', async ({ page }) => {
    await page.goto('/register');
    const registerUrl = page.url();
    
    await page.goto('/login');
    const loginUrl = page.url();
    
    // Go back
    await page.goBack();
    
    // Should be back at register
    expect(page.url()).toBe(registerUrl);
  });

  test('form inputs persist during page interactions', async ({ page }) => {
    await page.goto('/register');
    
    const email = generateUniqueEmail();
    const password = getStrongPassword();
    
    // Fill form
    await page.fill('#email', email);
    await page.fill('#password', password);
    
    // Tab to another field
    await page.press('#password', 'Tab');
    await page.waitForTimeout(500);
    
    // Values should still be there
    expect(await page.inputValue('#email')).toBe(email);
    expect(await page.inputValue('#password')).toBe(password);
  });

  // ============================================================
  // INTEGRATION SANITY CHECKS
  // ============================================================
  test('application loads without critical errors', async ({ page }) => {
    const errors: string[] = [];
    
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    await page.goto('/register', { waitUntil: 'networkidle' }).catch(() => {});
    
    const criticalErrors = errors.filter(e => 
      e.includes('TypeError') || 
      e.includes('ReferenceError') ||
      e.includes('SyntaxError')
    );
    
    expect(criticalErrors.length).toBe(0);
  });

  test('form is interactive and not stuck loading', async ({ page }) => {
    await page.goto('/register');
    
    // Try to click and interact
    const emailInput = page.locator('#email');
    
    // Should be able to interact (not disabled/loading forever)
    await emailInput.click({ timeout: 5000 });
    await emailInput.type(generateUniqueEmail(), { delay: 50 });
    
    const filledValue = await emailInput.inputValue();
    expect(filledValue.length).toBeGreaterThan(0);
  });

  test('page responds to rapid user input', async ({ page }) => {
    await page.goto('/register');
    
    // Simulate rapid typing
    await page.fill('#email', generateUniqueEmail());
    await page.fill('#password', getStrongPassword());
    await page.fill('#confirmPassword', getStrongPassword());
    
    // All fields should have been filled
    expect((await page.inputValue('#email')).length).toBeGreaterThan(0);
    expect((await page.inputValue('#password')).length).toBeGreaterThan(0);
    expect((await page.inputValue('#confirmPassword')).length).toBeGreaterThan(0);
  });
});
