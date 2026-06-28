/**
 * VideoStudioPage ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â Telemetry + Video Studio.
 *
 * One playhead drives a reconstructed onboard view (bike position on the real
 * circuit outline + a synced HUD) and the telemetry traces together. Scrub,
 * play/pause, pick a lap, toggle channels, jump to corner markers or curated
 * clips. Honest: there is no real footage ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â the onboard view is telemetry-
 * driven ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â and GPS-only ECU/IMU channels are flagged estimated.
 */
import { useState, useEffect, useMemo } from 'react';
import { Video, Play, Pause, SkipBack } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { sampleOutline } from '../domain/circuitDatasets';
import { buildVideoTrack, frameAt, formatClock, CHANNELS, ChannelDef } from '../domain/videoStudio';

const MONO = 'JetBrains Mono, monospace';
const W = 560, TRACE_H = 46;

export function VideoStudioPage() {
  const garage = useGarage();
  const { ctx, datasetMismatch } = useSessionContext();
  const [lap, setLap] = useState('Stint 03 ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Lap 5 (best)');
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedMult, setSpeedMult] = useState(1);
  const [enabled, setEnabled] = useState<Set<ChannelDef['id']>>(new Set(['speed', 'throttle', 'brake', 'lean']));

  const track = useMemo(
    () => buildVideoTrack(garage.profile.rider.name, `${garage.profile.bike.brand} ${garage.profile.bike.model}`, ctx.circuitName, lap, garage.telemetryLimited),
    [garage.profile.rider.name, garage.profile.bike.brand, garage.profile.bike.model, ctx.circuitName, lap, garage.telemetryLimited],
  );

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => setT(prev => (prev + 0.1 * speedMult >= track.duration ? 0 : prev + 0.1 * speedMult)), 100);
    return () => clearInterval(id);
  }, [playing, speedMult, track.duration]);

  const frame = frameAt(track, t);

  // onboard reconstruction ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â bike position on the real outline (fallback mugello)
  const outlineId = sampleOutline(ctx.selectedCircuit, 2, 10, 10).length ? ctx.selectedCircuit : 'mugello';
  const PTS = useMemo(() => sampleOutline(outlineId, 90, 300, 175, 16), [outlineId]);
  const pos = PTS[Math.round(frame.distPct * (PTS.length - 1))] ?? PTS[0] ?? [150, 88];

  const seekFromX = (clientX: number, el: SVGSVGElement) => {
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    setT(pct * track.duration);
  };

  const toggle = (id: ChannelDef['id']) => setEnabled(s => {
    const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n;
  });

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Video size={18} /> Telemetry + Video Studio</h1>
          <p className="page-subtitle">Synced onboard view & telemetry ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â {track.combo} ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· {lap}</p>
        </div>
        <select value={lap} onChange={e => { setLap(e.target.value); setT(0); }}
          style={{ fontSize: 11, fontFamily: MONO, background: 'var(--bg-surface)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: '5px 8px' }}>
          {track.lapOptions.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>

      <div style={{ marginBottom: 12, padding: '7px 11px', borderRadius: 'var(--radius)', background: 'var(--yellow-dim)', border: '1px solid var(--yellow-border)', fontSize: 10.5, color: 'var(--text)' }}>
        Reconstructed onboard view ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â telemetry-driven (no raw footage in this dataset).{garage.telemetryLimited && ' GPS-only bike: ECU/IMU channels are estimated.'}{datasetMismatch && ' Circuit has no dataset ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â showing the Mugello reference layout.'}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16, alignItems: 'start' }}>
        {/* Onboard reconstruction + HUD */}
        <div className="card" style={{ padding: 12 }}>
          <svg viewBox="0 0 300 175" style={{ width: '100%', display: 'block' }}>
            <polyline points={PTS.map(p => p.join(',')).join(' ')} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={3} strokeLinejoin="round" />
            {/* travelled portion */}
            <polyline points={PTS.slice(0, Math.round(frame.distPct * (PTS.length - 1)) + 1).map(p => p.join(',')).join(' ')} fill="none" stroke="var(--cyan)" strokeWidth={3} strokeLinejoin="round" />
            <circle cx={pos[0]} cy={pos[1]} r={5} fill="#E10600" stroke="#fff" strokeWidth={1.5} />
          </svg>
          {/* HUD */}
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginTop: 8 }}>
            <span style={{ fontSize: 30, fontWeight: 800, fontFamily: MONO, color: 'var(--text)' }}>{frame.speed}</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>km/h</span>
            <span style={{ marginLeft: 'auto', fontSize: 11, fontFamily: MONO, color: 'var(--text-muted)' }}>gear</span>
            <span style={{ fontSize: 22, fontWeight: 800, fontFamily: MONO, color: 'var(--purple)' }}>{frame.gear}</span>
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: 11, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 2 }}>
            <span>lean <span style={{ color: 'var(--yellow)' }}>{frame.lean}ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°</span></span>
            <span>rpm <span style={{ color: 'var(--thermal)' }}>{frame.rpm.toLocaleString()}</span></span>
            <span>slip <span style={{ color: frame.rearSlip >= 10 ? 'var(--accent)' : 'var(--text)' }}>{frame.rearSlip}%</span></span>
          </div>
          {/* throttle / brake bars */}
          {(['throttle', 'brake'] as const).map(k => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
              <span style={{ width: 54, fontSize: 9.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{k}</span>
              <div style={{ flex: 1, height: 7, borderRadius: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                <div style={{ width: `${frame[k]}%`, height: '100%', background: k === 'throttle' ? 'var(--green)' : 'var(--accent)' }} />
              </div>
              <span style={{ width: 32, textAlign: 'right', fontSize: 10, fontFamily: MONO, color: 'var(--text)' }}>{frame[k]}%</span>
            </div>
          ))}
        </div>

        {/* Telemetry traces + transport */}
        <div className="card" style={{ padding: 14 }}>
          {/* transport */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <button onClick={() => setT(0)} title="restart" style={btn}><SkipBack size={14} /></button>
            <button onClick={() => setPlaying(p => !p)} style={{ ...btn, background: 'var(--cyan)', color: 'var(--bg-base)', borderColor: 'var(--cyan)' }}>
              {playing ? <Pause size={14} /> : <Play size={14} />}
            </button>
            <span style={{ fontSize: 12, fontFamily: MONO, color: 'var(--text)' }}>{formatClock(t)} / {formatClock(track.duration)}</span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              {[0.5, 1, 2].map(s => (
                <button key={s} onClick={() => setSpeedMult(s)} style={{ ...btn, padding: '3px 7px', fontSize: 10, fontFamily: MONO, background: speedMult === s ? 'rgba(0,183,255,0.12)' : 'transparent', color: speedMult === s ? 'var(--cyan)' : 'var(--text-muted)', borderColor: speedMult === s ? 'var(--cyan)' : 'var(--border)' }}>{s}ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â</button>
              ))}
            </div>
          </div>

          {/* channel toggles */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 10 }}>
            {CHANNELS.map(ch => {
              const on = enabled.has(ch.id);
              const est = ch.estimatedOnGps && garage.telemetryLimited;
              return (
                <button key={ch.id} onClick={() => toggle(ch.id)}
                  style={{ fontSize: 9.5, fontFamily: MONO, padding: '2px 8px', borderRadius: 5, cursor: 'pointer',
                    background: on ? `${ch.color}22` : 'transparent', border: `1px solid ${on ? ch.color : 'var(--border)'}`,
                    color: on ? ch.color : 'var(--text-muted)' }}>
                  {ch.label} <span style={{ color: on ? ch.color : 'var(--text-muted)' }}>{Math.round(Number(frame[ch.id]))}{ch.unit}</span>{est ? ' ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â·est' : ''}
                </button>
              );
            })}
          </div>

          {/* traces */}
          <svg viewBox={`0 0 ${W} ${TRACE_H * [...enabled].length + 14}`} style={{ width: '100%', display: 'block', cursor: 'crosshair' }}
            onClick={e => seekFromX(e.clientX, e.currentTarget)}>
            {/* corner markers */}
            {track.corners.map(c => (
              <g key={c.name}>
                <line x1={c.pct * W} y1={0} x2={c.pct * W} y2={TRACE_H * [...enabled].length} stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
              </g>
            ))}
            {CHANNELS.filter(ch => enabled.has(ch.id)).map((ch, row) => {
              const y0 = row * TRACE_H;
              const pts = track.frames.map(f => {
                const x = f.distPct * W;
                const y = y0 + TRACE_H - 6 - (Number(f[ch.id]) / ch.max) * (TRACE_H - 12);
                return `${x.toFixed(1)},${y.toFixed(1)}`;
              }).join(' ');
              return (
                <g key={ch.id}>
                  <text x={2} y={y0 + 10} fontSize={8} fontFamily={MONO} fill={ch.color}>{ch.label.toUpperCase()}</text>
                  <polyline points={pts} fill="none" stroke={ch.color} strokeWidth={1.4} />
                </g>
              );
            })}
            {/* playhead */}
            <line x1={(t / track.duration) * W} y1={0} x2={(t / track.duration) * W} y2={TRACE_H * [...enabled].length} stroke="#fff" strokeWidth={1} />
          </svg>

          {/* corner jump chips */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
            {track.corners.map(c => (
              <button key={c.name} onClick={() => setT(c.pct * track.duration)}
                style={{ ...btn, padding: '2px 6px', fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)' }}>
                {c.name.split(' ')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* clips */}
      <div className="card" style={{ padding: 14, marginTop: 14 }}>
        <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Clips & annotations</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {track.clips.map(clip => {
            const color = clip.severity === 'loss' ? 'var(--accent)' : clip.severity === 'gain' ? 'var(--green)' : 'var(--cyan)';
            return (
              <button key={clip.id} onClick={() => setT(clip.t)}
                style={{ textAlign: 'left', display: 'flex', gap: 10, alignItems: 'flex-start', padding: 10, borderRadius: 8, cursor: 'pointer', background: 'transparent', border: `1px solid var(--border)`,
 }}>
                <span style={{ fontSize: 10, fontFamily: MONO, color, whiteSpace: 'nowrap' }}>{formatClock(clip.t)}</span>
                <span>
                  <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)' }}>{clip.corner}</span>
                  <span style={{ display: 'block', fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{clip.note}</span>
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const btn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 4,
  background: 'transparent', border: '1px solid var(--border)', color: 'var(--text)',
  borderRadius: 'var(--radius)', padding: '5px 8px', cursor: 'pointer',
};
