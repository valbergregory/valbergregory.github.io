// @ts-check
import eslintPluginAstro from 'eslint-plugin-astro';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['dist/**', '.astro/**', 'node_modules/**', 'src/generated/**', 'docs/qa/**'],
  },
  ...tseslint.configs.recommended,
  ...eslintPluginAstro.configs.recommended,
  {
    files: ['**/*.{js,mjs,ts}'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    },
  },
  {
    files: ['**/*.astro'],
    rules: {
      // Scripts inline em .astro são analisados pelo parser do plugin.
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
);
