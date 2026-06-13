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
    const trimmed = value.trim();
    if (/^\d+%$/.test(trimmed)) return trimmed; // percentage strings are valid Jest syntax
    const parsed = Number(trimmed); // strict: '4abc' → NaN, unlike parseInt
    if (!Number.isFinite(parsed) || !Number.isInteger(parsed) || parsed < 1) {
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
  transformIgnorePatterns: [
    "node_modules/(?!(archiver|compress-commons|zip-stream|tar-stream|crc-32|crc32-stream|lazystream|bblaze|is-stream|is-core-module)/)"
  ],
  transform: {
    "^.+\\.[tj]sx?$": [
      "ts-jest",
      {
        tsconfig: {
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          allowJs: true,
        },
      },
    ],
  },
};
