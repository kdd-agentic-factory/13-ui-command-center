const js = require('@eslint/js');
const tsParser = require('@typescript-eslint/parser');
const reactHooks = require('eslint-plugin-react-hooks');

const globals = Object.fromEntries([
  'window', 'document', 'navigator', 'localStorage', 'sessionStorage', 'location',
  'console', 'fetch', 'URL', 'URLSearchParams', 'Headers', 'Request', 'Response',
  'AbortController', 'AbortSignal', 'FormData', 'Blob', 'File', 'FileReader',
  'TextEncoder', 'TextDecoder', 'Event', 'CustomEvent', 'MouseEvent', 'KeyboardEvent',
  'HTMLElement', 'HTMLInputElement', 'HTMLSelectElement', 'HTMLTextAreaElement',
  'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance',
  'requestAnimationFrame', 'cancelAnimationFrame', 'atob', 'btoa', 'crypto',
  'process', 'Buffer', 'global', 'globalThis', 'module', 'require', '__dirname', '__filename',
].map(name => [name, 'readonly']));

module.exports = [
  { ignores: ['dist/**', 'node_modules/**', 'coverage/**', 'playwright-report/**', 'test-results/**'] },
  { ...js.configs.recommended, files: ['**/*.{js,mjs,cjs}'], languageOptions: { globals } },
  {
    files: ['public/pit-wall-os/**/*.js'],
    languageOptions: { globals: Object.fromEntries(['Chart', 'anime', 'Parallax', 'THREE', 'PitWallState', 'ThreeScene', 'MetricsPanel', 'ParetoChart', 'ParallaxPanel'].map(name => [name, 'readonly'])) },
  },
  {
    files: ['**/*.{ts,tsx}'],
    languageOptions: { parser: tsParser, globals, parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { 'react-hooks': reactHooks },
    rules: reactHooks.configs.recommended.rules,
  },
];
