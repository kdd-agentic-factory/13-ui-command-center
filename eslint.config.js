import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';

export default [
  { ignores: ['dist'] },
  js.configs.recommended,
  {
    files: ['**/*.{js,ts,tsx}'],
    languageOptions: {
      parser: tsParser,
      ecmaVersion: 2020,
      globals: {
        AbortSignal: 'readonly',
        Chart: 'readonly',
        Element: 'readonly',
        HTMLButtonElement: 'readonly',
        HTMLCanvasElement: 'readonly',
        HTMLDivElement: 'readonly',
        HTMLElement: 'readonly',
        HTMLInputElement: 'readonly',
        HTMLTextAreaElement: 'readonly',
        KeyboardEvent: 'readonly',
        ParetoChart: 'readonly',
        Parallax: 'readonly',
        ParallaxPanel: 'readonly',
        PitWallState: 'readonly',
        document: 'readonly',
        fetch: 'readonly',
        localStorage: 'readonly',
        MetricsPanel: 'readonly',
        React: 'readonly',
        requestAnimationFrame: 'readonly',
        cancelAnimationFrame: 'readonly',
        sessionStorage: 'readonly',
        setInterval: 'readonly',
        clearInterval: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',
        SVGPathElement: 'readonly',
        SVGSVGElement: 'readonly',
        TextDecoder: 'readonly',
        TextEncoder: 'readonly',
        THREE: 'readonly',
        ThreeScene: 'readonly',
        window: 'readonly',
        anime: 'readonly',
        console: 'readonly'
      },
      parserOptions: {
        ecmaFeatures: { jsx: true },
        sourceType: 'module'
      }
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-unused-vars': ['error', { args: 'none', caughtErrors: 'none', varsIgnorePattern: '^_' }],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }]
    }
  }
];
