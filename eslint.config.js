import { defineConfig, globalIgnores } from "eslint/config";
import { includeIgnoreFile } from "@eslint/compat";
import { fileURLToPath } from "node:url";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import typescriptParser from "@typescript-eslint/parser";

const gitignorePath = fileURLToPath(new URL(".gitignore", import.meta.url));

export default defineConfig([
  // Include .gitignore patterns
  includeIgnoreFile(gitignorePath, "Imported .gitignore patterns"),
  
  // Additional global ignores specific to ESLint
  globalIgnores([
    "node_modules/**",
    "dist/**",
    "build/**",
    "_/**",
    "coverage/**",
    "*.bak",
    ".env*",
    "examples/**",
    "tests/**",
  ]),
  
  {
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: typescriptParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    plugins: {
      "@typescript-eslint": typescriptEslint,
    },
    rules: {
      // Naming conventions
      "@typescript-eslint/naming-convention": [
        "error",
        {
          "selector": "property",
          "modifiers": ["private"],
          "format": ["camelCase"],
          "leadingUnderscore": "forbid"
        },
        {
          "selector": "method",
          "modifiers": ["private"],
          "format": ["camelCase"],
          "leadingUnderscore": "forbid"
        }
      ],
      
      // Additional TypeScript best practices
      "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
      "@typescript-eslint/explicit-function-return-type": "warn",
      "@typescript-eslint/no-explicit-any": "warn",
      
      // Code style
      "quotes": ["error", "double"],
      "semi": ["error", "always"],
      "comma-dangle": ["error", "always-multiline"],
    },
  },
]);
