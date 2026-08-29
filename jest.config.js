/* global module */
/** @type {import('jest').Config} */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  testMatch: [
    "**/tests/**/*.test.(ts|tsx|js|jsx)",
    "**/lib/**/*.test.(ts|tsx|js|jsx)",
    "!**/tests/e2e/**",
  ],
  testPathIgnorePatterns: [
    "/node_modules/",
    "/.verity/",
    // Anchored to <rootDir> (the checkout jest.config.js actually lives in) so this
    // only excludes *nested* worktrees under the main checkout — e.g. .worktrees/foo —
    // and never matches when jest is invoked from inside one of those worktrees
    // themselves (a bare "/.worktrees/" substring match would exclude everything
    // there too, since a worktree's own absolute path always contains that segment).
    "<rootDir>/.worktrees/"
  ],
  testTimeout: 120000,
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
