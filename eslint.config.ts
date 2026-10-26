// SPDX-FileCopyrightText: 2026 Xquik Contributors
// SPDX-License-Identifier: MIT

import { defineConfig } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  { ignores: ["dist/**", "coverage/**"] },
  {
    files: ["**/*.{ts,mts,cts,js,mjs,cjs}"],
    languageOptions: { parser: tseslint.parser },
    linterOptions: { noInlineConfig: true, reportUnusedDisableDirectives: "error" },
    plugins: { "@typescript-eslint": tseslint.plugin },
    rules: {
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-check": false, "ts-expect-error": true, "ts-ignore": true, "ts-nocheck": true },
      ],
      "@typescript-eslint/consistent-type-assertions": ["error", { assertionStyle: "never" }],
      "no-warning-comments": ["error", { terms: ["type-coverage:ignore"], location: "anywhere" }],
    },
  },
);
