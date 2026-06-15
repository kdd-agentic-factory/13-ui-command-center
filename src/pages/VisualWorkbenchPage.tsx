/**
 * VisualWorkbenchPage — Telemetry Visualization OS.
 *
 * One synchronized session view: a Master Cursor drives the track position,
 * the telemetry traces, the event timeline and the corner card together; a
 * Visual Replay plays the session; a Before/After lens, a Data Story, the shared
 * visual grammar + confidence overlay, and saved per-role workspaces.
 */
import { useState, useEffect } from 'react';
import { LayoutDashboard, Play, Pause, SkipBack, ArrowRight, BookOpen } from 'lucide-react';
import { useNavigate } from '../context/NavContext';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { sampleOutline } from '../domain/circuitDatasets';
import { buildVisualWorkbench, frameAtTime, clockFromS } from '../domain/visualWorkbench';

const MONO = 'JetBrains Mono, monospace';
const W = 560, TRACE_H = 38;
const CHANNELS = [
  { id: 'speed', label: 'Speed', color: 'var(--cyan)', max: 300 },
  { id: 'throttle', label: 'Throttle', color: 'var(--green)', max: 100 },
  { id: 'lean', label: 'Lean', color: 'var(--yellow)', max: 60 },
  { id: 'rearSlip', label: 'Rear slip', color: 'var(--accent)', max: 20 },
] as const;

function sevColor(s?: string): string {
  return s === 'critical' ? 'var(--accent)' : s === 'high' ? '#FF6A00' : s === 'medium' ? 'var(--yellow)' : 'var(--text-muted)';
}

