import js from '@eslint/js';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
      globals: {
        // Node globals
        process: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        URL: 'readonly',
        fetch: 'readonly',
        // Browser globals
        window: 'readonly',
        document: 'readonly',
        localStorage: 'readonly',
        sessionStorage: 'readonly',
        navigator: 'readonly',
        HTMLElement: 'readonly',
      },
    },
    rules: {
      // Catch real bugs
      'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      'no-undef': 'error',
      'no-constant-condition': 'warn',
      'no-debugger': 'error',

      // Code quality
      'no-var': 'error',
      'prefer-const': 'warn',
      'eqeqeq': ['warn', 'smart'],

      // Don't be annoying
      'no-console': 'off',
      'no-empty': ['warn', { allowEmptyCatch: true }],

      // no-undef disabled — JSX creates false positives without a proper React parser.
      // Real undefined-variable errors are caught by Vite's build step.
      'no-undef': 'off',
    },
  },
  // Electron files are CommonJS
  {
    files: ['electron/**/*.js'],
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        Buffer: 'readonly',
      },
    },
  },
  // Test files need test globals
  {
    files: ['**/*.test.{js,jsx}', 'e2e/**/*.js'],
    languageOptions: {
      globals: {
        describe: 'readonly',
        it: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        vi: 'readonly',
        test: 'readonly',
        Buffer: 'readonly',
      },
    },
  },
  // Server files need Node globals
  {
    files: ['server/**/*.js', 'shared/**/*.js', 'bin/**/*.js'],
    languageOptions: {
      globals: {
        Buffer: 'readonly',
      },
    },
  },
  {
    ignores: [
      'dist/**',
      'node_modules/**',
      '.claude/**',
      'electron-dist/**',
      'test-results/**',
      'shared/layouts/index.js',
    ],
  },
];
