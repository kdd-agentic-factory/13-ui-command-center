/**
 * ModuleGateway — Preview card for external KDD services.
 *
 * Displays the service status with visual indicators:
 * - Live: green accent, direct navigation
 * - Preview: purple accent, "Open Preview" with query params
 * - Unavailable: orange/dim, disabled
 * - Not connected: grey, "Configure connection" prompt
 *
 * When routes are present, renders grouped route links organized by layer.
 * Each route opens in a new tab with query params for context propagation.
 * Stays in 13. Points to 15 (or other external services).
 * Does NOT replace existing routes — adds a preview access point.
 *
 * Runtime status polling via useServiceStatus provides an additional
 * availability layer — the service may be declared "preview" in the registry
 * but actually offline or degraded at runtime.
 */
import { useMemo, useState, useEffect } from 'react';
import { ExternalLink, GitBranch, AlertCircle, WifiOff, Wifi, RefreshCw, Lock } from 'lucide-react';
import type { ServiceDef, ServiceRoute, ServiceStatus } from '../config/serviceRegistry';
import { useServiceStatus, formatTimeSinceLastCheck, type ServiceStatusState, type StatusSource } from '../hooks/useServiceStatus';
import { buildRaceCommandHandoffUrl } from '../lib/raceCommandHandoff';

interface ModuleGatewayProps {
  service: ServiceDef;
  /** Feature-flag disabled: show card as coming soon, no links. */
  disabled?: boolean;
}

function statusConfig(status: ServiceStatus) {
  switch (status) {
    case 'live':
      return { icon: Wifi, color: 'var(--green)', label: 'Live', accent: 'var(--green)' };
    case 'preview':
      return { icon: GitBranch, color: 'var(--purple)', label: 'Preview', accent: '#A855F7' };
    case 'unavailable':
      return { icon: AlertCircle, color: 'var(--orange)', label: 'Unavailable', accent: 'var(--orange)' };
    case 'not-connected':
      return { icon: WifiOff, color: 'var(--text-muted)', label: 'Not connected yet', accent: 'var(--text-muted)' };
  }
}

/** Map runtime status to a badge config (color + label). */
function runtimeBadge(status: ServiceStatusState) {
  switch (status) {
    case 'available':
      return { color: 'var(--green)', bg: 'rgba(0,230,118,0.12)', border: 'rgba(0,230,118,0.35)', label: 'Available' };
    case 'degraded':
      return { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.35)', label: 'Degraded' };
    case 'offline':
      return { color: 'var(--red)', bg: 'rgba(239,68,68,0.10)', border: 'rgba(239,68,68,0.30)', label: 'Offline' };
    case 'checking':
      return { color: 'var(--text-muted)', bg: 'transparent', border: 'var(--border)', label: 'Checking…' };
    case 'not-configured':
      return { color: 'var(--text-dim)', bg: 'transparent', border: 'var(--border)', label: 'No config' };
  }
}

/** Map status source to a human-readable label. */
function sourceLabel(source: StatusSource): string {
  switch (source) {
    case 'status.json':
      return 'Source: status.json';
    case 'route-probe':
      return 'Source: route-probe';
    case 'fallback':
      return 'Source: fallback';
    case 'disabled':
      return 'Source: disabled';
  }
}

function groupByLayer(routes: ServiceRoute[]): Map<string, ServiceRoute[]> {
  const grouped = new Map<string, ServiceRoute[]>();
  for (const route of routes) {
    const existing = grouped.get(route.layer) ?? [];
    existing.push(route);
    grouped.set(route.layer, existing);
  }
  return grouped;
}

const LAYER_ORDER = ['Mission Control', 'PitWall OS', 'Decision Layer', 'Prediction & Output'];