export function VisualWorkbenchPage() {
  const navigate = useNavigate();
  const garage = useGarage();
  const { ctx } = useSessionContext();
  const session = ctx.setup.stint ?? ctx.setup.session ?? 'Stint 03';
  const wb = buildVisualWorkbench(garage.profile.rider.name, `${garage.profile.bike.brand} ${garage.profile.bike.model}`, ctx.circuitName, session);

  const [t, setT] = useState(wb.durationS * 0.88); // open on the Bucine event
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setT(p => (p + 0.6 >= wb.durationS ? 0 : p + 0.6)), 120);
    return () => clearInterval(id);
  }, [playing, wb.durationS]);

  const cur = frameAtTime(wb, t);
  const outlineId = sampleOutline(ctx.selectedCircuit, 2, 10, 10).length ? ctx.selectedCircuit : 'mugello';
  const PTS = sampleOutline(outlineId, 90, 300, 175, 16);
  const pos = PTS[Math.round(cur.distPct * (PTS.length - 1))] ?? PTS[0] ?? [150, 88];
  const eventFrames = wb.frames.filter(f => f.event);

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><LayoutDashboard size={18} /> Telemetry Visualization OS</h1>
          <p className="page-subtitle">Master cursor · synchronized views · visual replay · before/after — {wb.combo}</p>
        </div>
      </div>

      {/* Master cursor bar */}
      <div className="card mb-4" style={{ padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
        {[['Lap', wb.lap], ['Distance', `${cur.distM} m`], ['Corner', cur.corner], ['Phase', cur.phase], ['Time', clockFromS(t)]].map(([k, v]) => (
          <div key={k as string}>
            <div style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{k}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{v}</div>
          </div>
        ))}
        <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
          <div style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current event</div>
          <div style={{ fontSize: 12.5, fontWeight: 700, color: cur.event ? sevColor(cur.eventSeverity) : 'var(--text-muted)' }}>{cur.event ?? '—'}</div>
        </div>
      </div>

      {/* transport */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <button onClick={() => setT(0)} style={btn}><SkipBack size={14} /></button>
        <button onClick={() => setPlaying(p => !p)} style={{ ...btn, background: 'var(--cyan)', color: '#001018', borderColor: 'var(--cyan)' }}>{playing ? <Pause size={14} /> : <Play size={14} />}</button>
        <input type="range" min={0} max={wb.durationS} step={0.1} value={t} onChange={e => setT(parseFloat(e.target.value))} style={{ flex: 1, accentColor: 'var(--cyan)' }} />
        <span style={{ fontSize: 11, fontFamily: MONO, color: 'var(--text-muted)' }}>{clockFromS(t)} / {clockFromS(wb.durationS)}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' }}>
        {/* synced track position */}
        <div className="card" style={{ padding: 12 }}>
          <svg viewBox="0 0 300 175" style={{ width: '100%', display: 'block' }}>
            <polyline points={PTS.map(p => p.join(',')).join(' ')} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={3} strokeLinejoin="round" />
            <polyline points={PTS.slice(0, Math.round(cur.distPct * (PTS.length - 1)) + 1).map(p => p.join(',')).join(' ')} fill="none" stroke="var(--cyan)" strokeWidth={3} strokeLinejoin="round" />
            <circle cx={pos[0]} cy={pos[1]} r={5} fill={cur.event ? sevColor(cur.eventSeverity) : '#E10600'} stroke="#fff" strokeWidth={1.5} />
          </svg>
          <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 11, fontFamily: MONO, flexWrap: 'wrap' }}>
            <span>spd <span style={{ color: 'var(--cyan)' }}>{cur.speed}</span></span>
            <span>thr <span style={{ color: 'var(--green)' }}>{cur.throttle}%</span></span>
            <span>lean <span style={{ color: 'var(--yellow)' }}>{cur.lean}°</span></span>
            <span>slip <span style={{ color: cur.rearSlip >= 10 ? 'var(--accent)' : 'var(--text)' }}>{cur.rearSlip}%</span></span>
          </div>
        </div>

        {/* synced traces + event timeline */}
        <div className="card" style={{ padding: 14 }}>
          <svg viewBox={`0 0 ${W} ${TRACE_H * CHANNELS.length + 22}`} style={{ width: '100%', display: 'block', cursor: 'crosshair' }}
            onClick={e => { const r = (e.currentTarget as SVGSVGElement).getBoundingClientRect(); setT(Math.max(0, Math.min(1, (e.clientX - r.left) / r.width)) * wb.durationS); }}>
            {CHANNELS.map((ch, row) => {
              const y0 = row * TRACE_H;
              const pts = wb.frames.map(f => `${(f.distPct * W).toFixed(1)},${(y0 + TRACE_H - 5 - (Number(f[ch.id]) / ch.max) * (TRACE_H - 10)).toFixed(1)}`).join(' ');
              return (
                <g key={ch.id}>
                  <text x={2} y={y0 + 9} fontSize={8} fontFamily={MONO} fill={ch.color}>{ch.label.toUpperCase()}</text>
                  <polyline points={pts} fill="none" stroke={ch.color} strokeWidth={1.3} />
                </g>
              );
            })}
            {/* event markers */}
            {eventFrames.map((f, i) => (
              <line key={i} x1={f.distPct * W} y1={0} x2={f.distPct * W} y2={TRACE_H * CHANNELS.length} stroke={sevColor(f.eventSeverity)} strokeWidth={1} strokeDasharray="2 2" opacity={0.6} />
            ))}
            {/* master playhead */}
            <line x1={cur.distPct * W} y1={0} x2={cur.distPct * W} y2={TRACE_H * CHANNELS.length} stroke="#fff" strokeWidth={1.5} />
          </svg>
          <div style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--text-muted)' }}>Click or drag to move the master cursor — every view syncs.</div>
        </div>
      </div>

      {/* corner card + data story */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16, borderLeft: `3px solid ${cur.event ? sevColor(cur.eventSeverity) : 'var(--cyan)'}` }}>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Cause → effect · {cur.corner} {cur.phase}</div>
          {cur.event ? (
            <>
              <div style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>{cur.event}</div>
              <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>Lean {cur.lean}° · throttle {cur.throttle}% · rear slip {cur.rearSlip}% · {cur.speed} km/h</div>
            </>
          ) : (
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>No event here — clean through {cur.corner.toLowerCase()}.</div>
          )}
        </div>
        <div className="card" style={{ padding: 16, background: 'rgba(0,183,255,0.05)', border: '1px solid rgba(0,183,255,0.25)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <BookOpen size={13} style={{ color: 'var(--cyan)' }} />
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--cyan)', textTransform: 'uppercase' }}>Data story</span>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.6 }}>{wb.dataStory}</div>
        </div>
      </div>

      {/* before / after lens */}
      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Before / after lens</div>
        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 10 }}>{wb.beforeAfterHeadline}</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 0.7fr', gap: '5px 12px', fontSize: 11.5 }}>
          {['Metric', 'Before', 'After', 'Δ'].map(h => <span key={h} style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</span>)}
          {wb.beforeAfter.map(r => {
            const good = r.betterIsLower ? r.deltaPct < 0 : r.deltaPct > 0;
            return (
              <span key={r.metric} style={{ display: 'contents' }}>
                <span style={{ color: 'var(--text)' }}>{r.metric}</span>
                <span style={{ fontFamily: MONO, color: 'var(--text-muted)' }}>{r.before}</span>
                <span style={{ fontFamily: MONO, color: good ? 'var(--green)' : 'var(--accent)' }}>{r.after}</span>
                <span style={{ fontFamily: MONO, color: good ? 'var(--green)' : 'var(--accent)' }}>{r.deltaPct > 0 ? '+' : ''}{r.deltaPct}%</span>
              </span>
            );
          })}
        </div>
      </div>

      {/* grammar + confidence + workspaces */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Visual grammar</div>
          {wb.grammar.map(g => (
            <div key={g.token} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 5 }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: g.color, flexShrink: 0 }} />
              <span style={{ fontSize: 9, fontFamily: MONO, color: g.color, width: 96 }}>{g.token}</span>
              <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{g.meaning}</span>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Confidence overlay</div>
          {wb.confidence.map(c => (
            <div key={c.label} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <svg width={44} height={10}><line x1={0} y1={5} x2={44} y2={5} stroke="var(--text)" strokeWidth={2} strokeDasharray={c.dash === 'dashed' ? '5 3' : c.dash === 'dotted' ? '1 3' : '0'} /></svg>
              <span style={{ fontSize: 11, color: 'var(--text)', width: 70 }}>{c.label}</span>
              <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.note}</span>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Saved workspaces</div>
          {wb.workspaces.map(w => (
            <button key={w.id} onClick={() => navigate(w.tab as never)}
              style={{ display: 'block', width: '100%', textAlign: 'left', marginBottom: 7, padding: '7px 10px', borderRadius: 7, cursor: 'pointer', background: 'var(--bg-surface)', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{w.name}</span>
                <ArrowRight size={12} style={{ color: 'var(--cyan)' }} />
              </div>
              <div style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--text-muted)' }}>{w.includes.join(' · ')}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

const btn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
  background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)',
  borderRadius: 6, padding: '6px 9px', cursor: 'pointer',
};
