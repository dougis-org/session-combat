/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  testMatch: ['**/tests/integration/**/*.test.(ts|js)'],
  testTimeout: 120000,
  transform: {
    '^.+\\.(ts|tsx)$': ['@swc/jest', {
      jsc: {
        parser: {
          syntax: 'typescript',
          tsx: false,
        },
        transform: null,
        target: 'es2017',
      },
      module: {
        type: 'commonjs',
      },
    }],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  collectCoverageFrom: [
    'pages/api/**/*.{ts,tsx,js,jsx}',
    '!pages/api/**/*.d.ts',
  ],
};
