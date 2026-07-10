/**
 * useServiceStatus — lightweight health probe for external KDD services.
 *
 * Fetches a short-lived GET against the service's health endpoint to determine
 * whether it is reachable. Designed for preview services (e.g. 15) that may
 * or may not be running at any given time.
 *
 * Key invariants:
 * - Non-blocking: status is advisory, never gates rendering.
 * - Short timeout: 2500 ms default, prevents UI stalls.
 * - No auth: no tokens or headers are sent.
 * - Graceful fallback: failures degrade to "offline", links still work.
 * - Dual-path resolution: tries baseUrl + healthPath first; if 404, tries
 *   healthPath alone (handles hosting where public/ files serve at root).
 */
import { useState, useEffect, useCallback, useRef } from 'react';

export type ServiceStatusState =
  | 'checking'
  | 'available'
  | 'degraded'
  | 'offline'
  | 'not-configured';

/** Where the status value originated from. */
export type StatusSource = 'status.json' | 'route-probe' | 'fallback' | 'disabled';

export interface ServiceStatusResult {
  /** Current runtime status of the service. */
  status: ServiceStatusState;
  /** Where the status information came from. */
  source: StatusSource;
  /** Timestamp of the last successful probe, or null if never checked. */
  lastChecked: Date | null;
  /** Human-readable error message if the last probe failed. */
  error?: string;
  /** Manually trigger a re-check. */
  refresh: () => void;
}

const DEFAULT_TIMEOUT_MS = 2500;

function getHealthCheckErrorMessage(error: unknown): string {
  if (error instanceof DOMException && error.name === 'AbortError') {
    return 'Health check timed out';
  }

  if (error instanceof TypeError) {
    return 'Connection failed — may be CORS or service unavailable';
  }

  if (error instanceof Error) {
    return error.message;
  }

  return 'Network error';
}

/**
 * Resolve the URL(s) to probe for service health.
 *
 * Priority:
 * 1. explicitStatusUrl — if set, use it directly (no fallback needed)
 * 2. baseUrl + healthPath — primary probe
 * 3. healthPath alone — fallback for hosting that serves public/ at root
 */
function resolveProbeUrls(
  baseUrl: string | undefined,
  healthPath: string | undefined,
  explicitStatusUrl: string | undefined,
): string[] {
  if (explicitStatusUrl) return [explicitStatusUrl];
  if (!baseUrl || !healthPath) return [];
  const primary = `${baseUrl}${healthPath}`;
  // Fallback: if healthPath already starts with baseUrl prefix, don't duplicate
  if (healthPath.startsWith(baseUrl)) return [healthPath];
  return [primary, healthPath];
}

export function useServiceStatus(
  baseUrl?: string,
  healthPath?: string,
  options?: { timeoutMs?: number; autoCheck?: boolean; explicitStatusUrl?: string },
): ServiceStatusResult {
  const timeoutMs = options?.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const autoCheck = options?.autoCheck ?? true;
  const explicitStatusUrl = options?.explicitStatusUrl;

  const [status, setStatus] = useState<ServiceStatusState>(
    baseUrl && healthPath ? 'checking' : 'not-configured'
  );
  const [source, setSource] = useState<StatusSource>('fallback');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);
  const [error, setError] = useState<string | undefined>(undefined);

  // Track the AbortController for cleanup
  const abortRef = useRef<AbortController | null>(null);

  const refresh = useCallback(() => {
    const probeUrls = resolveProbeUrls(baseUrl, healthPath, explicitStatusUrl);
    if (probeUrls.length === 0) {
      setStatus('not-configured');
      setSource('disabled');
      return;
    }

    // Cancel any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setStatus('checking');
    setError(undefined);

    const timer = setTimeout(() => controller.abort(), timeoutMs);

    /**
     * Try each probe URL in order. If primary returns 404, try fallback.
     * Returns the first successful response, or the last error.
     */
    const tryProbes = async (urls: string[]): Promise<{ ok: boolean; status: number } | { failed: true; message: string }> => {
      let lastError = '';
      for (const url of urls) {
        try {
          const res = await fetch(url, {
            method: 'GET',
            signal: controller.signal,
          });
          if (res.ok || (res.status >= 400 && res.status < 500)) {
            // 2xx = available, 4xx = degraded (service running, endpoint missing)
            return { ok: res.ok, status: res.status };
          }
          // 5xx — try next URL if available
          lastError = `HTTP ${res.status} from ${url}`;
        } catch (err) {
          if (controller.signal.aborted) return { failed: true, message: 'Aborted' };
          // TypeError = network/CORS failure — try next URL
          lastError = getHealthCheckErrorMessage(err);
        }
      }
      return { failed: true, message: lastError };
    };

    tryProbes(probeUrls).then((result) => {
      clearTimeout(timer);
      if (controller.signal.aborted) return;

      if ('failed' in result) {
        setStatus('offline');
        setError(result.message);
        setSource('fallback');
        setLastChecked(new Date());
        return;
      }

      if (result.ok) {
        if (result.status === 404) {
          setStatus('degraded');
          setError('Service running but no status endpoint');
          setSource('route-probe');
        } else {
          setStatus('available');
          setSource('status.json');
        }
      } else {
        setStatus(result.status >= 500 ? 'offline' : 'degraded');
        setError(`HTTP ${result.status}`);
        setSource('route-probe');
      }
      setLastChecked(new Date());
      setError(undefined);
    });
  }, [baseUrl, healthPath, explicitStatusUrl, timeoutMs]);

  // Auto-check on mount (if enabled and configured)
  useEffect(() => {
    if (autoCheck && baseUrl && healthPath) {
      refresh();
    }
    return () => abortRef.current?.abort();
  }, [autoCheck, baseUrl, healthPath, refresh]);

  return { status, source, lastChecked, error, refresh };
}

/**
 * Format the time since last check as a human-readable string.
 * Returns "Never checked" if no check has been performed.
 */
export function formatTimeSinceLastCheck(lastChecked: Date | null): string {
  if (!lastChecked) return 'Never checked';
  const seconds = Math.floor((Date.now() - lastChecked.getTime()) / 1000);
  if (seconds < 5) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ${seconds % 60}s ago`;
}
