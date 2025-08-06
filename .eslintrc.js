module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true,
    //   electron: true
  },
  extends: ['eslint:recommended', 'react-app', 'react-app/jest'],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  plugins: ['react'],
  rules: {
    // React specific rules
    'react/jsx-uses-react': 'off',
    'react/react-in-jsx-scope': 'off',
    'react/prop-types': 'warn',
    'react/no-unused-state': 'warn',
    'react/no-array-index-key': 'off',
    'react-hooks/exhaustive-deps': 'off',
    // General JavaScript rules
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'off',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'off',
    'no-unused-vars': 'off',
    'no-undef': 'error',
    'no-unreachable': 'error',
    'no-duplicate-imports': 'error',

    // Code style
    indent: ['warn', 2, { SwitchCase: 1 }],
    quotes: ['warn', 'single', { avoidEscape: true }],
    semi: ['warn', 'always'],
    'comma-dangle': ['warn', 'only-multiline'],
    'object-curly-spacing': ['warn', 'always'],
    'array-bracket-spacing': ['warn', 'never'],

    // Best practices
    eqeqeq: ['error', 'always'],
    curly: ['warn', 'all'],
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error',
    'no-script-url': 'error',

    // Electron specific
    'no-restricted-globals': [
      'error',
      {
        name: 'require',
        message:
          'Use import statements instead of require() in renderer process',
      },
    ],
  },
  overrides: [
    {
      // Electron main process files
      files: ['public/electron.js', 'public/preload.js'],
      env: {
        node: true,
        browser: false,
      },
      rules: {
        'no-restricted-globals': 'off',
      },
    },
    {
      // Test files
      files: ['**/*.test.js', '**/*.spec.js'],
      env: {
        jest: true,
      },
    },
  ],
};
