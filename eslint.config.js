import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['*/features/manager/*'], message: 'admin cannot import from manager feature' },
            { group: ['*/features/staff/*'], message: 'admin cannot import from staff feature' },
            { group: ['*/features/admin/*'], message: 'manager cannot import from admin feature' },
            { group: ['*/features/staff/*'], message: 'manager cannot import from staff feature' },
            { group: ['*/features/admin/*'], message: 'staff cannot import from admin feature' },
            { group: ['*/features/manager/*'], message: 'staff cannot import from manager feature' },
          ],
        },
      ],
    },
  },
  // router/index.tsx is the only file allowed to import across all features
  {
    files: ['src/router/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': 'off' },
  },
  // shadcn/ui generated files export non-component values alongside components
  {
    files: ['src/shared/components/ui/**/*.{ts,tsx}'],
    rules: { 'react-refresh/only-export-components': 'off' },
  },
)
