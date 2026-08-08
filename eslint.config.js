import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";

// Feature Isolation — no feature may import from another feature.
// Shared code must live in src/shared/. Only blocks the other 3 features, self is allowed.
const FEATURES = ["admin", "manager", "staff", "auth"];
const featureIsolation = FEATURES.map((feat) => ({
  files: [`src/features/${feat}/**/*.{ts,tsx}`],
  rules: {
    "no-restricted-imports": [
      "error",
      {
        patterns: FEATURES.filter((f) => f !== feat).map((other) => ({
          group: [`@/features/${other}/*`, `@/features/${other}`],
          message: `features/${feat} must not import from features/${other} — move shared code to src/shared/.`,
        })),
      },
    ],
  },
}));

export default defineConfig([
  globalIgnores(["dist", "src/components/ui/**"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      globals: globals.browser,
    },
  },
  ...featureIsolation,
]);
