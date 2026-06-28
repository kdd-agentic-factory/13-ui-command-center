/**
 * SessionContextStrip — global session-context labeling over every page.
 *
 * Renders above the page content whenever the session is NOT a plain live
 * session on a circuit with a real dataset:
 *   - DEMO / REPLAY / SIMULATION / PRE-RACE data-provenance label (§9: every
 *     widget must be identifiable as non-live)
 *   - DATA INTEGRITY warning when the selected circuit has no telemetry yet
 *     and modules are rendering the Mugello reference sample instead.
 *
 * In a normal LIVE session on Mugello it renders nothing — zero chrome.
 */
import { AlertTriangle, Radio } from 'lucide-react';
import { useSessionContext } from '../hooks/useSessionContext';
import { getActiveDemoSession } from '../domain/demoSessions';

const MONO = 'JetBrains Mono, monospace';

export function SessionContextStrip() {
  const { ctx, datasetMismatch, badge, badgeColor } = useSessionContext();
  const nonLive = ctx.dataMode !== 'live';

  if (!nonLive && !datasetMismatch) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 14 }}>
      {nonLive && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 'var(--radius)',
          background: 'var(--purple-dim)', border: `1px solid ${badgeColor}`,
          fontSize: 11, color: 'var(--text)',
        }}>
          <Radio size={12} style={{ color: badgeColor, flexShrink: 0 }} />
          <strong style={{ color: badgeColor, fontFamily: MONO, letterSpacing: '0.06em' }}>{badge}</strong>
          <span>
            {ctx.demoMode
              ? `Demo mode active — reproducible scripted session${getActiveDemoSession() ? `: ${getActiveDemoSession()!.script}` : ''} No live data, no real engineer-approval actions.`
              : ctx.dataMode === 'recorded'
                ? `Working on recorded data${ctx.setup.session ? ` — ${ctx.setup.session}` : ''}. Nothing on this screen is live.`
                : 'AI-estimated session — predictions carry simulation confidence, validate with real data before race decisions.'}
          </span>
        </div>
      )}
      {ctx.demoMode && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '5px 12px', borderRadius: 8,
          background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
          fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)', flexWrap: 'wrap',
        }}>
          <span style={{ color: badgeColor, fontWeight: 700 }}>GUIDED DEMO</span>
          {['1 Select Mugello', '2 Load Stint 03', '3 Inspect 3D map', '4 Review T15 Bucine', '5 Ask the Oracle', '6 Generate Session Report'].map(s => (
            <span key={s}>{s} ·</span>
          ))}
        </div>
      )}
      {datasetMismatch && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px', borderRadius: 8,
          background: 'rgba(245,158,11,0.06)', border: '1px solid var(--yellow)',
          fontSize: 11, color: 'var(--text)',
        }}>
          <AlertTriangle size={12} style={{ color: 'var(--yellow)', flexShrink: 0 }} />
          <strong style={{ color: 'var(--yellow)', fontFamily: MONO }}>DATA INTEGRITY</strong>
          <span>
            Selected circuit <strong>{ctx.circuitName}</strong> has no telemetry dataset yet — modules render the
            Mugello reference sample until a validation stint or upload populates it.
          </span>
        </div>
      )}
    </div>
  );
}
