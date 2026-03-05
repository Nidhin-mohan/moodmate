import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  testMatch: ["**/__tests__/**/*.test.ts"],
  // env-setup runs FIRST (before imports) to set test env vars.
  // setup.ts runs AFTER the framework to set up in-memory MongoDB.
  setupFiles: ["<rootDir>/src/__tests__/env-setup.ts"],
  setupFilesAfterEnv: ["<rootDir>/src/__tests__/setup.ts"],
  // Increase timeout for DB operations (in-memory server startup can be slow)
  testTimeout: 30000,
  // Don't show console.log noise during tests
  silent: true,
  // Coverage configuration
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

export default config;
