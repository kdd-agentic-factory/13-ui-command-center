/**
 * analytics.ts — PostHog wrapper for KDD Moto Intelligence
 *
 * Single entry-point for all product analytics. Call `initAnalytics()` once
 * at app startup, then use the typed helper functions throughout the codebase.
 */
import posthog from 'posthog-js';

const POSTHOG_KEY = 'phc_zhVHLCQA7LyyiYYUxwpgPXdp99WczEbxXY3KriUQ6qji';
const POSTHOG_HOST = 'https://us.i.posthog.com';

// ── Init ──────────────────────────────────────────────────────────────────────

export function initAnalytics(): void {
  posthog.init(POSTHOG_KEY, {
    api_host: POSTHOG_HOST,
    // Capture page-leave events for session duration
    capture_pageleave: true,
    // Respect "Do Not Track" browser setting
    respect_dnt: true,
    // Disable session recording by default to avoid heavy external traffic.
    disable_session_recording: true,
    // Autocapture UI interactions
    autocapture: false,
    // Persist identity across reloads
    persistence: 'localStorage',
    loaded: (ph) => {
      // In development, log to console instead of sending
      if (import.meta.env.DEV) {
        ph.debug();
      }
    },
  });
}

// ── Typed event helpers ───────────────────────────────────────────────────────

/** Fired once when the dashboard finishes its first data load. */
export function trackDashboardLoaded(props: {
  servicesUp: number;
  servicesTotal: number;
  loadDurationMs?: number;
}): void {
  posthog.capture('dashboard_loaded', props);
}

/** Fired every time the user clicks "Sincronizar". */
export function trackRefreshClicked(props: {
  servicesUp: number;
  servicesTotal: number;
}): void {
  posthog.capture('refresh_clicked', props);
}

/**
 * Fired when service health changes between polls.
 * Only emitted when the count actually changes.
 */
export function trackHealthChanged(props: {
  previousUp: number;
  currentUp: number;
  servicesTotal: number;
  direction: 'improved' | 'degraded' | 'unchanged';
}): void {
  posthog.capture('service_health_changed', props);
}

/** Fired on every successful poll refresh with current health snapshot. */
export function trackHealthSnapshot(props: {
  servicesUp: number;
  servicesTotal: number;
  governance: boolean;
  orchestrator: boolean;
  skills: boolean;
  workflows: boolean;
  experiments: boolean;
  mcp: boolean;
}): void {
  posthog.capture('health_snapshot', props);
}

/** Fired when a panel card becomes visible in the viewport. */
export function trackPanelViewed(panelName: string): void {
  posthog.capture('panel_viewed', { panel: panelName });
}

// Re-export posthog in case raw access is needed
export { posthog };
