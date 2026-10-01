import { test, expect, type Page } from "@playwright/test";
import { registerTestUser } from "./helpers/actions";

const LONG_NAME = "Sir Bartholomew Fitzwilliam-Throckmorton the Third of Upper Nether Wallop".padEnd(80, "x");

async function startCombatWithEnemies(page: Page, names: string[]) {
  await page.goto("/combat");
  for (const name of names) {
    await page.getByRole("button", { name: "+ Add Enemy" }).first().click();
    await page.getByRole("tab", { name: "Create New" }).click();
    await page.locator("#custom-name").fill(name);
    await page.locator("#custom-maxhp").fill("20");
    await page.locator("#custom-hp").fill("20");
    await page.locator('button[type="submit"]').click();
  }
  await page.locator('[data-testid="start-combat-quick"]').waitFor({ state: "visible", timeout: 10000 });
  await page.locator('[data-testid="start-combat-quick"]').click();
  await page.locator('[data-testid="initiative-modal"]').waitFor({ state: "visible", timeout: 15000 });
}

test.describe("Initiative modal — centered, dimmed, accessible (#807)", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
  });

  for (const viewport of [
    { width: 1397, height: 800 },
    { width: 375, height: 800 },
  ]) {
    test(`long name has no horizontal scrollbar at ${viewport.width}px`, async ({ page }, testInfo) => {
      await page.setViewportSize(viewport);
      await registerTestUser(page, testInfo);
      await startCombatWithEnemies(page, [LONG_NAME]);

      const dialog = page.locator('[data-testid="initiative-modal"]');
      const overflow = await dialog.evaluate((el) => ({
        dialog: el.scrollWidth - el.clientWidth,
        // Only elements that can actually show a scrollbar (overflow-x != visible); the
        // close button intentionally hangs past the entry root, which is harmless.
        scrollers: Array.from(el.querySelectorAll<HTMLElement>("*"))
          .filter((d) => getComputedStyle(d).overflowX !== "visible" && d.scrollWidth > d.clientWidth)
          .map((d) => d.className),
      }));
      expect(overflow.dialog).toBeLessThanOrEqual(0);
      expect(overflow.scrollers).toEqual([]);

      const box = (await dialog.boundingBox())!;
      expect(box.x).toBeGreaterThanOrEqual(15);
      expect(box.x + box.width).toBeLessThanOrEqual(viewport.width - 15);
      // Centered on both axes (tall dialogs on narrow screens may scroll instead)
      expect(Math.abs(box.x + box.width / 2 - viewport.width / 2)).toBeLessThanOrEqual(2);
      if (box.height < viewport.height - 32) {
        expect(Math.abs(box.y + box.height / 2 - viewport.height / 2)).toBeLessThanOrEqual(2);
      }
    });
  }

  test("backdrop covers the viewport faintly and focus stays in the dialog", async ({ page }, testInfo) => {
    await page.setViewportSize({ width: 1397, height: 800 });
    await registerTestUser(page, testInfo);
    await startCombatWithEnemies(page, ["Goblin"]);

    const backdrop = page.locator('[data-testid="initiative-modal-backdrop"]');
    const box = (await backdrop.boundingBox())!;
    expect(box).toMatchObject({ x: 0, y: 0, width: 1397, height: 800 });
    const alpha = await backdrop.evaluate((el) => {
      const m = getComputedStyle(el).backgroundColor.match(/[\d.]+/g)!.map(Number);
      return m.length > 3 ? m[3] : 1;
    });
    expect(alpha).toBeLessThan(0.5);

    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      const inside = await page.evaluate(
        () => !!document.activeElement?.closest('[data-testid="initiative-modal"]'),
      );
      expect(inside).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(page.locator('[data-testid="initiative-modal"]')).toBeHidden();
  });

  test("keyboard-only Roll d20 advances through every combatant and ends with no backdrop", async ({ page }, testInfo) => {
    await registerTestUser(page, testInfo);
    await startCombatWithEnemies(page, ["Goblin", "Orc"]);

    for (let i = 0; i < 2; i++) {
      const roll = page.getByRole("button", { name: "Roll d20", exact: true });
      await roll.focus();
      await page.keyboard.press("Enter");
    }
    await expect(page.locator('[data-testid="initiative-modal-backdrop"]')).toHaveCount(0);
  });
});
