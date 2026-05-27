/* global module */
/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: ["**/tests/integration/**/*.test.ts"],
  testTimeout: 120000,
  globalSetup: "./tests/integration/global.setup.ts",
  globalTeardown: "./tests/integration/global.teardown.ts",
  // forceExit is NOT set here — use `npm run test:ci` (which passes --forceExit) for
  // pre-commit hooks and CI. Direct `npm run test:integration` runs without force-exit so
  // leaked handles surface during development.
  // Port conflicts resolved by #220; parallelism is now safe
  maxWorkers: (() => {
    const value = process.env.INTEGRATION_WORKERS;
    if (!value) return '50%'; // Jest default: half CPUs
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed < 1) {
      console.warn(`Invalid INTEGRATION_WORKERS="${value}"; falling back to default`);
      return '50%';
    }
    return parsed;
  })(),
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
