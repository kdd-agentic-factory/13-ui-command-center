import { useLiveTelemetry } from '../hooks/useLiveTelemetry';

const COMPOUNDS = [
  {
    id: 'SOFT',   name: 'Soft',   color: '#E03737', wearRate: 1.8,
    optWindow: '6–10', grip: 96, heatUp: '2 laps', note: 'High grip, fast deg',
  },
  {
    id: 'MEDIUM', name: 'Medium', color: '#F59E0B', wearRate: 1.2,
    optWindow: '10–14', grip: 89, heatUp: '4 laps', note: 'Balanced — current',
  },
  {
    id: 'HARD',   name: 'Hard',   color: '#E6EAF4', wearRate: 0.7,
    optWindow: '16–20', grip: 80, heatUp: '6 laps', note: 'Durable, low peak',
  },
];

// Degradation model data (% performance remaining over laps)
function DegCurve({ color, wearRate, laps }: { color: string; wearRate: number; laps: number }) {
  const pts = Array.from({ length: 25 }, (_, i) => {
    const perf = Math.max(0, 100 - wearRate * i * 5.5);
    const x = (i / 24) * 580;
    const y = 90 - (perf / 100) * 80;
    return `${x},${y}`;
  }).join(' ');
  const curLapX = (laps / 24) * 580;

  return (
    <g>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" opacity="0.8" />
      <line x1={curLapX} y1="0" x2={curLapX} y2="90" stroke={color} strokeWidth="1" strokeDasharray="4,3" opacity="0.5" />
    </g>
  );
}

