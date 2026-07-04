import path from "path";
import { test, expect } from "./fixtures";
import { registerUser, importMonster, STRONG_PASSWORD } from "./helpers/actions";
import { createTestIdentity } from "./helpers/isolation";

const FIXTURE_PATH = path.join(
  __dirname,
  "fixtures",
  "import-monster-variants.json",
);

// 6 MB — exceeds the 5 MB application limit configured in MonsterImportContent
const OVERSIZED_BUFFER = Buffer.alloc(6 * 1024 * 1024, "x");

test.beforeEach(async ({ page }) => {
  await page.context().clearCookies();
});

test.describe("Monster import — valid JSON", () => {
  test("imports valid monster JSON and redirects to monsters page", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);

    await importMonster(page, FIXTURE_PATH);

    await expect(page).toHaveURL(/\/monsters/);
  });

  test("imported monster appears in monster list", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);

    await importMonster(page, FIXTURE_PATH);

    await expect(page.getByText("Test Goblin")).toBeVisible({ timeout: 10000 });
  });
});

test.describe("Monster import — invalid JSON rejection", () => {
  test("shows error when uploading malformed JSON", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);

    await page.goto("/monsters/import");
    await page.locator('input[type="file"]').setInputFiles({
      name: "invalid.json",
      mimeType: "application/json",
      buffer: Buffer.from("{ this is not : valid json }}}"),
    });
    await page.click('button[type="submit"]');

    await expect(page.getByRole("alert")).toBeVisible({ timeout: 10000 });
  });

  test("stays on import page when invalid JSON is submitted", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);

    await page.goto("/monsters/import");
    await page.locator('input[type="file"]').setInputFiles({
      name: "invalid.json",
      mimeType: "application/json",
      buffer: Buffer.from("not-json-at-all"),
    });
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/monsters\/import/, { timeout: 10000 });
  });
});

test.describe("Monster import — file size rejection", () => {
  test("rejects file exceeding size limit without uploading", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);

    await page.goto("/monsters/import");
    await page.locator('input[type="file"]').setInputFiles({
      name: "huge.json",
      mimeType: "application/json",
      buffer: OVERSIZED_BUFFER,
    });
    await page.click('button[type="submit"]');

    await expect(page.getByText(/too large/i)).toBeVisible({ timeout: 10000 });
  });

  test("stays on import page when oversized file is submitted", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);

    await page.goto("/monsters/import");
    await page.locator('input[type="file"]').setInputFiles({
      name: "huge.json",
      mimeType: "application/json",
      buffer: OVERSIZED_BUFFER,
    });
    await page.click('button[type="submit"]');

    await expect(page).toHaveURL(/\/monsters\/import/, { timeout: 10000 });
  });
});
