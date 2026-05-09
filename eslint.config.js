import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
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
  // These files legitimately export non-components (shadcn cva variants, router config)
  {
    files: [
      'src/shared/components/ui/**/*.{ts,tsx}',
      'src/router/index.tsx',
    ],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  // Feature isolation: admin cannot import from manager/staff
  {
    files: ['src/features/admin/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['*/features/manager/*'], message: 'admin cannot import from manager feature' },
          { group: ['*/features/staff/*'], message: 'admin cannot import from staff feature' },
        ],
      }],
    },
  },
  // Feature isolation: manager cannot import from admin/staff
  {
    files: ['src/features/manager/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['*/features/admin/*'], message: 'manager cannot import from admin feature' },
          { group: ['*/features/staff/*'], message: 'manager cannot import from staff feature' },
        ],
      }],
    },
  },
  // Feature isolation: staff cannot import from admin/manager
  {
    files: ['src/features/staff/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': ['error', {
        patterns: [
          { group: ['*/features/admin/*'], message: 'staff cannot import from admin feature' },
          { group: ['*/features/manager/*'], message: 'staff cannot import from manager feature' },
        ],
      }],
    },
  },
])
