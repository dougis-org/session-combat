/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**/*.test.(ts|js)'],
  testTimeout: 120000,
  maxWorkers: 1, // Run tests sequentially to avoid port conflicts
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'app/api/**/*.{ts,tsx,js,jsx}',
    '!app/api/**/*.d.ts',
  ],
  globals: {
    'ts-jest': {
      tsconfig: {
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
      }
    }
  }
};
