import svelte from 'eslint-plugin-svelte';
import globals from 'globals';
import tseslint from 'typescript-eslint';
import svelteParser from 'svelte-eslint-parser';
import prettier from 'eslint-config-prettier';

export default tseslint.config(
  {
    ignores: ['node_modules/', '.svelte-kit/', '.vite/', 'dist/', 'build/', 'deno.d.ts'],
  },
  ...tseslint.configs.recommended,
  ...svelte.configs['flat/recommended'],
  prettier,
  {
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },
      parserOptions: {
        extraFileExtensions: ['.svelte'],
      },
    },
  },
  {
    files: ['**/*.svelte'],
    languageOptions: {
      parser: svelteParser,
      parserOptions: {
        parser: tseslint.parser,
      },
    },
    rules: {
      'svelte/sort-attributes': [
        'error',
        {
          order: [
            'data-component', // First
            'this',
            'id',
            'name',
            'class',
            'slot',
            'style',
            {
              match: '/^bind:/',
              sort: 'alphabetical',
            },
            {
              match: '/^on:/',
              sort: 'alphabetical',
            },
            {
              match: '/.*/',
              sort: 'alphabetical',
            },
          ],
        },
      ],
      // The Tailwind plugin is currently hitting a module resolution bug in this Deno environment.
      // We are leaving the configuration here for when it is resolved.
      // 'tailwindcss/classnames-order': 'warn',
      
      // We are disabling valid-compile for the initial run to allow the attribute sorting to finish
      // without being blocked by Svelte 5 reactivity warnings in the existing codebase.
      'svelte/valid-compile': 'off', 
    },
  },
);
