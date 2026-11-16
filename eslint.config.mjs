import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

export default tseslint.config(
  { ignores: ['dist/**', 'functions/**', 'android/**', 'ios/**', 'e2e/**', 'coverage/**'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      // An effect may only return a cleanup function. Expression bodies can leak return values
      // (for example scrollIntoView now returns a Promise), which crashes React on cleanup.
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name=/^(useEffect|useLayoutEffect)$/] > ArrowFunctionExpression[body.type!='BlockStatement'][body.callee.name!=/^(watchSession|subscribe.*|onSnapshot|onAuthStateChanged)$/]",
          message: 'Use a block body for effects; return only a cleanup function.',
        },
        {
          selector: "CallExpression[callee.object.name='React'][callee.property.name=/^(useEffect|useLayoutEffect)$/] > ArrowFunctionExpression[body.type!='BlockStatement']",
          message: 'Use a block body for effects; return only a cleanup function.',
        },
      ],
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_', destructuredArrayIgnorePattern: '^_' }],
    },
  },
);
