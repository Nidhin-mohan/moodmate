/** @type {import('jest').Config} */
const config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  setupFiles: ["<rootDir>/src/__tests__/env-setup.ts"],
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  testTimeout: 30000,
  silent: true,
  collectCoverageFrom: [
    "src/**/*.ts",
    "!src/__tests__/**",
    "!src/@types/**",
    "!src/seeds/**",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "text-summary", "lcov"],
  coverageThreshold: {
    global: {
      branches: 50,
      functions: 60,
      lines: 60,
      statements: 60,
    },
  },
};

module.exports = config;
