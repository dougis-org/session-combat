/* eslint-env node */
/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',

  // Only validation tests - no server dependencies
  testMatch: [
    '**/tests/integration/monsterUpload.test.ts',
    '**/tests/integration/monsterUploadRoute.test.ts',
    '**/tests/integration/duplicate-monster.test.ts',
    '**/tests/integration/monsters-copy.test.ts',
  ],

  // Full parallelization - no server needed
  maxWorkers: 4,
  testTimeout: 30000,

  // Module resolution
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],

  // Coverage
  collectCoverageFrom: [
    'lib/validation/**/*.{ts,tsx,js,jsx}',
    '!lib/validation/**/*.d.ts',
  ],

  // TypeScript configuration
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      }
    }
  }
};
