import { test, expect } from "./fixtures";
import { registerUser, createParty, seedCharacter, STRONG_PASSWORD } from "./helpers/actions";
import { createTestIdentity } from "./helpers/isolation";
import partyFixtures from "./fixtures/parties.json";

test.beforeEach(async ({ page }) => {
  await page.context().clearCookies();
});

// ────────────────────────────────────────────────────────────
// Party creation — data-driven
// ────────────────────────────────────────────────────────────

test.describe("Party creation — data-driven", () => {
  for (const fixture of partyFixtures) {
    const { name, description } = fixture;
    test(`create party: ${name}`, async ({ page }, testInfo) => {
      const identity = createTestIdentity(testInfo);
      await registerUser(page, identity.email, STRONG_PASSWORD);
      await createParty(page, { name, description, memberCount: 0 });
      await expect(page.getByText(name)).toBeVisible();
    });
  }
});

// ────────────────────────────────────────────────────────────
// Party creation — validation and form state
// ────────────────────────────────────────────────────────────

test.describe("Party creation — validation and form state", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    await page.goto("/parties");
    await page.getByRole("button", { name: "Add New Party" }).click();
  });

  test("Save Party button is disabled when name field is empty", async ({ page }) => {
    await page.getByLabel("Party Name").clear();
    await expect(
      page.getByRole("button", { name: /Save Party/i }),
    ).toBeDisabled();
  });

  test("Save Party button is disabled for whitespace-only name", async ({ page }) => {
    await page.getByLabel("Party Name").fill("   ");
    // Whitespace-only name does not bypass the empty-name check
    await expect(
      page.getByRole("button", { name: /Save Party/i }),
    ).toBeDisabled();
  });

  test("shows no-characters message when user has no characters", async ({ page }) => {
    await expect(page.getByText("No characters available")).toBeVisible();
    await expect(page.locator('input[type="checkbox"]')).toHaveCount(0);
  });
});

// ────────────────────────────────────────────────────────────
// Party persistence and display
// ────────────────────────────────────────────────────────────

test.describe("Party persistence and display", () => {
  let seedName = "";
  let partyName = "";

  test.beforeEach(async ({ page }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    seedName = identity.name("Seed Fighter");
    partyName = identity.name("Seeded Party");
    await seedCharacter(page, { name: seedName });

    await page.goto("/parties");
    await page.getByRole("button", { name: "Add New Party" }).click();
    await page.getByLabel("Party Name").fill(partyName);
    await page
      .locator("label")
      .filter({ hasText: seedName })
      .locator('input[type="checkbox"]')
      .check();
    await page.getByRole("button", { name: /Save Party/i }).click();
    await page.getByText(partyName).waitFor({ timeout: 15000 });
  });

  test('party card shows "Members: 1" after creating party with one seeded member', async ({
    page,
  }) => {
    await expect(page.getByText("Members: 1")).toBeVisible();
  });

  test("party card shows seeded character name in member list", async ({
    page,
  }) => {
    await expect(page.getByText(seedName)).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────
// Party — no members
// ────────────────────────────────────────────────────────────

test.describe("Party — no members", () => {
  test('party with no members saves and shows "Members: 0"', async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    const partyName = identity.name("Empty Party");
    await createParty(page, { name: partyName, memberCount: 0 });
    await expect(page.getByText("Members: 0")).toBeVisible();
  });
});

// ────────────────────────────────────────────────────────────
// Party editing
// ────────────────────────────────────────────────────────────

test.describe("Party editing", () => {
  test("edited party name persists in list", async ({ page }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    const originalName = identity.name("Original Party");
    const newName = identity.name("Renamed Party");

    await createParty(page, { name: originalName, memberCount: 0 });

    await page
      .locator("div", { has: page.getByRole("heading", { name: originalName }) })
      .getByRole("button", { name: "Edit" })
      .click();
    const nameInput = page.getByLabel("Party Name");
    await nameInput.clear();
    await nameInput.fill(newName);
    await page.getByRole("button", { name: /Save Party/i }).click();

    await expect(page.getByText(newName)).toBeVisible({ timeout: 15000 });
    await expect(page.getByText(originalName)).toHaveCount(0);
  });
});

// ────────────────────────────────────────────────────────────
// Party deletion
// ────────────────────────────────────────────────────────────

test.describe("Party deletion", () => {
  test("deleted party disappears from list", async ({ page }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    const partyName = identity.name("Delete Me Party");

    await createParty(page, { name: partyName, memberCount: 0 });

    page.once("dialog", (dialog) => void dialog.accept());
    const deleteResponse = page.waitForResponse(
      (response) =>
        response.request().method() === "DELETE" &&
        response.url().includes("/api/parties/"),
    );
    await page
      .locator("div", { has: page.getByRole("heading", { name: partyName }) })
      .getByRole("button", { name: "Delete" })
      .click();
    const response = await deleteResponse;
    expect(response.ok()).toBeTruthy();

    await expect(page.getByText(partyName)).toHaveCount(0, { timeout: 15000 });
  });
});
