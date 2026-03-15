import fs from "node:fs/promises";
import path from "node:path";
import { test as base, expect } from "@playwright/test";

const isPlaywrightCoverageEnabled = process.env.PLAYWRIGHT_COVERAGE === "true";

export { expect };

export const test = base.extend({
  page: async ({ page, browserName }, runPageFixture, testInfo) => {
    const shouldCollectCoverage =
      isPlaywrightCoverageEnabled && browserName === "chromium";

    if (shouldCollectCoverage) {
      await page.coverage.startJSCoverage({
        resetOnNavigation: false,
      });
    }

    await runPageFixture(page);

    if (!shouldCollectCoverage) {
      return;
    }

    const coverage = await page.coverage.stopJSCoverage();
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
  },
});
