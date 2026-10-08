// CommonJS is required by this Jest configuration.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const nextJest = require('next/jest');

module.exports = nextJest({ dir: './' })({
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  testMatch: ['<rootDir>/tests/**/*.test.[jt]s?(x)'],
  moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
  clearMocks: true,
  collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/interfaces/**', '!src/integrations/types.ts', '!src/mocks/**'],
  coverageProvider: 'v8',
  coverageReporters: ['text', 'html', 'lcov', 'json-summary', 'json'],
  coverageThreshold: { global: { statements: 80, branches: 80, functions: 80, lines: 80 } },
});
