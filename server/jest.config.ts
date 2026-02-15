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
};

export default config;