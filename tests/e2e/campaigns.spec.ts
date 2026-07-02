import { test, expect } from "./fixtures";
import { registerUser, STRONG_PASSWORD } from "./helpers/actions";
import { createTestIdentity } from "./helpers/isolation";

test.beforeEach(async ({ page }) => {
  await page.context().clearCookies();
});

test.describe("Campaign Chapters Drag and Drop", () => {
  test("allows reordering chapters via drag-and-drop and persists the order", async ({ page }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);

    // 1. Navigate to Campaigns and start creating a new campaign
    await page.goto("/campaigns");
    await page.getByRole("button", { name: "New Campaign" }).first().click();

    // 2. Fill in campaign details
    await page.getByLabel("Campaign Name *").fill("Curse of Strahd");
    await page.getByLabel("Module / Adventure").fill("Barovia");

    // 3. Open Chapters accordion
    const accordionBtn = page.getByRole("button", { name: /Chapters/i });
    if (await accordionBtn.getAttribute("aria-expanded") !== "true") {
      await accordionBtn.click();
    }

    // 4. Add 3 chapters
    await page.getByRole("button", { name: "+ Add Chapter" }).click();
    await page.getByRole("button", { name: "+ Add Chapter" }).click();
    await page.getByRole("button", { name: "+ Add Chapter" }).click();

    // 5. Fill in chapter titles
    const titleInputs = page.locator('[data-testid="chapter-title-input"]');
    await expect(titleInputs).toHaveCount(3);
    await titleInputs.nth(0).fill("Arrival");
    await titleInputs.nth(1).fill("The Inn");
    await titleInputs.nth(2).fill("The Dungeon");

    // 6. Active chapter identity preserved: Mark "The Inn" (index 1) as active
    const activateButtons = page.locator('[data-testid^="activate-chapter-"]');
    await expect(activateButtons).toHaveCount(3);
    await activateButtons.nth(1).click();

    // Verify it is active
    await expect(page.getByTestId("current-chapter-display")).toContainText("Ch. 2: The Inn");

    // 7. Perform drag and drop reordering
    // Drag "Arrival" (index 0) to "The Dungeon" (index 2)
    const handle0 = page.locator('[data-testid="drag-handle-0"]');
    const handle2 = page.locator('[data-testid="drag-handle-2"]');
    await expect(handle0).toBeVisible();
    await expect(handle2).toBeVisible();

    const box0 = await handle0.boundingBox();
    const box2 = await handle2.boundingBox();
    if (box0 && box2) {
      await page.mouse.move(box0.x + box0.width / 2, box0.y + box0.height / 2);
      await page.mouse.down();
      await page.waitForTimeout(200);
      await page.mouse.move(box2.x + box2.width / 2, box2.y + box2.height / 2, { steps: 10 });
      await page.waitForTimeout(200);
      await page.mouse.up();
    } else {
      throw new Error("Could not find bounding boxes for handles");
    }

    // Assert chapter title inputs are in the new order: ["The Inn", "The Dungeon", "Arrival"]
    await page.waitForTimeout(500);
    await expect(titleInputs.nth(0)).toHaveValue("The Inn");
    await expect(titleInputs.nth(1)).toHaveValue("The Dungeon");
    await expect(titleInputs.nth(2)).toHaveValue("Arrival");

    // Assert active chapter badge is preserved on "The Inn" (now index 0)
    await expect(page.getByTestId("current-chapter-display")).toContainText("Ch. 1: The Inn");

    // 8. Save the campaign
    await page.getByRole("button", { name: "Save Campaign" }).click();

    // Wait for the campaign list page to load and confirm the campaign is created
    await expect(page.locator('#campaigns-list').getByRole("heading", { name: "Curse of Strahd" })).toBeVisible({ timeout: 15000 });

    // 9. Persistence: Reopen the editor and assert the order and active chapter are persisted
    // Click "Edit" button for our campaign
    await page.locator('#campaigns-list').getByRole("button", { name: "Edit" }).first().click();

    // Open accordion
    const editAccordionBtn = page.getByRole("button", { name: /Chapters/i });
    if (await editAccordionBtn.getAttribute("aria-expanded") !== "true") {
      await editAccordionBtn.click();
    }

    // Verify inputs order
    await expect(titleInputs.nth(0)).toHaveValue("The Inn");
    await expect(titleInputs.nth(1)).toHaveValue("The Dungeon");
    await expect(titleInputs.nth(2)).toHaveValue("Arrival");

    // Verify active chapter is still "The Inn" (index 0 / Ch. 1)
    await expect(page.getByTestId("current-chapter-display")).toContainText("Ch. 1: The Inn");
  });

  test("allows keyboard sorting on drag handles", async ({ page }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);

    await page.goto("/campaigns");
    await page.getByRole("button", { name: "New Campaign" }).first().click();
    await page.getByLabel("Campaign Name *").fill("Keyboard Campaign");

    const keyboardAccordionBtn = page.getByRole("button", { name: /Chapters/i });
    if (await keyboardAccordionBtn.getAttribute("aria-expanded") !== "true") {
      await keyboardAccordionBtn.click();
    }
    await page.getByRole("button", { name: "+ Add Chapter" }).click();
    await page.getByRole("button", { name: "+ Add Chapter" }).click();
    await page.getByRole("button", { name: "+ Add Chapter" }).click();

    const titleInputs = page.locator('[data-testid="chapter-title-input"]');
    await expect(titleInputs).toHaveCount(3);
    await titleInputs.nth(0).fill("Arrival");
    await titleInputs.nth(1).fill("The Inn");
    await titleInputs.nth(2).fill("The Dungeon");

    const handle0 = page.locator('[data-testid="drag-handle-0"]');

    // Scenario: Keyboard reorder moves chapter down (Arrival index 0 moves to index 1)
    await handle0.focus();
    await page.waitForTimeout(200);
    await handle0.press("Space");
    await page.waitForTimeout(200);
    await handle0.press("ArrowDown");
    await page.waitForTimeout(200);
    await handle0.press("Space");
    await page.waitForTimeout(200);

    // Assert order is now ["The Inn", "Arrival", "The Dungeon"]
    await expect(titleInputs.nth(0)).toHaveValue("The Inn");
    await expect(titleInputs.nth(1)).toHaveValue("Arrival");
    await expect(titleInputs.nth(2)).toHaveValue("The Dungeon");

    // Scenario: Keyboard cancel with Escape
    const newHandle1 = page.locator('[data-testid="drag-handle-1"]'); // "Arrival" at index 1
    await newHandle1.focus();
    await page.waitForTimeout(200);
    await newHandle1.press("Space");
    await page.waitForTimeout(200);
    await newHandle1.press("ArrowUp");
    await page.waitForTimeout(200);
    await newHandle1.press("Escape");
    await page.waitForTimeout(200);

    // Order should remain ["The Inn", "Arrival", "The Dungeon"]
    await expect(titleInputs.nth(0)).toHaveValue("The Inn");
    await expect(titleInputs.nth(1)).toHaveValue("Arrival");
    await expect(titleInputs.nth(2)).toHaveValue("The Dungeon");
  });
});
