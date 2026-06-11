import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { initAnalytics } from '../lib/analytics';
// Self-hosted fonts (CSP-safe: served same-origin — the previous Google Fonts
// @import was silently blocked by font-src/style-src on the static deploy).
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/600.css';
import '@fontsource/jetbrains-mono/700.css';
import '@fontsource/barlow-condensed/600.css';
import '@fontsource/barlow-condensed/700.css';
import '@fontsource/barlow-condensed/800.css';
import '@fontsource/rajdhani/600.css';
import '@fontsource/rajdhani/700.css';
import '../styles/global.css';

// Initialise PostHog before the React tree mounts so the first pageview is
// captured correctly and feature flags are available from the first render.
initAnalytics();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