export function ModuleGateway({ service, disabled = false }: ModuleGatewayProps) {
  const cfg = statusConfig(service.status);
  const Icon = cfg.icon;
  const isDisabled = disabled || service.status === 'unavailable' || service.status === 'not-connected';

  // Runtime health probe — skip if disabled via feature flag
  const { status: runtimeStatus, source, lastChecked, error: runtimeError, refresh } = useServiceStatus(
    service.baseUrl,
    service.healthPath,
    {
      autoCheck: !isDisabled,
      explicitStatusUrl: service.statusUrl,
    }
  );
  const runtimeBadgeCfg = runtimeBadge(runtimeStatus);
  const [timeSince, setTimeSince] = useState(formatTimeSinceLastCheck(lastChecked));

  // Tick every 10s to keep "Xs ago" fresh
  useEffect(() => {
    const id = setInterval(() => setTimeSince(formatTimeSinceLastCheck(lastChecked)), 10_000);
    return () => clearInterval(id);
  }, [lastChecked]);

  // Auto-polling: re-check every 60s while the tab is visible
  useEffect(() => {
    if (isDisabled) return;

    const poll = () => {
      if (document.visibilityState === 'visible') {
        refresh();
      }
    };
    const id = setInterval(poll, 60_000);
    return () => clearInterval(id);
  }, [isDisabled, refresh]);

  const groupedRoutes = useMemo(() => {
    if (!service.routes) return null;
    const grouped = groupByLayer(service.routes);
    return LAYER_ORDER.filter(layer => grouped.has(layer)).map(layer => ({
      layer,
      routes: grouped.get(layer)!,
    }));
  }, [service.routes]);

  return (
    <div
      className="card kdd-card"
      style={{
        borderLeft: `3px solid ${disabled ? 'var(--text-dim)' : cfg.accent}`,
        opacity: disabled ? 0.7 : 1,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, padding: 16, paddingBottom: groupedRoutes && !disabled ? 12 : 16 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            {disabled ? <Lock size={14} style={{ color: 'var(--text-dim)' }} /> : <Icon size={14} style={{ color: cfg.color }} />}
            <span style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>
              {service.label}
            </span>
            {disabled && (
              <span
                className="badge"
                style={{
                  fontSize: 9, letterSpacing: '0.1em',
                  background: 'rgba(255,255,255,0.05)',
                  color: 'var(--text-dim)',
                  border: '1px solid var(--border)',
                }}
              >
                COMING SOON
              </span>
            )}
            {!disabled && service.badge && (
              <span
                className="badge"
                style={{
                  fontSize: 9, letterSpacing: '0.1em',
                  background: 'color-mix(in srgb, var(--purple) 20%, transparent)',
                  color: 'var(--purple)',
                  border: '1px solid color-mix(in srgb, var(--purple) 30%, transparent)',
                }}
              >
                {service.badge}
              </span>
            )}
            <span
              style={{
                fontSize: 10, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
                color: disabled ? 'var(--text-dim)' : cfg.color,
                marginLeft: 'auto',
              }}
            >
              {disabled ? 'Preview Disabled' : cfg.label}
            </span>
          </div>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            {service.description}
          </p>
        </div>
      </div>

      {/* Disabled message */}
      {disabled && (
        <div style={{ padding: '8px 16px 14px', fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.5 }}>
          This preview is currently disabled. Enable it by setting <code style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', background: 'rgba(255,255,255,0.05)', padding: '1px 4px', borderRadius: 3 }}>VITE_ENABLE_RACE_COMMAND_CENTER_PREVIEW</code> to <code style={{ fontSize: 10, fontFamily: 'JetBrains Mono, monospace', background: 'rgba(255,255,255,0.05)', padding: '1px 4px', borderRadius: 3 }}>true</code> or remove it.
        </div>
      )}

      {/* Runtime status bar — hidden when disabled via feature flag */}
      {!isDisabled && (
        <div style={{ padding: '0 16px 10px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
          {/* Runtime status badge */}
          <span
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 4,
              fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
              letterSpacing: '0.08em', textTransform: 'uppercase',
              color: runtimeBadgeCfg.color,
              background: runtimeBadgeCfg.bg,
              border: `1px solid ${runtimeBadgeCfg.border}`,
              borderRadius: 5, padding: '2px 7px',
            }}
          >
            {runtimeStatus === 'checking' && (
              <RefreshCw size={9} style={{ animation: 'spin 1s linear infinite' }} />
            )}
            {runtimeBadgeCfg.label}
          </span>

          {/* Status source */}
          <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-dim)' }}>
            {sourceLabel(source)}
          </span>

          {/* Last checked */}
          <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-dim)' }}>
            {timeSince}
          </span>

          {/* Route count */}
          {service.routes && (
            <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-dim)' }}>
              {service.routes.length} routes
            </span>
          )}

          {/* Base URL */}
          <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono, monospace', color: 'var(--text-dim)' }}>
            {service.baseUrl || 'Not configured'}
          </span>

          {/* Refresh button */}
          <button
            type="button"
            className="btn"
            onClick={refresh}
            title="Refresh status"
            style={{
              marginLeft: 'auto',
              display: 'inline-flex', alignItems: 'center', gap: 4,
              padding: '2px 8px', minHeight: 24, borderRadius: 'var(--radius)',
              border: '1px solid var(--border)',
              background: 'transparent',
              color: 'var(--text-muted)',
              fontFamily: 'JetBrains Mono, monospace', fontSize: 9, fontWeight: 600,
              cursor: 'pointer',
            }}
            aria-label="Refresh service status"
          >
            <RefreshCw size={10} />
            Refresh
          </button>
        </div>
      )}

      {/* Runtime error */}
      {runtimeError && (
        <div style={{ padding: '0 16px 6px', fontSize: 9, color: 'var(--text-dim)' }}>
          {runtimeError}
        </div>
      )}

      {/* Capabilities (for race-command-center) */}
      {service.capabilities && Object.keys(service.capabilities).length > 0 && (
        <div style={{ padding: '0 16px 10px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {Object.entries(service.capabilities).map(([cap, capStatus]) => (
            <span
              key={cap}
              style={{
                fontSize: 8.5, fontFamily: 'JetBrains Mono, monospace',
                fontWeight: 600, letterSpacing: '0.05em',
                color: capStatus === 'available' ? 'var(--green)' : capStatus === 'demo' ? '#F59E0B' : 'var(--text-dim)',
                border: `1px solid ${capStatus === 'available' ? 'rgba(0,230,118,0.3)' : capStatus === 'demo' ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`,
                borderRadius: 4, padding: '1px 6px',
              }}
            >
              {cap}: {capStatus}
            </span>
          ))}
        </div>
      )}

      {/* Route groups — hidden when disabled via feature flag */}
      {groupedRoutes && !disabled && (
        <div style={{ padding: '0 16px 12px' }}>
          {groupedRoutes.map(({ layer, routes }) => (
            <div key={layer} style={{ marginTop: 8 }}>
              <div
                style={{
                  fontSize: 9, fontFamily: 'JetBrains Mono, monospace',
                  fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
                  color: 'var(--text-dim)', marginBottom: 6, paddingLeft: 2,
                }}
              >
                {layer}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {routes.map(route => {
                  const url = service.baseUrl
                    ? buildRaceCommandHandoffUrl(service.baseUrl, {
                        route: route.path.split('/').pop() ?? 'pitwall',
                      })
                    : '';
                  return (
                    <button
                      key={route.id}
                      type="button"
                      className="btn"
                      title={route.description}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        padding: '5px 10px', minHeight: 32, borderRadius: 'var(--radius)',
                        border: '1px solid var(--border)',
                        background: isDisabled ? 'var(--surface-faint)' : 'rgba(255,255,255,0.02)',
                        color: isDisabled ? 'var(--text-muted)' : 'var(--text)',
                        fontFamily: 'JetBrains Mono, monospace', fontSize: 10, fontWeight: 600,
                        cursor: isDisabled ? 'not-allowed' : 'pointer',
                        opacity: isDisabled ? 0.5 : 1,
                        transition: 'border-color 0.15s, color 0.15s',
                      }}
                      onClick={() => {
                        if (!isDisabled && url) window.open(url, '_blank', 'noopener,noreferrer');
                      }}
                      disabled={isDisabled}
                      aria-label={`Open ${route.label} in ${service.label}`}
                    >
                      <ExternalLink size={10} />
                      {route.label}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Fallback: no routes, show single button — hidden when disabled */}
      {!groupedRoutes && !disabled && (
        <div style={{ padding: '12px 16px 16px', display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            className="btn"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '0 14px', minHeight: 40, borderRadius: 'var(--radius)',
              border: '1px solid color-mix(in srgb, var(--purple) 35%, transparent)',
              background: isDisabled ? 'var(--surface-faint)' : 'transparent',
              color: isDisabled ? 'var(--text-muted)' : 'var(--purple)',
              fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700,
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              opacity: isDisabled ? 0.5 : 1,
            }}
            onClick={() => {
              if (!isDisabled && service.baseUrl) {
                const url = buildRaceCommandHandoffUrl(service.baseUrl, {
                  route: 'pitwall',
                });
                window.open(url, '_blank', 'noopener,noreferrer');
              }
            }}
            disabled={isDisabled}
            aria-label={`Open ${service.label} preview`}
          >
            <ExternalLink size={13} />
            {service.status === 'not-connected' ? 'Configure connection' : 'Open Preview'}
          </button>
          {service.status === 'preview' && (
            <span style={{ fontSize: 10, color: 'var(--text-dim)' }}>
              Dedicated preview for the full operational cycle.
            </span>
          )}
        </div>
      )}
    </div>
  );
}
