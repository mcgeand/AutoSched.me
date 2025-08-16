const { createDefaultPreset } = require("ts-jest");

const tsJestTransformCfg = createDefaultPreset().transform;

/** @type {import("jest").Config} **/
module.exports = {
  testEnvironment: "node",
  transform: {
    ...tsJestTransformCfg,
  },
  // Setup files for mocking
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  // Clear mocks between tests
  clearMocks: true,
  // Reset mocks between tests
  resetMocks: true
};