import { useMemo, useState } from 'react';
import { Users, TrendingUp, TrendingDown, Trophy, ChevronRight } from 'lucide-react';

/**
 * Rider Comparison (engineer Phase 3 #1) — head-to-head, corner-by-corner against
 * another rider or your own best lap. Surfaces where you gain and lose, the
 * mid-corner speed and exit-drive deltas, the sector splits and the single
 * biggest opportunity. Built on the §10 Rival Intelligence model.
 */

const YOU = 'You';
const RIVALS = ['M. Hayden (P1)', 'Your best lap', 'A. Espargaró (P2)'];

interface Corner {
  n: number; name: string;
  youKmh: number; rivalKmh: number;
  youExit: number; rivalExit: number; // exit accel m/s²
  delta: number;  // seconds, + = you faster
  sector: 1 | 2 | 3;
}

// Synthetic but plausible head-to-head (You are quick in fast corners, lose in slow ones).
const CORNERS: Corner[] = [
  { n: 1, name: 'Nuvolari', youKmh: 118, rivalKmh: 121, youExit: 6.1, rivalExit: 6.4, delta: -0.041, sector: 1 },
  { n: 2, name: 'Le Mans', youKmh: 96, rivalKmh: 95, youExit: 7.0, rivalExit: 6.8, delta: 0.030, sector: 1 },
  { n: 3, name: 'Tunel', youKmh: 84, rivalKmh: 90, youExit: 5.2, rivalExit: 5.9, delta: -0.118, sector: 1 },
  { n: 4, name: 'Ascari', youKmh: 132, rivalKmh: 130, youExit: 7.4, rivalExit: 7.1, delta: 0.052, sector: 2 },
  { n: 5, name: 'Bus Stop', youKmh: 76, rivalKmh: 80, youExit: 4.8, rivalExit: 5.4, delta: -0.090, sector: 2 },
  { n: 6, name: 'Pedrosa', youKmh: 154, rivalKmh: 151, youExit: 8.1, rivalExit: 7.8, delta: 0.061, sector: 2 },
  { n: 7, name: 'Portago', youKmh: 71, rivalKmh: 79, youExit: 4.1, rivalExit: 5.0, delta: -0.184, sector: 2 },
  { n: 8, name: 'Fonsi', youKmh: 188, rivalKmh: 185, youExit: 8.6, rivalExit: 8.4, delta: 0.044, sector: 3 },
  { n: 9, name: 'Nieto', youKmh: 103, rivalKmh: 106, youExit: 6.0, rivalExit: 6.3, delta: -0.072, sector: 3 },
  { n: 10, name: 'Bugatti', youKmh: 142, rivalKmh: 140, youExit: 7.7, rivalExit: 7.5, delta: 0.038, sector: 3 },
];

function deltaColor(d: number): string {
  if (d > 0.02) return 'var(--green)';
  if (d < -0.02) return 'var(--accent)';
  return 'var(--text-dim)';
}

