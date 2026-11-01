/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jest-environment-jsdom',
  testMatch: ['<rootDir>/src/**/*.test.ts'],
  setupFiles: ['<rootDir>/jest.setup.ts'],
  transform: {
    '^.+\\.tsx?$': [
      '@swc/jest',
      { jsc: { parser: { syntax: 'typescript' }, target: 'es2022' } },
    ],
  },
};