export function TireDegradationPage() {
  const t = useLiveTelemetry();
  const lapAge = t.rearTyreAge;

  const rearWear = Math.min(99, lapAge * 4.8);
  const frontWear = Math.min(99, lapAge * 3.2);
  const optimalPitLap = Math.max(t.lapCount + 1, t.lapCount + Math.round((18 - lapAge) / 1.5));

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Tire Degradation</h1>
          <p className="page-subtitle">Compound analysis · Pit strategy · Performance window</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-yellow">Rear SOFT · Lap {lapAge}</span>
          <span className="badge badge-blue">Front MEDIUM · Lap {lapAge}</span>
        </div>
      </div>

      {/* ── Current tyre status ──────────────────────────────────────────── */}
      <div className="grid-4 mb-4">
        <div className="stat-tile accent-border">
          <div className="stat-tile__label">Rear Tyre Wear</div>
          <div className="stat-tile__value" style={{ color: rearWear > 70 ? 'var(--accent)' : 'var(--yellow)' }}>
            {rearWear.toFixed(1)}<span className="stat-tile__unit">%</span>
          </div>
          <div className="bar-track mt-2" style={{ marginTop: 8 }}>
            <div className="bar-fill" style={{ width: `${rearWear}%`, background: rearWear > 70 ? 'var(--accent)' : 'var(--yellow)' }} />
          </div>
        </div>
        <div className="stat-tile blue-border">
          <div className="stat-tile__label">Front Tyre Wear</div>
          <div className="stat-tile__value" style={{ color: 'var(--blue)' }}>
            {frontWear.toFixed(1)}<span className="stat-tile__unit">%</span>
          </div>
          <div className="bar-track mt-2" style={{ marginTop: 8 }}>
            <div className="bar-fill blue" style={{ width: `${frontWear}%` }} />
          </div>
        </div>
        <div className="stat-tile green-border">
          <div className="stat-tile__label">Optimal Pit Lap</div>
          <div className="stat-tile__value text-mono" style={{ color: 'var(--green)' }}>L{optimalPitLap}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>+{optimalPitLap - t.lapCount} laps from now</div>
        </div>
        <div className="stat-tile yellow-border">
          <div className="stat-tile__label">Stint Length</div>
          <div className="stat-tile__value text-mono">{lapAge}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>laps since last change</div>
        </div>
      </div>

      {/* ── Degradation chart ────────────────────────────────────────────── */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Performance Degradation Model</span>
          <div className="flex items-center gap-3">
            {COMPOUNDS.map(c => (
              <span key={c.id} className="flex items-center gap-1" style={{ fontSize: 12 }}>
                <span style={{ display: 'inline-block', width: 12, height: 3, background: c.color, borderRadius: 2 }} />
                {c.name}
              </span>
            ))}
          </div>
        </div>
        <div className="card-body">
          <svg width="100%" height="120" viewBox="0 0 620 120" preserveAspectRatio="xMidYMid meet">
            {/* Axes */}
            <line x1="20" y1="100" x2="600" y2="100" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            <line x1="20" y1="10" x2="20" y2="100" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
            {/* Grid lines */}
            {[25, 50, 75].map(pct => (
              <g key={pct}>
                <line x1="20" y1={100 - (pct / 100) * 90} x2="600" y2={100 - (pct / 100) * 90} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
                <text x="14" y={104 - (pct / 100) * 90} fill="#535A6E" fontSize="9" textAnchor="end" fontFamily="JetBrains Mono,monospace">{pct}</text>
              </g>
            ))}
            {/* Lap axis labels */}
            {[0, 6, 12, 18, 24].map(lap => (
              <text key={lap} x={20 + (lap / 24) * 580} y="112" fill="#535A6E" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono,monospace">L{lap}</text>
            ))}
            <g transform="translate(20, 10)">
              {COMPOUNDS.map(c => (
                <DegCurve key={c.id} color={c.color} wearRate={c.wearRate} laps={lapAge} />
              ))}
              {/* Current lap marker */}
              <line x1={(lapAge / 24) * 580} y1="0" x2={(lapAge / 24) * 580} y2="90" stroke="white" strokeWidth="1.5" />
              <text x={(lapAge / 24) * 580 + 3} y="15" fill="white" fontSize="9" fontFamily="JetBrains Mono,monospace">NOW</text>
            </g>
          </svg>
        </div>
      </div>

      {/* ── Compound comparison ──────────────────────────────────────────── */}
      <div className="grid-3 mb-4">
        {COMPOUNDS.map(c => (
          <div key={c.id} className="card">
            <div className="card-header">
              <span className="card-title flex items-center gap-2">
                {/* Color dot instead of a full borderTop — tasteful, not slop */}
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: c.color, flexShrink: 0, display: 'inline-block' }} />
                {c.name}
              </span>
              {t.rearCompound === c.id && <span className="badge badge-orange">FITTED</span>}
            </div>
            <div className="card-body flex-col gap-3" style={{ gap: 12 }}>
              {[
                { label: 'Wear Rate',       value: `${c.wearRate}% / lap` },
                { label: 'Peak Grip',       value: `${c.grip}%` },
                { label: 'Optimal Window',  value: `Lap ${c.optWindow}` },
                { label: 'Heat-up Time',    value: c.heatUp },
              ].map(p => (
                <div key={p.label} className="flex items-center justify-between">
                  <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.label}</span>
                  <span className="text-mono" style={{ fontSize: 13, fontWeight: 600 }}>{p.value}</span>
                </div>
              ))}
              <div className="divider" />
              <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>{c.note}</p>
            </div>
          </div>
        ))}
      </div>

      {/* ── Pit strategy recommendation ──────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">AI Pit Strategy — KDD Recommendation</span>
          <span className="badge badge-green">Optimal</span>
        </div>
        <div className="card-body">
          <div className="grid-3" style={{ gridTemplateColumns: '2fr 1fr 1fr' }}>
            <div>
              <div className="card-label" style={{ marginBottom: 8 }}>Recommended Strategy</div>
              <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
                1-Stop · Pit Lap {optimalPitLap} → Hard Rear
              </div>
              <p style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>
                Current soft degradation model predicts grip cliff at Lap {lapAge + 4}.
                Switching to Hard rear at L{optimalPitLap} gives +{23 - optimalPitLap} laps of stable pace.
                Projected finish: <strong>P2–P3</strong>.
              </p>
            </div>
            <div>
              <div className="card-label" style={{ marginBottom: 8 }}>Alternative</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--yellow)', marginBottom: 4 }}>2-Stop · L9 + L17</div>
              <p style={{ fontSize: 12, color: 'var(--text-dim)' }}>Higher risk, better pace. Depends on safety car window.</p>
            </div>
            <div>
              <div className="card-label" style={{ marginBottom: 8 }}>Time Loss (pit)</div>
              <div className="text-mono" style={{ fontSize: 24, fontWeight: 700, color: 'var(--accent)' }}>–22.4s</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Pit lane delta</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
