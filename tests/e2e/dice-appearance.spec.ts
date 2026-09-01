import { test, expect } from "./fixtures";
import { registerUser, STRONG_PASSWORD } from "./helpers/actions";
import { createTestIdentity } from "./helpers/isolation";

test.beforeEach(async ({ page }) => {
  await page.context().clearCookies();
});

const APPEARANCE_KEYS = {
  colorset: "sessionCombat:v1:dice-fab-colorset",
  material: "sessionCombat:v1:dice-fab-material",
};

test.describe("GlobalDiceFab — dice appearance", () => {
  test("6.1-a a chosen appearance survives a reload and still rolls", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);

    // Any dice-engine chunk request — must not fire from opening the appearance modal.
    const engineRequests: string[] = [];
    page.on("request", (r) => {
      if (/dice-box-threejs/.test(r.url())) engineRequests.push(r.url());
    });

    await page.goto("/campaigns");

    // Open the panel and the appearance modal.
    await page.getByRole("button", { name: "Roll dice" }).click();
    const panel = page.getByRole("dialog", { name: "Roll dice" });
    await expect(panel).toBeVisible();
    await panel.getByRole("button", { name: /dice appearance/i }).click();

    const modal = page.getByRole("dialog", { name: /dice appearance/i });
    await expect(modal).toBeVisible();
    expect(engineRequests).toEqual([]);

    // Pick a non-default colorset + material — persisted immediately, no save button.
    await modal.getByRole("radio", { name: /blood moon|bloodmoon/i }).click();
    await modal.getByRole("radio", { name: "Wood" }).click();
    await expect(
      modal.getByRole("radio", { name: /blood moon|bloodmoon/i }),
    ).toHaveAttribute("aria-checked", "true");
    await page.keyboard.press("Escape");
    await expect(modal).toBeHidden();
    await expect(panel).toBeVisible();

    expect(
      await page.evaluate((k) => localStorage.getItem(k), APPEARANCE_KEYS.colorset),
    ).toContain("bloodmoon");
    expect(
      await page.evaluate((k) => localStorage.getItem(k), APPEARANCE_KEYS.material),
    ).toContain("wood");

    // Reload — the selection is still reflected in the modal.
    await page.reload();
    await page.getByRole("button", { name: "Roll dice" }).click();
    await expect(panel).toBeVisible();
    await panel.getByRole("button", { name: /dice appearance/i }).click();
    await expect(
      modal.getByRole("radio", { name: /blood moon|bloodmoon/i }),
    ).toHaveAttribute("aria-checked", "true");
    await expect(modal.getByRole("radio", { name: "Wood" })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    await page.keyboard.press("Escape");

    // Roll — the result modal still renders with the chosen appearance in effect.
    await panel.getByRole("button", { name: "Add d6" }).click();
    await panel.getByRole("button", { name: "Add d6" }).click();
    await panel.getByRole("button", { name: "Roll", exact: true }).click();

    const resultModal = page.getByRole("dialog", { name: /dice roll result/i });
    await expect(resultModal).toBeVisible({ timeout: 15000 });

    const inline = panel.getByText(/2d6 → \[\d+, \d+\] = \d+/);
    const total = Number((await inline.textContent())!.match(/=\s*(\d+)\s*$/)![1]);
    await expect(resultModal).toContainText(String(total));
  });

  test("6.1-b with animation disabled the appearance is a no-op and the roll reveals instantly", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    await page.goto("/campaigns");

    await page.getByRole("button", { name: "Roll dice" }).click();
    const panel = page.getByRole("dialog", { name: "Roll dice" });
    await panel.getByRole("checkbox", { name: /disable animation/i }).check();

    await panel.getByRole("button", { name: /dice appearance/i }).click();
    const modal = page.getByRole("dialog", { name: /dice appearance/i });
    await modal.getByRole("radio", { name: "Metal" }).click();
    await page.keyboard.press("Escape");

    await panel.getByRole("button", { name: "Add d20" }).click();
    await panel.getByRole("button", { name: "Roll", exact: true }).click();

    const resultModal = page.getByRole("dialog", { name: /dice roll result/i });
    await expect(resultModal).toBeVisible({ timeout: 5000 });
    await expect(resultModal.getByTestId("die-face")).toHaveCount(1);
  });
});
