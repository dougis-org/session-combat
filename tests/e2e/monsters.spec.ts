import path from "path";
import { test, expect } from "./fixtures";
import { registerUser, importMonster, STRONG_PASSWORD } from "./helpers/actions";
import { createTestIdentity } from "./helpers/isolation";

const FIXTURE_PATH = path.join(
  __dirname,
  "fixtures",
  "import-monster-variants.json",
);

// 6 MB — exceeds the 5 MB application limit enforced by the import modal.
const OVERSIZED_BUFFER = Buffer.alloc(6 * 1024 * 1024, "x");

const MISSING_FIELD_MONSTERS = JSON.stringify([
  { name: "Broken Beast", maxHp: 10 },
]);

test.beforeEach(async ({ page }) => {
  await page.context().clearCookies();
});

async function openImportModal(page: import("@playwright/test").Page) {
  await page.goto("/monsters");
  await page.getByRole("button", { name: /import monster/i }).click();
  return page.getByRole("dialog", { name: /import monsters/i });
}

test.describe("Monster import — modal entry point + happy path", () => {
  test("a non-admin user can open the modal from /monsters without navigating away", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);

    const dialog = await openImportModal(page);
    await expect(dialog).toBeVisible();
    await expect(page).toHaveURL(/\/monsters$/);
  });

  test("imports a valid file, shows the preview, confirms, and the monster appears in the library", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);

    const dialog = await openImportModal(page);
    await dialog.locator('input[type="file"]').setInputFiles(FIXTURE_PATH);
    await expect(dialog.getByText("Test Goblin")).toBeVisible({ timeout: 10000 });
    await dialog.getByRole("button", { name: /^confirm$/i }).click();
    await expect(dialog.getByText(/^Imported/i)).toBeVisible({ timeout: 10000 });
    await dialog.getByRole("button", { name: /^close$/i }).click();

    await expect(page.getByText("Test Goblin")).toBeVisible({ timeout: 10000 });
  });

  test("imported monster persists after page reload", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);

    await importMonster(page, FIXTURE_PATH);
    await page.reload();

    await expect(page.getByText("Test Goblin")).toBeVisible({ timeout: 15000 });
  });
});

test.describe("Monster import — validation errors", () => {
  test("a missing required field surfaces the modal error and keeps the modal open", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);

    const dialog = await openImportModal(page);
    await dialog.locator('input[type="file"]').setInputFiles({
      name: "broken.json",
      mimeType: "application/json",
      buffer: Buffer.from(MISSING_FIELD_MONSTERS),
    });

    await expect(page.getByTestId("import-modal-error")).toBeVisible({ timeout: 10000 });
    await expect(dialog).toBeVisible();
  });

  test("malformed JSON is rejected client-side with no import request", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);

    let validateRequested = false;
    await page.route("**/api/monsters/upload/validate", async (route) => {
      validateRequested = true;
      await route.abort();
    });

    const dialog = await openImportModal(page);
    await dialog.locator('input[type="file"]').setInputFiles({
      name: "invalid.json",
      mimeType: "application/json",
      buffer: Buffer.from("{ not valid json }}}"),
    });

    await expect(page.getByTestId("import-modal-error")).toBeVisible({ timeout: 10000 });
    expect(validateRequested).toBe(false);
  });

  test("a file larger than 5 MB is rejected without an import request", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);

    let validateRequested = false;
    await page.route("**/api/monsters/upload/validate", async (route) => {
      validateRequested = true;
      await route.abort();
    });

    const dialog = await openImportModal(page);
    await dialog.locator('input[type="file"]').setInputFiles({
      name: "huge.json",
      mimeType: "application/json",
      buffer: OVERSIZED_BUFFER,
    });

    await expect(page.getByTestId("import-modal-error")).toBeVisible({ timeout: 10000 });
    expect(validateRequested).toBe(false);
  });
});

test.describe("Monster import — duplicates and revert", () => {
  test("re-importing an already-imported monster lists it as skipped and does not duplicate it", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);

    await importMonster(page, FIXTURE_PATH);

    const dialog = await openImportModal(page);
    await dialog.locator('input[type="file"]').setInputFiles(FIXTURE_PATH);
    await dialog.getByRole("button", { name: /^confirm$/i }).click();
    await expect(dialog.getByText(/skipped 1 duplicate/i)).toBeVisible({ timeout: 10000 });
    await expect(dialog.getByText(/skipped 1 duplicate/i)).toContainText("Test Goblin");
    await dialog.getByRole("button", { name: /^close$/i }).click();

    await expect(page.getByText("Test Goblin")).toHaveCount(1);
  });

  test("an ingestion failure shows the rollback error and leaves the library unchanged", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);

    await page.route("**/api/monsters/upload", async (route) => {
      if (route.request().method() !== "POST") return route.continue();
      await route.fulfill({
        status: 500,
        contentType: "application/json",
        body: JSON.stringify({
          reverted: true,
          errors: [{ message: "seeded fault" }],
          orphanedMonsterIds: [],
        }),
      });
    });

    const dialog = await openImportModal(page);
    await dialog.locator('input[type="file"]').setInputFiles(FIXTURE_PATH);
    await dialog.getByRole("button", { name: /^confirm$/i }).click();

    await expect(page.getByTestId("import-modal-error")).toContainText(/rolled back/i);
    await dialog.getByRole("button", { name: /close/i }).click();
    await expect(page.getByText("Test Goblin")).toHaveCount(0);
  });
});
