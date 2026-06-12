/**
 * GlobalContextBar — the always-visible session truth in the dashboard topbar:
 *
 *   Circuit · Mode · Rider · Bike · DATA badge · Confidence
 *
 * Clicking it opens the DATA INTEGRITY CENTER: the global validation panel
 * (circuit match, lap state, fuel model, tyre model, telemetry sync, map
 * geometry). When any check fails the bar carries a warning and the panel
 * states that advanced predictions are degraded.
 */
import { useState } from 'react';
import { CheckCircle2, XCircle, ShieldCheck, ChevronDown } from 'lucide-react';
import { useSessionContext } from '../hooks/useSessionContext';
import type { TelemetryFrame } from '../hooks/useLiveTelemetry';
import { MUGELLO_CIRCUIT } from '../domain/sessionTruth';

const MONO = 'JetBrains Mono, monospace';

interface Check { label: string; ok: boolean; desc: string }

export function GlobalContextBar({ telem }: { telem: TelemetryFrame }) {
  const { ctx, circuit, datasetMismatch, badge, badgeColor } = useSessionContext();
  const [open, setOpen] = useState(false);

  const lapOk = telem.lapCount >= 0 && telem.lapCount <= MUGELLO_CIRCUIT.raceLaps && !telem.lapAnomaly;
  const checks: Check[] = [
    { label: 'Session mode', ok: true, desc: `${ctx.sessionMode} · ${ctx.dashboardProfile.replace(/_/g, ' ')}` },
    { label: 'Data mode', ok: true, desc: ctx.dataMode.toUpperCase() },
    { label: 'Circuit match', ok: !datasetMismatch, desc: datasetMismatch ? `${ctx.circuitName} has no dataset — Mugello sample shown` : `${circuit.name} selected = loaded` },
    { label: 'Lap state', ok: lapOk, desc: telem.lapAnomaly ? 'Lap anomaly flagged' : `${telem.lapCount}/${MUGELLO_CIRCUIT.raceLaps}` },
    { label: 'Fuel model', ok: telem.fuelValid, desc: telem.fuelValid ? `${telem.fuelLoad.toFixed(1)} kg synced` : 'Fuel sensor out of range' },
    { label: 'Tyre model', ok: true, desc: `${telem.frontCompound}/${telem.rearCompound} · ${circuit.id === 'mugello' ? 'thermal map loaded' : 'reference map'}` },
    { label: 'Telemetry sync', ok: true, desc: ctx.setup.dataSource === 'upload' ? 'Uploaded session files' : ctx.dataMode },
    { label: 'Map geometry', ok: circuit.geometryLoaded, desc: circuit.meshLoaded ? '3D mesh loaded' : 'procedural map' },
  ];
  const failures = checks.filter(c => !c.ok).length;
  const confidence = Math.round(circuit.agentConfidence * 100);

  return (
    <div style={{ position: 'relative' }}>
      <button onClick={() => setOpen(o => !o)} data-testid="global-context-bar"
        style={{
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
          padding: '4px 12px', borderRadius: 8, fontSize: 10.5, fontFamily: MONO,
          background: failures ? 'rgba(245,158,11,0.08)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${failures ? 'var(--yellow)' : 'var(--border)'}`,
          color: 'var(--text)',
        }}>
        <span><span style={{ color: 'var(--text-muted)' }}>Circuit </span>{ctx.circuitName}</span>
        <span><span style={{ color: 'var(--text-muted)' }}>Mode </span>{ctx.sessionMode}</span>
        <span><span style={{ color: 'var(--text-muted)' }}>Rider </span>{ctx.setup.rider ?? 'R. Juárez'}</span>
        <span><span style={{ color: 'var(--text-muted)' }}>Bike </span>{ctx.setup.bike ?? 'Yamaha R1'}</span>
        {(ctx.setup.stint ?? ctx.setup.session) && <span><span style={{ color: 'var(--text-muted)' }}>Session </span>{ctx.setup.stint ?? ctx.setup.session}</span>}
        <span style={{ color: badgeColor, fontWeight: 700 }}>{badge}</span>
        <span style={{ color: confidence > 90 ? 'var(--green)' : 'var(--yellow)' }}>{confidence}%</span>
        {failures > 0 && <span style={{ color: 'var(--yellow)', fontWeight: 700 }}>⚠ {failures}</span>}
        <ChevronDown size={11} style={{ color: 'var(--text-muted)', transform: open ? 'rotate(180deg)' : 'none' }} />
      </button>

      {open && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 100, width: 320,
          background: 'rgba(11,13,18,0.97)', border: '1px solid var(--border)', borderRadius: 10,
          padding: 14, boxShadow: '0 8px 28px rgba(0,0,0,0.5)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <ShieldCheck size={13} style={{ color: failures ? 'var(--yellow)' : 'var(--green)' }} />
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text)' }}>DATA INTEGRITY CENTER</span>
          </div>
          {checks.map(c => (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              {c.ok ? <CheckCircle2 size={12} style={{ color: 'var(--green)', flexShrink: 0 }} /> : <XCircle size={12} style={{ color: 'var(--yellow)', flexShrink: 0 }} />}
              <span style={{ fontSize: 11, color: 'var(--text)', flex: 1 }}>{c.label}</span>
              <span style={{ fontSize: 9.5, fontFamily: MONO, color: c.ok ? 'var(--text-muted)' : 'var(--yellow)', textAlign: 'right' }}>{c.desc}</span>
            </div>
          ))}
          <div style={{ marginTop: 8, fontSize: 10.5, fontFamily: MONO, color: failures ? 'var(--yellow)' : 'var(--green)' }}>
            {failures
              ? 'Dashboard degraded — advanced predictions disabled until checks pass.'
              : 'All checks pass — full dashboard available.'}
          </div>
        </div>
      )}
    </div>
  );
}
