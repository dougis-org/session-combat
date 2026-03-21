/* global module */
/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/integration/**/*.test.(ts|js)"],
  // Exclude Docker-dependent tests that require Testcontainers
  testPathIgnorePatterns: [
    "/node_modules/",
    "api.integration.test.ts",
    "monsters.integration.test.ts",
  ],
  testTimeout: 120000,
  // forceExit is NOT set here — use `npm run test:ci` (which passes --forceExit) for
  // pre-commit hooks and CI. Direct `npm run test:integration` runs without force-exit so
  // leaked handles surface during development.
  maxWorkers: 1, // Run tests sequentially to avoid port conflicts
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: [
    "app/api/**/*.{ts,tsx,js,jsx}",
    "lib/**/*.{ts,tsx,js,jsx}",
    "!app/api/**/*.d.ts",
    "!lib/**/*.d.ts",
  ],
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
