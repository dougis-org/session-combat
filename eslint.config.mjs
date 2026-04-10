import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [
  ...nextCoreWebVitals,
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
