/**
 * GhostLapPage — Ghost Lap & Ideal Line Simulator.
 *
 * Compete against your ideal lap, not just the clock. Pick a ghost mode
 * (best / ideal / coach / rival / twin / safety / tyre), see the cumulative
 * gap build corner by corner, inspect a selected corner's line + throttle +
 * exit delta with a coach instruction, and let the Oracle pick the smartest
 * ghost — which is not always the fastest one.
 */
import { useState } from 'react';
import { Ghost, ChevronRight, Sparkles } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildGhostLap, GHOST_MODES, OVERLAY_CHANNELS } from '../domain/ghostLap';

const MONO = 'JetBrains Mono, monospace';

export function GhostLapPage() {
  const garage = useGarage();
  const { ctx } = useSessionContext();
  const [modeId, setModeId] = useState('ideal-personal');
  const [cornerIdx, setCornerIdx] = useState(3); // T15 Bucine — the main loss

  const gl = buildGhostLap(
    garage.profile.rider.name,
    `${garage.profile.bike.brand} ${garage.profile.bike.model}`,
    ctx.circuitName,
    modeId,
    garage.telemetryLimited,
  );
  const corner = gl.corners[Math.min(cornerIdx, gl.corners.length - 1)];
  const maxGap = Math.max(...gl.gapTimeline.map(p => p.gap), 0.001);

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Ghost size={18} /> Ghost Lap Simulator</h1>
          <p className="page-subtitle">Ideal line —· telemetry overlay —· AI coaching —· risk-aware reference — {gl.combo}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Potential gain</div>
          <div style={{ fontSize: 18, fontWeight: 800, fontFamily: MONO, color: 'var(--green)' }}>—†—™{gl.potentialGain.toFixed(3)}s</div>
        </div>
      </div>

      {/* Ghost mode selector */}
      <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap', marginBottom: 14 }}>
        {GHOST_MODES.map(m => {
          const active = m.id === modeId;
          return (
            <button key={m.id} onClick={() => setModeId(m.id)} title={m.desc}
              style={{
                fontSize: 10.5, fontFamily: MONO, padding: '5px 10px', borderRadius: 'var(--radius)', cursor: 'pointer',
                background: active ? 'rgba(0,183,255,0.12)' : 'transparent',
                border: `1px solid ${active ? 'var(--cyan)' : 'var(--border)'}`,
                color: active ? 'var(--cyan)' : 'var(--text-muted)',
              }}>
              {m.label}
              <span style={{ marginLeft: 6, color: m.riskDelta <= 0 ? 'var(--green)' : 'var(--accent)' }}>
                {m.riskDelta > 0 ? `+${m.riskDelta}` : m.riskDelta} risk
              </span>
            </button>
          );
        })}
      </div>

      {/* Lap header */}
      <div className="card" style={{ padding: 16, marginBottom: 14, display: 'flex', gap: 28, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Reference ghost</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--cyan)' }}>{gl.mode.label}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{gl.mode.desc}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Your lap</div>
          <div style={{ fontSize: 18, fontFamily: MONO, color: 'var(--text)' }}>{gl.yourLap}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Ghost lap</div>
          <div style={{ fontSize: 18, fontFamily: MONO, color: 'var(--violet)' }}>{gl.ghostLap}</div>
        </div>
        <div>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Main loss</div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{gl.mainLoss}</div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 14, fontSize: 10 }}>
          <span><span style={{ display: 'inline-block', width: 16, height: 3, background: 'var(--cyan)', verticalAlign: 'middle', marginRight: 5 }} />Your line</span>
          <span><span style={{ display: 'inline-block', width: 16, height: 3, background: 'var(--violet)', verticalAlign: 'middle', marginRight: 5 }} />Ghost ideal</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* Gap timeline */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 14 }}>Ghost gap timeline</div>
          {gl.gapTimeline.map((p, i) => (
            <div key={p.marker} onClick={() => i > 0 && i < gl.gapTimeline.length - 1 && setCornerIdx(Math.max(0, i - 1))}
              style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 9, cursor: i > 0 && i < gl.gapTimeline.length - 1 ? 'pointer' : 'default' }}>
              <span style={{ width: 110, fontSize: 10.5, color: 'var(--text)', fontFamily: MONO }}>{p.marker}</span>
              <div style={{ flex: 1, height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <div style={{ width: `${(p.gap / maxGap) * 100}%`, height: '100%', background: 'linear-gradient(90deg, var(--cyan), var(--accent))' }} />
              </div>
              <span style={{ width: 56, textAlign: 'right', fontSize: 10.5, fontFamily: MONO, color: p.gap === 0 ? 'var(--text-muted)' : 'var(--accent)' }}>+{p.gap.toFixed(3)}</span>
            </div>
          ))}
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>This is where the lap time is built — click a corner to inspect it.</div>

          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Telemetry overlays</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
              {OVERLAY_CHANNELS.map(c => {
                const est = gl.estimatedOverlays.includes(c);
                return (
                  <span key={c} style={{ fontSize: 9.5, fontFamily: MONO, color: est ? 'var(--text-muted)' : 'var(--text)', border: `1px solid ${est ? 'var(--border)' : 'rgba(0,183,255,0.3)'}`, borderRadius: 5, padding: '2px 7px' }}>
                    {c}{est ? ' —· est' : ''}
                  </span>
                );
              })}
            </div>
          </div>
        </div>

        {/* Corner inspector */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', flex: 1 }}>Selected corner</span>
              {gl.corners.map((c, i) => (
                <button key={c.corner} onClick={() => setCornerIdx(i)}
                  style={{ fontSize: 9.5, fontFamily: MONO, padding: '2px 7px', borderRadius: 4, cursor: 'pointer',
                    background: i === cornerIdx ? 'rgba(0,183,255,0.12)' : 'transparent',
                    border: `1px solid ${i === cornerIdx ? 'var(--cyan)' : 'var(--border)'}`,
                    color: i === cornerIdx ? 'var(--cyan)' : 'var(--text-muted)' }}>
                  {c.corner.split(' ')[0]}
                </button>
              ))}
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>{corner.corner} <span style={{ fontSize: 12, fontFamily: MONO, color: 'var(--accent)' }}>+{corner.delta.toFixed(3)}s</span></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 14px', fontSize: 11 }}>
              <div><span style={{ color: 'var(--text-muted)' }}>Your line: </span><span style={{ color: 'var(--cyan)' }}>{corner.yourLine}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Ghost line: </span><span style={{ color: 'var(--violet)' }}>{corner.ghostLine}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Your throttle: </span><span style={{ color: 'var(--text)' }}>{corner.yourThrottle}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Ghost throttle: </span><span style={{ color: 'var(--text)' }}>{corner.ghostThrottle}</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Your exit: </span><span style={{ fontFamily: MONO, color: 'var(--text)' }}>{corner.yourExit} km/h</span></div>
              <div><span style={{ color: 'var(--text-muted)' }}>Ghost exit: </span><span style={{ fontFamily: MONO, color: 'var(--green)' }}>{corner.ghostExit} km/h</span></div>
            </div>
            <div style={{ marginTop: 10, padding: '8px 11px', borderRadius: 'var(--radius)', background: 'rgba(0,183,255,0.06)', border: '1px solid rgba(0,183,255,0.2)', fontSize: 11.5, color: 'var(--text)' }}>
              <ChevronRight size={12} style={{ verticalAlign: -2, color: 'var(--cyan)' }} /> {corner.coach}
            </div>
          </div>

          {/* Next-lap cues */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Next-lap ghost cues</div>
            {gl.cues.map(c => (
              <div key={c.corner} style={{ display: 'flex', gap: 10, fontSize: 11.5, marginBottom: 6 }}>
                <span style={{ width: 110, color: 'var(--cyan)', fontFamily: MONO, fontSize: 10.5 }}>{c.corner}</span>
                <span style={{ color: 'var(--text)' }}>{c.text}</span>
              </div>
            ))}
          </div>

          {/* Oracle recommendation */}
          <div className="card" style={{ padding: 16, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
              <Sparkles size={15} style={{ color: 'var(--violet)' }} />
              <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--violet)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Oracle ghost recommendation</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{gl.oracle.ghost}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>{gl.oracle.reason}</div>
            <div style={{ fontSize: 11.5, color: 'var(--green)', marginTop: 6, fontWeight: 600 }}>{gl.oracle.decision}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
