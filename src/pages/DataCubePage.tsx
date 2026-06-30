/**
 * DataCubePage – Telemetry Data Cube & Semantic Zoom.
 *
 * Navigate from the whole session to the exact channel where the lap is lost:
 * a laps → corners delta matrix, semantic-zoom breadcrumb (Session → Lap →
 * Corner → Phase → Channel), performance lenses, heatmap filters, a cause→
 * effect chain, before/after and an automatic data story.
 */
import { useState, useEffect } from 'react';
import { Boxes, ChevronRight, ArrowDown, Wifi, WifiOff } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildDataCube, loadDataCube, cellColor, CUBE_LAPS, CUBE_CORNERS, heatmapTopIssue, CubeCell, DataCube } from '../domain/dataCube';
import { fetchTelemetrySessions } from '../services/api';

const MONO = 'JetBrains Mono, monospace';
const LEVELS = ['Session', 'Lap', 'Corner', 'Phase', 'Channel'] as const;

export function DataCubePage() {
  const garage = useGarage();
  const { ctx } = useSessionContext();
  const rider = garage.profile.rider.name;
  const bike = `${garage.profile.bike.brand} ${garage.profile.bike.model}`;

  // Start from the deterministic model for an instant, jank-free render, then
  // upgrade to live telemetry (18-telemetry-dataset) if the service answers.
  const [cube, setCube] = useState<DataCube>(() => buildDataCube(rider, bike, ctx.circuitName));
  useEffect(() => {
    let alive = true;
    setCube(buildDataCube(rider, bike, ctx.circuitName)); // reset on combo change
    loadDataCube(rider, bike, ctx.circuitName, { fetchSessions: fetchTelemetrySessions })
      .then(c => { if (alive) setCube(c); })
      .catch(() => { /* keep deterministic */ });
    return () => { alive = false; };
  }, [rider, bike, ctx.circuitName]);

  const [level, setLevel] = useState(0);
  const [lap, setLap] = useState(4);
  const [corner, setCorner] = useState('T15');
  const [lens, setLens] = useState('performance');
  const [filter, setFilter] = useState('Time loss');

  const cell = (l: number, c: string) => cube.cells.find(x => x.lap === l && x.corner === c)!;

  const insight = () => {
    if (level <= 0) return cube.views.session;
    if (level === 1) return cube.views.lap(lap);
    if (level === 2) return cube.views.corner(corner);
    if (level === 3) return cube.views.phase;
    return cube.views.channel;
  };
  const view = insight();

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Boxes size={18} /> Telemetry Data Cube</h1>
          <p className="page-subtitle">Semantic zoom · heatmaps · cause→effect · synced traces – {cube.combo}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          {cube.source === 'live' ? (
            <span title={cube.live ? `${cube.live.sessionId} · ${cube.live.totalLaps} laps${cube.live.classification ? ` · ${cube.live.classification}` : ''}` : ''}
              style={badgeStyle('var(--green)', 'rgba(0,230,118,0.4)')}>
              <Wifi size={11} /> LIVE TELEMETRY
            </span>
          ) : cube.source === 'connected' ? (
            <span title={`18-telemetry-dataset reachable · ${cube.catalogue?.sessions ?? 0} sessions for ${cube.catalogue?.circuits.join(', ')} – none for this circuit, header modelled`}
              style={badgeStyle('var(--cyan)', 'rgba(0,183,255,0.4)')}>
              <Wifi size={11} /> TELEMETRY CONNECTED
            </span>
          ) : (
            <span title="18-telemetry-dataset unreachable / asleep – showing the deterministic model"
              style={badgeStyle('var(--text-muted)', 'var(--border)')}>
              <WifiOff size={11} /> SIMULATED
            </span>
          )}
          {cube.source === 'live' && cube.live && (
            <div style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 3 }}>
              {cube.live.sessionId} · {cube.live.totalLaps} laps
            </div>
          )}
          {cube.source === 'connected' && cube.catalogue && (
            <div style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 3 }}>
              {cube.catalogue.sessions} real sessions · {cube.catalogue.circuits.join(', ')}
            </div>
          )}
        </div>
      </div>

      {/* breadcrumb / semantic zoom */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14, fontSize: 11, fontFamily: MONO }}>
        {LEVELS.map((lv, i) => (
          <span key={lv} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <button onClick={() => i <= level && setLevel(i)} disabled={i > level}
              style={{ background: 'none', border: 'none', cursor: i <= level ? 'pointer' : 'default',
                color: i === level ? 'var(--cyan)' : i < level ? 'var(--text)' : 'var(--text-muted)', fontWeight: i === level ? 700 : 400 }}>
              {lv}{i === 1 && level >= 1 ? ` ${lap}` : ''}{i === 2 && level >= 2 ? ` ${corner}` : ''}
            </button>
            {i < LEVELS.length - 1 && <ChevronRight size={12} style={{ color: 'rgba(255,255,255,0.2)' }} />}
          </span>
        ))}
      </div>

      {/* lens selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
        <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', alignSelf: 'center' }}>Data lens</span>
        {cube.lenses.map(l => (
          <button key={l.id} onClick={() => setLens(l.id)} title={l.desc}
            style={{ fontSize: 10.5, fontFamily: MONO, padding: '4px 9px', borderRadius: 'var(--radius)', cursor: 'pointer',
              background: lens === l.id ? 'rgba(0,183,255,0.12)' : 'transparent', border: `1px solid ${lens === l.id ? 'var(--cyan)' : 'var(--border)'}`, color: lens === l.id ? 'var(--cyan)' : 'var(--text-muted)' }}>
            {l.label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* matrix */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Laps → corners · time-loss matrix (click a cell to zoom)</div>
          {cube.source !== 'simulated' && (
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 10 }}>
              {cube.source === 'live'
                ? 'Session header is live from telemetry; the per-corner matrix is modelled until the service exposes per-corner deltas.'
                : 'Telemetry service connected (real session catalogue), but no session for this circuit – header and matrix are modelled.'}
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: `48px repeat(${CUBE_CORNERS.length}, 1fr)`, gap: 6 }}>
            <span />
            {CUBE_CORNERS.map(c => <span key={c} style={{ fontSize: 10, fontFamily: MONO, color: 'var(--text)', textAlign: 'center' }}>{c}</span>)}
            {CUBE_LAPS.map(l => (
              <Boxs key={l} l={l} cell={cell} onPick={(c) => { setLap(l); setCorner(c); setLevel(2); }} selected={level >= 1 && lap === l} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 12, fontSize: 9.5, fontFamily: MONO, flexWrap: 'wrap' }}>
            <Legend c={cellColor('stable')} t="stable" /><Legend c={cellColor('moderate')} t="moderate" />
            <Legend c={cellColor('critical')} t="critical" /><Legend c={cellColor('ai')} t="AI intervention" />
          </div>

          {/* heatmap filter */}
          <div style={{ marginTop: 16 }}>
            <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Performance heatmap</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 8 }}>
              {cube.filters.map(f => (
                <button key={f} onClick={() => setFilter(f)}
                  style={{ fontSize: 9.5, fontFamily: MONO, padding: '2px 7px', borderRadius: 5, cursor: 'pointer',
                    background: filter === f ? 'rgba(255,255,255,0.08)' : 'transparent', border: `1px solid ${filter === f ? 'var(--text)' : 'var(--border)'}`, color: filter === f ? 'var(--text)' : 'var(--text-muted)' }}>{f}</button>
              ))}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text)' }}>Top issue · <span style={{ color: 'var(--accent)' }}>{heatmapTopIssue(filter)}</span></div>
          </div>
        </div>

        {/* insight panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 16, borderTop: '3px solid var(--cyan)' }}>
            <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>{LEVELS[level]} insight</div>
            {Object.entries(view).map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, fontSize: 11.5, marginBottom: 4 }}>
                <span style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{k.replace(/([A-Z])/g, ' $1')}</span>
                <span style={{ color: 'var(--text)', fontFamily: MONO, textAlign: 'right' }}>{String(v)}</span>
              </div>
            ))}
            {level < 4 && (
              <button onClick={() => setLevel(level + 1)} style={{ marginTop: 8, display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10, fontFamily: MONO, color: 'var(--cyan)', background: 'none', border: '1px solid rgba(0,183,255,0.3)', borderRadius: 5, padding: '4px 9px', cursor: 'pointer' }}>
                zoom into {LEVELS[level + 1]} <ArrowDown size={12} />
              </button>
            )}
          </div>

          {/* cause → effect */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Cause → effect</div>
            {cube.causeEffect.map((s, i) => (
              <div key={s.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11.5 }}>
                  <span style={{ color: 'var(--text)' }}>{s.label}</span>
                  <span style={{ fontFamily: MONO, color: i === cube.causeEffect.length - 1 ? 'var(--accent)' : 'var(--text-muted)' }}>{s.value}</span>
                </div>
                {i < cube.causeEffect.length - 1 && <ArrowDown size={12} style={{ color: 'rgba(255,255,255,0.25)', margin: '1px 0' }} />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* before/after + data story */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Before / after · {cube.beforeAfter.improvement}</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto auto', gap: '5px 12px', fontSize: 11.5 }}>
            <span style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Metric</span>
            <span style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>Before</span>
            <span style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', textAlign: 'right' }}>After</span>
            {Object.keys(cube.beforeAfter.before).map(k => (
              <span key={k} style={{ display: 'contents' }}>
                <span style={{ color: 'var(--text)' }}>{k}</span>
                <span style={{ fontFamily: MONO, color: 'var(--text-muted)', textAlign: 'right' }}>{cube.beforeAfter.before[k]}</span>
                <span style={{ fontFamily: MONO, color: 'var(--green)', textAlign: 'right' }}>{cube.beforeAfter.after[k]}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="card" style={{ padding: 16, background: 'rgba(0,183,255,0.05)', border: '1px solid rgba(0,183,255,0.25)' }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--cyan)', textTransform: 'uppercase', marginBottom: 8 }}>Data storyteller</div>
          <div style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.6 }}>{cube.dataStory}</div>
        </div>
      </div>
    </div>
  );
}

function badgeStyle(color: string, border: string): React.CSSProperties {
  return { display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9.5, fontFamily: MONO, color, border: `1px solid ${border}`, borderRadius: 5, padding: '3px 8px' };
}

function Boxs({ l, cell, onPick, selected }: { l: number; cell: (l: number, c: string) => CubeCell; onPick: (c: string) => void; selected: boolean }) {
  return (
    <>
      <span style={{ fontSize: 10, fontFamily: MONO, color: selected ? 'var(--cyan)' : 'var(--text-muted)', alignSelf: 'center' }}>Lap {l}</span>
      {CUBE_CORNERS.map(c => {
        const cl = cell(l, c);
        return (
          <button key={c} onClick={() => onPick(c)}
            style={{ height: 38, borderRadius: 'var(--radius)', cursor: 'pointer', border: '1px solid var(--border)',
              background: `color-mix(in srgb, ${cellColor(cl.state)} 32%, transparent)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 10.5, fontFamily: MONO, color: 'var(--text)' }}>
            {cl.delta > 0 ? `+${cl.delta.toFixed(2)}` : 'OK'}
          </button>
        );
      })}
    </>
  );
}

function Legend({ c, t }: { c: string; t: string }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, color: 'var(--text-muted)' }}>
      <span style={{ width: 11, height: 11, borderRadius: 3, background: `color-mix(in srgb, ${c} 40%, transparent)`, border: `1px solid ${c}` }} /> {t}
    </span>
  );
}

export default DataCubePage;
