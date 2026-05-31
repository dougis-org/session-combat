import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const baseConfig = Array.isArray(nextCoreWebVitals)
  ? nextCoreWebVitals
  : [nextCoreWebVitals];

const config = [
  ...baseConfig,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "coverage/**",
      "coverage-e2e/**",
      "playwright-report/**",
      ".codacy/**",
      "docs/**",
    ],
  },
  {
    files: ["tests/**/*.{ts,tsx,js,jsx}"],
    rules: {
      "no-restricted-imports": ["error", {
        paths: [{
          name: "@jest/globals",
          message: "Do not import from @jest/globals. Jest injects globals at runtime. See docs/TESTING.md."
        }]
      }]
    }
  },
];

export default config;
