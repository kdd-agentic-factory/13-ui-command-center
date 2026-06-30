/**
 * TrackEvolutionPage – Track Evolution Model.
 *
 * How the circuit's grip evolves across the session – rubbering in to a peak
 * window, then fading as track temperature climbs – with the best push-lap
 * window marked and the limiter explained per phase.
 */
import { TrendingUp } from 'lucide-react';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildTrackEvolution, phaseMeta } from '../domain/trackEvolution';

const MONO = 'JetBrains Mono, monospace';
const W = 620, H = 180;

export function TrackEvolutionPage() {
  const { ctx } = useSessionContext();
  const evo = buildTrackEvolution(ctx.circuitName);
  const maxTemp = Math.max(...evo.points.map(p => p.trackTempC));
  const x = (lap: number) => ((lap - 1) / (evo.laps - 1)) * W;
  const gripY = (g: number) => H - (g / 100) * H;
  const tempY = (t: number) => H - (t / maxTemp) * H;

  const gripPts = evo.points.map(p => `${x(p.lap).toFixed(1)},${gripY(p.gripPct).toFixed(1)}`).join(' ');
  const tempPts = evo.points.map(p => `${x(p.lap).toFixed(1)},${tempY(p.trackTempC).toFixed(1)}`).join(' ');

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><TrendingUp size={18} /> Track Evolution Model</h1>
          <p className="page-subtitle">Grip evolution & best window – {evo.combo} · {evo.laps} laps · ambient {evo.ambientC}°C</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Current · lap {evo.currentLap}</div>
          <div style={{ fontSize: 14, fontWeight: 800, color: phaseMeta(evo.currentPhase).color }}>{phaseMeta(evo.currentPhase).label}</div>
        </div>
      </div>

      <div className="card" style={{ padding: 16 }}>
        <svg viewBox={`0 0 ${W} ${H + 18}`} style={{ width: '100%', display: 'block' }}>
          {/* peak window band */}
          <rect x={x(evo.peakWindow[0])} y={0} width={x(evo.peakWindow[1]) - x(evo.peakWindow[0])} height={H} fill="rgba(0,230,118,0.08)" />
          <text x={(x(evo.peakWindow[0]) + x(evo.peakWindow[1])) / 2} y={12} fontSize={9} fontFamily={MONO} fill="var(--green)" textAnchor="middle">PEAK WINDOW</text>
          {/* grip + temp */}
          <polyline points={gripPts} fill="none" stroke="var(--green)" strokeWidth={2} />
          <polyline points={tempPts} fill="none" stroke="var(--accent)" strokeWidth={1.6} strokeDasharray="4 3" />
          {/* current lap marker */}
          <line x1={x(evo.currentLap)} y1={0} x2={x(evo.currentLap)} y2={H} stroke="#fff" strokeWidth={1} />
        </svg>
        <div style={{ display: 'flex', gap: 16, fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 4 }}>
          <span><span style={{ color: 'var(--green)' }}>──</span> grip %</span>
          <span><span style={{ color: 'var(--accent)' }}>– –</span> track temp °C</span>
          <span style={{ marginLeft: 'auto' }}>lap 1 → {evo.laps}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16,
 }}>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Recommendation</div>
          <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.5 }}>{evo.recommendation}</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 8 }}>Best push window: <span style={{ color: 'var(--green)', fontFamily: MONO }}>laps {evo.peakWindow[0]}–{evo.peakWindow[1]}</span></div>
        </div>
        <div className="card" style={{ padding: 16,
 }}>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>Current limiter</div>
          <div style={{ fontSize: 13, color: 'var(--text)' }}>{evo.limiter}</div>
          <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 11, fontFamily: MONO }}>
            <span><span style={{ color: 'var(--text-muted)' }}>grip </span><span style={{ color: 'var(--green)' }}>{evo.points[evo.currentLap - 1].gripPct}%</span></span>
            <span><span style={{ color: 'var(--text-muted)' }}>track </span><span style={{ color: 'var(--accent)' }}>{evo.points[evo.currentLap - 1].trackTempC}°C</span></span>
            <span><span style={{ color: 'var(--text-muted)' }}>potential </span><span style={{ color: 'var(--text)' }}>+{evo.points[evo.currentLap - 1].potential}s</span></span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TrackEvolutionPage;
