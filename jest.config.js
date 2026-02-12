/* eslint-env node */
/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  testMatch: [
    "**/tests/**/*.test.(ts|js)",
    "**/lib/**/*.test.(ts|js)",
    "!**/tests/e2e/**",
  ],
  testTimeout: 120000,
  maxWorkers: 1,
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  collectCoverageFrom: [
    "app/**/*.{ts,tsx,js,jsx}",
    "lib/**/*.{ts,tsx,js,jsx}",
    "!**/*.d.ts",
    "!**/node_modules/**",
    "!**/*.test.{ts,tsx,js,jsx}",
  ],
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
          jsx: "react-jsx",
        },
      },
    ],
  },
};
