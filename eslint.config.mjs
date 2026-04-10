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
    ],
  },
];

export default config;
