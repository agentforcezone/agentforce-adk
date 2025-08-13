export default {
  preset: "ts-jest/presets/default-esm",
  extensionsToTreatAsEsm: [".ts"],
  testEnvironment: "node",
  roots: ["<rootDir>/tests"],
  testMatch: ["**/__tests__/**/*.ts", "**/?(*.)+(spec|test).ts"],
  transform: {
    "^.+\\.ts$": ["ts-jest", {
      useESM: true,
      tsconfig: {
        module: "esnext",
        target: "esnext",
        moduleResolution: "node",
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        skipLibCheck: true,
      },
      isolatedModules: false,
    }],
  },
  transformIgnorePatterns: [
    "node_modules/(?!(puppeteer-extra|puppeteer-extra-plugin-stealth)/)"
  ],
  collectCoverageFrom: [
    "lib/**/*.ts",
    "!lib/**/*.d.ts",
  ],
  coverageDirectory: "coverage",
  coverageReporters: ["text", "lcov", "html"],
  setupFilesAfterEnv: ["<rootDir>/tests/setup.ts"],
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  moduleNameMapper: {
    "^puppeteer-extra$": "<rootDir>/tests/__mocks__/puppeteer-extra.ts",
    "^puppeteer-extra-plugin-stealth$": "<rootDir>/tests/__mocks__/puppeteer-extra-plugin-stealth.ts"
  },
};