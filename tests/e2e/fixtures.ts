import fs from "node:fs/promises";
import path from "node:path";
import { test as base, expect } from "@playwright/test";

const isPlaywrightCoverageEnabled = process.env.PLAYWRIGHT_COVERAGE === "true";

export { expect };

export const test = base.extend({
  page: async ({ page, browserName }, use, testInfo) => {
    const shouldCollectCoverage =
      isPlaywrightCoverageEnabled && browserName === "chromium";

    if (shouldCollectCoverage) {
      console.log(
        `[Coverage] Starting V8 coverage collection for test: ${testInfo.title}`,
      );
      await page.coverage.startJSCoverage({
        resetOnNavigation: false,
      });
    }

    let testError: unknown;
    try {
      await use(page);
    } catch (err) {
      testError = err;
    }

    if (!shouldCollectCoverage) {
      // Re-throw test error if no coverage collection needed
      if (testError) throw testError;
      return;
    }

    try {
      const coverage = await page.coverage.stopJSCoverage();
      console.log(
        `[Coverage] Collected ${coverage.length} coverage entries for ${testInfo.title}`,
      );

      const outputPath = testInfo.outputPath("playwright-js-coverage.json");
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(
        outputPath,
        JSON.stringify(
          {
            testId: testInfo.testId,
            title: testInfo.title,
            coverage,
          },
          null,
          2,
        ),
        "utf8",
      );
      console.log(`[Coverage] Saved coverage to: ${outputPath}`);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.error(`[Coverage] Failed to collect coverage: ${errorMsg}`);
      throw err;
    }

    // Re-throw test error after coverage collection
    if (testError) throw testError;
  },
});
