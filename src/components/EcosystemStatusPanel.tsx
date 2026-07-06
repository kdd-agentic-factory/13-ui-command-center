/**
 * EcosystemStatusPanel — Live ecosystem status panel for Platform Console.
 *
 * Shows real-time health of all gateway-connected services with visual
 * status indicators, latency, and transport info. Uses inline styles
 * consistent with the rest of the 13 UI (CSS variables, not Tailwind).
 */
import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import {
  useGatewayServiceStatus,
  type ServiceId,
  type GatewayServiceStatus,
} from '../hooks/useGatewayServiceStatus';

const MONO = 'JetBrains Mono, monospace';

const SERVICE_LABELS: Record<ServiceId, string> = {
  'race-command-center': 'Race Command Center',
  copilot: 'Race AI Copilot',
  'security-gateway': 'Security Gateway',
  'knowledge-layer': 'Knowledge Layer',
  'telemetry-dataset': 'Telemetry Dataset',
};

function statusColor(status: string): string {
  switch (status) {
    case 'available':
      return 'var(--green)';
    case 'degraded':
      return '#F59E0B';
    case 'offline':
      return 'var(--red)';
    case 'checking':
      return 'var(--cyan)';
    default:
      return 'var(--text-muted)';
  }
}

function statusBg(status: string): string {
  switch (status) {
    case 'available':
      return 'rgba(0,230,118,0.10)';
    case 'degraded':
      return 'rgba(245,158,11,0.10)';
    case 'offline':
      return 'rgba(239,68,68,0.10)';
    case 'checking':
      return 'rgba(0,220,255,0.06)';
    default:
      return 'transparent';
  }
}

function statusBorder(status: string): string {
  switch (status) {
    case 'available':
      return 'rgba(0,230,118,0.30)';
    case 'degraded':
      return 'rgba(245,158,11,0.30)';
    case 'offline':
      return 'rgba(239,68,68,0.25)';
    case 'checking':
      return 'rgba(0,220,255,0.25)';
    default:
      return 'var(--border)';
  }
}

function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 5) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  return `${minutes}m ago`;
}

function StatusDot({ status }: { status: string }) {
  const color = statusColor(status);
  const isChecking = status === 'checking';
  return (
    <span
      style={{
        display: 'inline-block',
        width: 7,
        height: 7,
        borderRadius: '50%',
        background: color,
        flexShrink: 0,
        animation: isChecking ? 'pulse 1.5s ease-in-out infinite' : undefined,
      }}
    />
  );
}

function ServiceRow({ service }: { service: GatewayServiceStatus }) {
  const label = SERVICE_LABELS[service.serviceId] ?? service.serviceId;
  const color = statusColor(service.status);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: '6px 10px',
        borderRadius: 'var(--radius)',
        background: statusBg(service.status),
        border: `1px solid ${statusBorder(service.status)}`,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0, flex: 1 }}>
        <StatusDot status={service.status} />
        <span style={{ fontSize: 12, fontWeight: 700, color, whiteSpace: 'nowrap' }}>
          {label}
        </span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        {service.latencyMs !== null && (
          <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)' }}>
            {service.latencyMs}ms
          </span>
        )}
        {service.details && (
          <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-dim)' }}>
            {service.details}
          </span>
        )}
        {service.checkedAt && (
          <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-dim)' }}>
            {formatTimeAgo(service.checkedAt)}
          </span>
        )}
      </div>
    </div>
  );
}

function OverallBadge({ status }: { status: 'healthy' | 'degraded' | 'offline' }) {
  const config = {
    healthy: { color: 'var(--green)', bg: 'rgba(0,230,118,0.15)', border: 'rgba(0,230,118,0.4)' },
    degraded: { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)', border: 'rgba(245,158,11,0.4)' },
    offline: { color: 'var(--red)', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.35)' },
  }[status];

  return (
    <span
      style={{
        fontSize: 9,
        fontFamily: MONO,
        fontWeight: 700,
        letterSpacing: '0.08em',
        textTransform: 'uppercase' as const,
        color: config.color,
        background: config.bg,
        border: `1px solid ${config.border}`,
        borderRadius: 5,
        padding: '2px 7px',
      }}
    >
      {status}
    </span>
  );
}

function TransportIndicator({ connectionStatus }: { connectionStatus: string }) {
  switch (connectionStatus) {
    case 'live':
      return <span style={{ fontSize: 9, color: 'var(--green)' }}>🟢 Live</span>;
    case 'polling':
      return <span style={{ fontSize: 9, color: 'var(--text-muted)' }}>🔄 Polling</span>;
    default:
      return <span style={{ fontSize: 9, color: 'var(--text-dim)' }}>⚫ Disconnected</span>;
  }
}

export function EcosystemStatusPanel() {
  const {
    services,
    overallStatus,
    lastPollAt,
    transport,
    connectionStatus,
    refresh,
  } = useGatewayServiceStatus({ pollIntervalMs: 30_000 });

  // Tick every 10s to keep "Xs ago" fresh
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 10_000);
    return () => clearInterval(id);
  }, []);

  const serviceList = Object.values(services);

  return (
    <div className="card" style={{ padding: 14 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: '0.1em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
            }}
          >
            Ecosystem Status — live gateway health
          </div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
            Real-time health of all KDD ecosystem services connected through the gateway.
          </div>
        </div>
        <OverallBadge status={overallStatus} />
      </div>

      {/* Controls row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <TransportIndicator connectionStatus={connectionStatus} />
        <button
          type="button"
          onClick={refresh}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            padding: '2px 8px',
            minHeight: 24,
            borderRadius: 'var(--radius)',
            border: '1px solid var(--border)',
            background: 'transparent',
            color: 'var(--text-muted)',
            fontFamily: MONO,
            fontSize: 9,
            fontWeight: 600,
            cursor: 'pointer',
          }}
          aria-label="Refresh ecosystem status"
        >
          <RefreshCw size={10} />
          Refresh
        </button>
      </div>

      {/* Service list */}
      <div style={{ display: 'grid', gap: 4 }}>
        {serviceList.map((service) => (
          <ServiceRow key={service.serviceId} service={service} />
        ))}
      </div>

      {/* Footer */}
      {lastPollAt && (
        <div style={{ marginTop: 8, fontSize: 9, fontFamily: MONO, color: 'var(--text-dim)' }}>
          Last checked: {formatTimeAgo(lastPollAt)} · Transport: {transport}
        </div>
      )}
    </div>
  );
}