export function RiderComparisonPage() {
  const [rival, setRival] = useState(RIVALS[0]);

  const { total, sectors, worst, best } = useMemo(() => {
    const total = CORNERS.reduce((a, c) => a + c.delta, 0);
    const sectors = [1, 2, 3].map(s => ({
      s,
      delta: CORNERS.filter(c => c.sector === s).reduce((a, c) => a + c.delta, 0),
    }));
    const worst = CORNERS.reduce((m, c) => (c.delta < m.delta ? c : m), CORNERS[0]);
    const best = CORNERS.reduce((m, c) => (c.delta > m.delta ? c : m), CORNERS[0]);
    return { total, sectors, worst, best };
  }, []);

  const youAhead = total >= 0;
  const maxKmh = Math.max(...CORNERS.flatMap(c => [c.youKmh, c.rivalKmh]));

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Rider Comparison</h1>
          <p className="page-subtitle">Jarama · head-to-head, corner by corner</p>
        </div>
        <select value={rival} onChange={e => setRival(e.target.value)} className="btn btn-sm" style={{ cursor: 'pointer' }}>
          {RIVALS.map(r => <option key={r} value={r}>vs {r}</option>)}
        </select>
      </div>

      {/* Overall */}
      <div className="card mb-4" style={{ background: `linear-gradient(135deg, ${youAhead ? 'rgba(34,197,94,0.10)' : 'rgba(224,55,55,0.10)'}, rgba(255,255,255,0.02))` }}>
        <div className="card-header">
          <span className="card-title flex items-center gap-2"><Users size={14} style={{ color: 'var(--accent)' }} /> {YOU} vs {rival}</span>
          <span className="badge" style={{ background: youAhead ? 'var(--green-dim)' : 'var(--accent-dim)', color: youAhead ? 'var(--green)' : 'var(--accent)' }}>
            {youAhead ? 'AHEAD' : 'BEHIND'}
          </span>
        </div>
        <div className="grid-4" style={{ marginTop: 8 }}>
          <div className="stat-tile">
            <div className="stat-tile__label">Net delta</div>
            <span className="stat-tile__value" style={{ fontSize: 26, color: deltaColor(total) }}>{youAhead ? '−' : '+'}{Math.abs(total).toFixed(3)}<span className="stat-tile__unit">s</span></span>
          </div>
          <div className="stat-tile">
            <div className="stat-tile__label">Biggest loss</div>
            <span className="stat-tile__value" style={{ fontSize: 18, color: 'var(--accent)' }}>T{worst.n} · {worst.name}</span>
          </div>
          <div className="stat-tile">
            <div className="stat-tile__label">Biggest gain</div>
            <span className="stat-tile__value" style={{ fontSize: 18, color: 'var(--green)' }}>T{best.n} · {best.name}</span>
          </div>
          <div className="stat-tile">
            <div className="stat-tile__label">Corners ahead</div>
            <span className="stat-tile__value" style={{ fontSize: 22 }}>{CORNERS.filter(c => c.delta > 0).length}/{CORNERS.length}</span>
          </div>
        </div>
        {/* Sectors */}
        <div className="grid-3" style={{ marginTop: 10 }}>
          {sectors.map(sec => (
            <div key={sec.s} className="stat-tile">
              <div className="stat-tile__label">Sector {sec.s}</div>
              <span className="stat-tile__value" style={{ fontSize: 18, color: deltaColor(sec.delta) }}>{sec.delta >= 0 ? '−' : '+'}{Math.abs(sec.delta).toFixed(3)}s</span>
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 10, fontFamily: 'var(--font-mono)', fontSize: 11 }}>
        <span style={{ color: 'var(--accent)' }}>■ {YOU}</span>
        <span style={{ color: 'var(--blue)' }}>■ {rival}</span>
      </div>

      {/* Corner rows */}
      <div className="card">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {CORNERS.map(c => (
            <div key={c.n} style={{ display: 'grid', gridTemplateColumns: '92px 1fr 96px', gap: 12, alignItems: 'center', paddingBottom: 10, borderBottom: '1px solid var(--border)' }}>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 13 }}>T{c.n}</div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{c.name}</div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[{ who: YOU, v: c.youKmh, col: 'var(--accent)' }, { who: rival, v: c.rivalKmh, col: 'var(--blue)' }].map(r => (
                  <div key={r.who} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }}>
                      <div style={{ width: `${(r.v / maxKmh) * 100}%`, height: '100%', borderRadius: 4, background: r.col }} />
                    </div>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: r.col, minWidth: 48, textAlign: 'right' }}>{r.v} km/h</span>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5, fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 14, color: deltaColor(c.delta) }}>
                {c.delta > 0 ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                {c.delta >= 0 ? '−' : '+'}{Math.abs(c.delta).toFixed(3)}
              </div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 8, background: 'var(--accent-dim)', border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)' }}>
          <Trophy size={16} style={{ color: 'var(--accent)', flex: 'none' }} />
          <span style={{ fontSize: 13 }}>
            Biggest opportunity: <strong>Turn {worst.n} ({worst.name})</strong> — {(worst.rivalKmh - worst.youKmh)} km/h more mid-corner speed and stronger drive would recover {Math.abs(worst.delta).toFixed(3)}s.
          </span>
          <button className="btn btn-sm" style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, flex: 'none' }}>Open in Lap Replay <ChevronRight size={12} /></button>
        </div>
      </div>
    </div>
  );
}
