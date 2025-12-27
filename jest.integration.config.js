/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testMatch: ['**/tests/integration/**/*.test.(ts|js)', '**/tests/unit/**/*.test.(ts|tsx|js|jsx)'],
  testTimeout: 120000,
  maxWorkers: 1, // Run tests sequentially to avoid port conflicts
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  projects: [
    {
      displayName: 'unit',
      testMatch: ['<rootDir>/tests/unit/**/*.test.(ts|tsx|js|jsx)'],
      testEnvironment: 'jsdom',
      preset: 'ts-jest',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: {
            jsx: 'react',
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
          }
        }]
      },
    },
    {
      displayName: 'integration',
      testMatch: ['<rootDir>/tests/integration/**/*.test.(ts|js)'],
      testEnvironment: 'node',
      preset: 'ts-jest',
      moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
      moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
      },
      transform: {
        '^.+\\.tsx?$': ['ts-jest', {
          tsconfig: {
            jsx: 'react',
            esModuleInterop: true,
            allowSyntheticDefaultImports: true,
          }
        }]
      },
    },
  ],
  collectCoverageFrom: [
    'app/api/**/*.{ts,tsx,js,jsx}',
    'lib/**/*.{ts,tsx,js,jsx}',
    '!app/api/**/*.d.ts',
    '!lib/**/*.d.ts',
  ],
};
