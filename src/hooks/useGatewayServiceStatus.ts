/**
 * useGatewayServiceStatus — Live service status for the KDD ecosystem gateway.
 *
 * Transport abstraction: uses polling now, designed to swap to WebSocket/SSE.
 *
 * Services monitored:
 * - 15 Race Command Center
 * - 16 Race AI Copilot
 * - 24 Security Gateway
 * - 03 Knowledge Layer
 * - 18 Telemetry Dataset
 *
 * Key invariants:
 * - Non-blocking: status is advisory, never gates rendering.
 * - Short timeout: 5s default, prevents UI stalls.
 * - Graceful fallback: failures degrade to "offline", never crashes.
 * - Transport abstraction: poll() interface swappable to WS/SSE later.
 */
import { useState, useEffect, useCallback, useRef } from 'react';

export type ServiceId =
  | 'race-command-center'
  | 'copilot'
  | 'security-gateway'
  | 'knowledge-layer'
  | 'telemetry-dataset';

export type ServiceStatus = 'available' | 'degraded' | 'offline' | 'checking' | 'unknown';

export interface ServiceStatusEvent {
  type: 'service.status';
  serviceId: ServiceId;
  status: ServiceStatus;
  checkedAt: string;
  latencyMs?: number;
  details?: string;
}

export interface GatewayServiceStatus {
  serviceId: ServiceId;
  status: ServiceStatus;
  checkedAt: string | null;
  latencyMs: number | null;
  details: string | null;
}

export interface UseGatewayServiceStatusOptions {
  /** Polling interval in ms. Default: 30000 (30s) */
  pollIntervalMs?: number;
  /** Request timeout in ms. Default: 5000 */
  timeoutMs?: number;
  /** Enable/disable polling. Default: true */
  enabled?: boolean;
}

export interface UseGatewayServiceStatusResult {
  /** Status of all monitored services */
  services: Record<ServiceId, GatewayServiceStatus>;
  /** Overall ecosystem health */
  overallStatus: 'healthy' | 'degraded' | 'offline';
  /** When the last poll completed */
  lastPollAt: string | null;
  /** Transport currently in use */
  transport: 'polling' | 'websocket' | 'sse';
  /** Manual refresh trigger */
  refresh: () => void;
  /** Connection status for the transport */
  connectionStatus: 'live' | 'polling' | 'disconnected';
}

// Service definitions with health check URLs
const ECOSYSTEM_SERVICES: Record<ServiceId, { name: string; healthUrl: string }> = {
  'race-command-center': {
    name: 'Race Command Center',
    healthUrl: import.meta.env.VITE_RACE_COMMAND_CENTER_URL
      ? `${import.meta.env.VITE_RACE_COMMAND_CENTER_URL}/status.json`
      : '/status.json',
  },
  copilot: {
    name: 'Race AI Copilot',
    healthUrl: import.meta.env.VITE_COPILOT_URL
      ? `${import.meta.env.VITE_COPILOT_URL}/health`
      : 'https://kdd-rjz-copilot.fly.dev/health',
  },
  'security-gateway': {
    name: 'Security Gateway',
    healthUrl: import.meta.env.VITE_SECURITY_GATEWAY_URL
      ? `${import.meta.env.VITE_SECURITY_GATEWAY_URL}/health`
      : 'https://kdd-rjz-security.fly.dev/health',
  },
  'knowledge-layer': {
    name: 'Knowledge Layer',
    healthUrl: import.meta.env.VITE_KNOWLEDGE_LAYER_URL
      ? `${import.meta.env.VITE_KNOWLEDGE_LAYER_URL}/health`
      : 'https://kdd-rjz-knowledge.fly.dev/health',
  },
  'telemetry-dataset': {
    name: 'Telemetry Dataset',
    healthUrl: import.meta.env.VITE_TELEMETRY_DATASET_URL
      ? `${import.meta.env.VITE_TELEMETRY_DATASET_URL}/api/v1/health`
      : 'https://kdd-rjz-telemetry.fly.dev/api/v1/health',
  },
};

const DEFAULT_POLL_INTERVAL = 30_000;
const DEFAULT_TIMEOUT = 5_000;

