import { test, expect } from "./fixtures";
import { registerUser, STRONG_PASSWORD } from "./helpers/actions";
import { createTestIdentity } from "./helpers/isolation";

test.beforeEach(async ({ page }) => {
  await page.context().clearCookies();
});

/**
 * Collect any `useDiceAnimation` reconciliation-mismatch warnings the page logs.
 * With d4 forcing patched in (#627) this list must stay empty — without the patch,
 * a d4 pool mismatches and the roll drops to the instant reveal. Only a positive
 * signal when WebGL is available; on a WebGL-less browser the whole roll takes the
 * instant path silently, so an empty list asserts the warning is never *wrongly*
 * emitted, not that the tumble ran.
 */
function collectMismatchWarnings(page: import("@playwright/test").Page): string[] {
  const warnings: string[] = [];
  page.on("console", (msg) => {
    if (msg.type() === "warning" && /did not match the decided roll/i.test(msg.text())) {
      warnings.push(msg.text());
    }
  });
  return warnings;
}

test.describe("GlobalDiceFab — roll animation smoke", () => {
  test("rolling a pool shows the 3D overlay settling on a total modal, dismissible without closing the panel", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);

    // The dice fab is global — available on any authenticated page.
    await page.goto("/campaigns");

    await page.getByRole("button", { name: "Roll dice" }).click();
    const panel = page.getByRole("dialog", { name: "Roll dice" });
    await expect(panel).toBeVisible();

    // Stage 2d6 and roll.
    await panel.getByRole("button", { name: "Add d6" }).click();
    await panel.getByRole("button", { name: "Add d6" }).click();
    await panel.getByRole("button", { name: "Roll", exact: true }).click();

    // The overlay + total modal appear (the canvas may fall back to the instant
    // path if the CI browser lacks WebGL — the total modal is the invariant).
    const resultModal = page.getByRole("dialog", { name: /dice roll result/i });
    await expect(resultModal).toBeVisible({ timeout: 15000 });

    // The modal total agrees with the inline result line.
    const inline = panel.getByText(/2d6 → \[\d+, \d+\] = \d+/);
    await expect(inline).toBeVisible();
    const total = Number(
      (await inline.textContent())!.match(/=\s*(\d+)\s*$/)![1],
    );
    expect(total).toBeGreaterThanOrEqual(2);
    expect(total).toBeLessThanOrEqual(12);
    await expect(resultModal).toContainText(String(total));

    // The per-die readout in the modal must show the SAME faces as the inline
    // [a, b] line — not just the matching aggregate total. With the forced-face
    // engine the settled dice equal the decided roll; on any fallback path the
    // DOM readout still reflects the decided breakdown.
    const inlineFaces = (await inline.textContent())!
      .match(/\[([^\]]+)\]/)![1]
      .split(",")
      .map((s) => Number(s.trim()))
      .sort((a, b) => a - b);
    await expect(resultModal.getByTestId("die-face")).toHaveCount(
      inlineFaces.length,
    );
    const modalFaces = (
      await resultModal.getByTestId("die-face").allTextContents()
    )
      .map((s) => Number(s.trim()))
      .sort((a, b) => a - b);
    expect(modalFaces).toEqual(inlineFaces);

    // Escape dismisses only the overlay; the panel stays open with the pool intact.
    await page.keyboard.press("Escape");
    await expect(resultModal).toBeHidden();
    await expect(panel).toBeVisible();
    await expect(panel.getByRole("button", { name: "Roll", exact: true })).toBeVisible();
  });

  test("a d4 pool animates on its predetermined faces (#627 — d4 forcing restored)", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    await page.goto("/campaigns");

    const mismatchWarnings = collectMismatchWarnings(page);

    await page.getByRole("button", { name: "Roll dice" }).click();
    const panel = page.getByRole("dialog", { name: "Roll dice" });
    await expect(panel).toBeVisible();

    // Stage 3d4 — the die size that used to skip the tumble entirely.
    await panel.getByRole("button", { name: "Add d4" }).click();
    await panel.getByRole("button", { name: "Add d4" }).click();
    await panel.getByRole("button", { name: "Add d4" }).click();
    await panel.getByRole("button", { name: "Roll", exact: true }).click();

    const resultModal = page.getByRole("dialog", { name: /dice roll result/i });
    await expect(resultModal).toBeVisible({ timeout: 15000 });

    const inline = panel.getByText(/3d4 → \[\d+, \d+, \d+\] = \d+/);
    await expect(inline).toBeVisible();
    const inlineText = (await inline.textContent())!;
    const total = Number(inlineText.match(/=\s*(\d+)\s*$/)![1]);
    expect(total).toBeGreaterThanOrEqual(3);
    expect(total).toBeLessThanOrEqual(12);
    await expect(resultModal).toContainText(String(total));

    // The per-die readout equals the decided faces (true on both the tumble and the
    // instant-fallback path — the DOM always reflects the decided breakdown).
    const inlineFaces = inlineText
      .match(/\[([^\]]+)\]/)![1]
      .split(",")
      .map((s) => Number(s.trim()))
      .sort((a, b) => a - b);
    inlineFaces.forEach((f) => {
      expect(f).toBeGreaterThanOrEqual(1);
      expect(f).toBeLessThanOrEqual(4);
    });
    await expect(resultModal.getByTestId("die-face")).toHaveCount(3);
    const modalFaces = (
      await resultModal.getByTestId("die-face").allTextContents()
    )
      .map((s) => Number(s.trim()))
      .sort((a, b) => a - b);
    expect(modalFaces).toEqual(inlineFaces);

    // #627: d4 reconciliation must never report a mismatch.
    expect(mismatchWarnings).toEqual([]);
  });

  test("a mixed d4 + d6 pool settles both groups on their predetermined faces (#627)", async ({
    page,
  }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    await page.goto("/campaigns");

    const mismatchWarnings = collectMismatchWarnings(page);

    await page.getByRole("button", { name: "Roll dice" }).click();
    const panel = page.getByRole("dialog", { name: "Roll dice" });
    await expect(panel).toBeVisible();

    await panel.getByRole("button", { name: "Add d4" }).click();
    await panel.getByRole("button", { name: "Add d4" }).click();
    await panel.getByRole("button", { name: "Add d6" }).click();
    await panel.getByRole("button", { name: "Add d6" }).click();
    await panel.getByRole("button", { name: "Add d6" }).click();
    await panel.getByRole("button", { name: "Roll", exact: true }).click();

    const resultModal = page.getByRole("dialog", { name: /dice roll result/i });
    await expect(resultModal).toBeVisible({ timeout: 15000 });

    // Inline line: "<formula> → [<all five faces>] = <total>".
    const inline = panel.getByText(
      /2d4\+3d6 → \[\d+, \d+, \d+, \d+, \d+\] = \d+/,
    );
    await expect(inline).toBeVisible();
    const inlineText = (await inline.textContent())!;
    const total = Number(inlineText.match(/=\s*(\d+)\s*$/)![1]);
    expect(total).toBeGreaterThanOrEqual(5); // 2×1 + 3×1
    expect(total).toBeLessThanOrEqual(26); // 2×4 + 3×6
    await expect(resultModal).toContainText(String(total));

    const allInlineFaces = inlineText
      .match(/\[([^\]]+)\]/)![1]
      .split(",")
      .map((s) => Number(s.trim()))
      .sort((a, b) => a - b);
    await expect(resultModal.getByTestId("die-face")).toHaveCount(5);
    const modalFaces = (
      await resultModal.getByTestId("die-face").allTextContents()
    )
      .map((s) => Number(s.trim()))
      .sort((a, b) => a - b);
    expect(modalFaces).toEqual(allInlineFaces);

    // #627: neither the d4 nor the d6 group may reconcile as a mismatch.
    expect(mismatchWarnings).toEqual([]);
  });

  test("percentile roll shows a decoded 1..100 total modal", async ({ page }, testInfo) => {
    const identity = createTestIdentity(testInfo);
    await registerUser(page, identity.email, STRONG_PASSWORD);
    await page.goto("/campaigns");

    await page.getByRole("button", { name: "Roll dice" }).click();
    const panel = page.getByRole("dialog", { name: "Roll dice" });
    await panel.getByRole("button", { name: /percentile|d%/i }).click();

    const resultModal = page.getByRole("dialog", { name: /dice roll result/i });
    await expect(resultModal).toBeVisible({ timeout: 15000 });

    const inline = panel.getByText(/d% → \[\d+\] = \d+/);
    const value = Number((await inline.textContent())!.match(/=\s*(\d+)\s*$/)![1]);
    expect(value).toBeGreaterThanOrEqual(1);
    expect(value).toBeLessThanOrEqual(100);
    await expect(resultModal).toContainText(String(value));

    // The two d10 faces shown decode to the modal total.
    await expect(resultModal.getByTestId("die-face")).toHaveCount(2);
    const [tensText, onesText] = await resultModal
      .getByTestId("die-face")
      .allTextContents();
    const tens = tensText.trim() === "00" ? 0 : Number(tensText.trim()) / 10;
    const ones = onesText.trim() === "0" ? 0 : Number(onesText.trim());
    const decoded = tens * 10 + ones || 100;
    expect(decoded).toBe(value);
  });
});
