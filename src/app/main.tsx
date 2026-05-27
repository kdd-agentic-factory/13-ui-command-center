import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { initAnalytics } from '../lib/analytics';
import '../styles/global.css';

// Initialise PostHog before the React tree mounts so the first pageview is
// captured correctly and feature flags are available from the first render.
initAnalytics();

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