function createInitialStatuses(): Record<ServiceId, GatewayServiceStatus> {
  const services = {} as Record<ServiceId, GatewayServiceStatus>;
  for (const id of Object.keys(ECOSYSTEM_SERVICES) as ServiceId[]) {
    services[id] = {
      serviceId: id,
      status: 'unknown',
      checkedAt: null,
      latencyMs: null,
      details: null,
    };
  }
  return services;
}

/**
 * Probe a single service health endpoint.
 * Returns a ServiceStatusEvent regardless of outcome — never throws.
 */
async function checkServiceHealth(
  serviceId: ServiceId,
  url: string,
  timeoutMs: number,
): Promise<ServiceStatusEvent> {
  const start = performance.now();
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    const response = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });

    clearTimeout(timeoutId);
    const latencyMs = Math.round(performance.now() - start);

    if (response.ok) {
      return {
        type: 'service.status',
        serviceId,
        status: 'available',
        checkedAt: new Date().toISOString(),
        latencyMs,
      };
    } else if (response.status >= 500) {
      return {
        type: 'service.status',
        serviceId,
        status: 'degraded',
        checkedAt: new Date().toISOString(),
        latencyMs,
        details: `HTTP ${response.status}`,
      };
    } else {
      return {
        type: 'service.status',
        serviceId,
        status: 'offline',
        checkedAt: new Date().toISOString(),
        latencyMs,
        details: `HTTP ${response.status}`,
      };
    }
  } catch (error) {
    const latencyMs = Math.round(performance.now() - start);
    const details = error instanceof Error ? error.message : 'Unknown error';
    return {
      type: 'service.status',
      serviceId,
      status: 'offline',
      checkedAt: new Date().toISOString(),
      latencyMs,
      details,
    };
  }
}

export function useGatewayServiceStatus(
  options: UseGatewayServiceStatusOptions = {},
): UseGatewayServiceStatusResult {
  const {
    pollIntervalMs = DEFAULT_POLL_INTERVAL,
    timeoutMs = DEFAULT_TIMEOUT,
    enabled = true,
  } = options;

  const [services, setServices] = useState<Record<ServiceId, GatewayServiceStatus>>(
    createInitialStatuses,
  );
  const [lastPollAt, setLastPollAt] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const pollAllServices = useCallback(async () => {
    const serviceIds = Object.keys(ECOSYSTEM_SERVICES) as ServiceId[];

    // Set all to checking
    setServices((prev) => {
      const next = { ...prev };
      for (const id of serviceIds) {
        next[id] = { ...next[id], status: 'checking' };
      }
      return next;
    });

    // Check all services in parallel
    const events = await Promise.all(
      serviceIds.map((id) =>
        checkServiceHealth(id, ECOSYSTEM_SERVICES[id].healthUrl, timeoutMs),
      ),
    );

    // Update states
    setServices((prev) => {
      const next = { ...prev };
      for (const event of events) {
        next[event.serviceId] = {
          serviceId: event.serviceId,
          status: event.status,
          checkedAt: event.checkedAt,
          latencyMs: event.latencyMs ?? null,
          details: event.details ?? null,
        };
      }
      return next;
    });

    setLastPollAt(new Date().toISOString());
  }, [timeoutMs]);

  // Initial poll + interval
  useEffect(() => {
    if (!enabled) return;

    pollAllServices();
    intervalRef.current = setInterval(pollAllServices, pollIntervalMs);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [enabled, pollIntervalMs, pollAllServices]);

  // Compute overall status
  const overallStatus = computeOverallStatus(services);

  return {
    services,
    overallStatus,
    lastPollAt,
    transport: 'polling',
    refresh: pollAllServices,
    connectionStatus: enabled ? 'polling' : 'disconnected',
  };
}

function computeOverallStatus(
  services: Record<ServiceId, GatewayServiceStatus>,
): 'healthy' | 'degraded' | 'offline' {
  const statuses = Object.values(services).map((s) => s.status);

  if (statuses.every((s) => s === 'available')) return 'healthy';
  if (statuses.every((s) => s === 'offline' || s === 'unknown')) return 'offline';
  return 'degraded';
}
