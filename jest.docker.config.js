/* eslint-env node */
/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  // Only run Docker-dependent integration tests
  testMatch: [
    "**/tests/integration/api.integration.test.ts",
    "**/tests/integration/monsters.integration.test.ts",
  ],
  testTimeout: 120000,
  maxWorkers: 1, // Run tests sequentially to avoid port conflicts
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: ["app/api/**/*.{ts,tsx,js,jsx}", "!app/api/**/*.d.ts"],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
};
