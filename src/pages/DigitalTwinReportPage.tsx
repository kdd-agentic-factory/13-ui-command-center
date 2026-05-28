import { useState } from 'react';
import { GitBranch, Play, TrendingUp } from 'lucide-react';

const SCENARIOS = [
  {
    id: 'baseline',
    name: 'Race Baseline',
    desc: 'Current setup · Lap 7 pace projection',
    lapTime: '1:33.41',
    pitLap: 11,
    finish: 'P3',
    totalTime: '1:28:14.2',
    fuelUsed: '19.8 kg',
    rearWear: '78%',
    active: true,
  },
  {
    id: 'early-pit',
    name: 'Early Pit L9 → Hard',
    desc: '2 laps earlier · Hard rear for 14 laps',
    lapTime: '1:33.68',
    pitLap: 9,
    finish: 'P3–P4',
    totalTime: '1:28:31.4',
    fuelUsed: '19.8 kg',
    rearWear: '42%',
    active: false,
  },
  {
    id: 'late-pit',
    name: 'Late Pit L13 → Hard',
    desc: 'Extend stint · Risk rear cliff',
    lapTime: '1:34.12',
    pitLap: 13,
    finish: 'P2–P4',
    totalTime: '1:28:09.8',
    fuelUsed: '19.8 kg',
    rearWear: '95%',
    active: false,
  },
  {
    id: '2stop',
    name: '2-Stop L9 + L17',
    desc: 'Aggressive · Needs SC window',
    lapTime: '1:32.88',
    pitLap: 9,
    finish: 'P1–P5',
    totalTime: '1:28:02.1',
    fuelUsed: '19.8 kg',
    rearWear: '55%',
    active: false,
  },
];

const LAP_TIME_MODEL = [
  { lap: 1,  time: 93.1 }, { lap: 2,  time: 93.3 }, { lap: 3,  time: 93.4 },
  { lap: 4,  time: 93.4 }, { lap: 5,  time: 93.5 }, { lap: 6,  time: 93.6 },
  { lap: 7,  time: 93.4 }, { lap: 8,  time: 93.7 }, { lap: 9,  time: 94.0 },
  { lap: 10, time: 94.4 }, { lap: 11, time: 95.1 }, { lap: 12, time: 93.8 }, // pit
  { lap: 13, time: 93.5 }, { lap: 14, time: 93.6 }, { lap: 15, time: 93.7 },
  { lap: 16, time: 93.9 }, { lap: 17, time: 94.0 }, { lap: 18, time: 94.2 },
  { lap: 19, time: 94.5 }, { lap: 20, time: 94.8 }, { lap: 21, time: 95.0 },
  { lap: 22, time: 95.2 }, { lap: 23, time: 95.4 },
];

function LapTimeChart({ currentLap }: { currentLap: number }) {
  const w = 600; const h = 80;
  const minT = 92; const maxT = 97;
  const pts = LAP_TIME_MODEL.map((d, i) => {
    const x = (i / (LAP_TIME_MODEL.length - 1)) * w;
    const y = h - ((d.time - minT) / (maxT - minT)) * h;
    return `${x},${y}`;
  }).join(' ');
  const curX = ((currentLap - 1) / (LAP_TIME_MODEL.length - 1)) * w;
  const pitX = (10 / (LAP_TIME_MODEL.length - 1)) * w;

  return (
    <svg width="100%" height={h + 20} viewBox={`0 0 ${w} ${h + 20}`} preserveAspectRatio="none" style={{ display: 'block' }}>
      {/* Pit stop line */}
      <line x1={pitX} y1="0" x2={pitX} y2={h} stroke="var(--yellow)" strokeWidth="1.5" strokeDasharray="4,3" />
      <text x={pitX + 4} y="12" fill="var(--yellow)" fontSize="9" fontFamily="JetBrains Mono,monospace">PIT L11</text>
      {/* Current lap */}
      <line x1={curX} y1="0" x2={curX} y2={h} stroke="var(--accent)" strokeWidth="1.5" />
      {/* Baseline trace */}
      <polyline points={pts} fill="none" stroke="var(--blue)" strokeWidth="1.5" opacity="0.8" />
      {/* Lap axis */}
      {[1, 6, 11, 16, 23].map(l => (
        <text key={l} x={((l - 1) / (LAP_TIME_MODEL.length - 1)) * w} y={h + 14} fill="#535A6E" fontSize="9" textAnchor="middle" fontFamily="JetBrains Mono,monospace">L{l}</text>
      ))}
    </svg>
  );
}

export function DigitalTwinReportPage() {
  const [activeScenario, setActiveScenario] = useState('baseline');
  const scenario = SCENARIOS.find(s => s.id === activeScenario)!;
  const currentLap = 7;

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Digital Twin Report</h1>
          <p className="page-subtitle">Race simulation · What-if scenarios · Lap time model · Degradation prediction</p>
        </div>
        <div className="flex items-center gap-2">
          <GitBranch size={14} style={{ color: 'var(--blue)' }} />
          <span className="badge badge-blue">4 scenarios loaded</span>
        </div>
      </div>

      {/* ── Scenario selector ─────────────────────────────────────────────── */}
      <div className="grid-4 mb-4">
        {SCENARIOS.map(s => (
          <div
            key={s.id}
            className="twin-scenario"
            style={activeScenario === s.id ? { borderColor: 'var(--accent)', background: 'var(--accent-dim)' } : {}}
            onClick={() => setActiveScenario(s.id)}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 2 }}>{s.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.desc}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="text-mono" style={{ fontSize: 15, fontWeight: 700 }}>{s.finish}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>proj. finish</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Scenario detail ───────────────────────────────────────────────── */}
      <div className="grid-2 mb-4">

        <div className="card">
          <div className="card-header">
            <span className="card-title">{scenario.name} — Simulation Results</span>
            <button className="btn btn-primary btn-sm flex items-center gap-2" style={{ fontSize: 12 }}>
              <Play size={12} />
              Re-run Sim
            </button>
          </div>
          <div className="card-body">
            <div className="grid-3" style={{ marginBottom: 20 }}>
              {[
                { label: 'Best Lap Time',    value: scenario.lapTime, color: 'var(--text)' },
                { label: 'Pit Lap',          value: `L${scenario.pitLap}`, color: 'var(--yellow)' },
                { label: 'Projected Finish', value: scenario.finish,  color: 'var(--accent)' },
                { label: 'Total Race Time',  value: scenario.totalTime, color: 'var(--text)' },
                { label: 'Fuel Consumed',    value: scenario.fuelUsed, color: 'var(--orange)' },
                { label: 'Rear Tyre End',    value: scenario.rearWear, color: parseFloat(scenario.rearWear) > 85 ? 'var(--accent)' : 'var(--green)' },
              ].map(m => (
                <div key={m.label}>
                  <div className="card-label">{m.label}</div>
                  <div className="text-mono" style={{ fontSize: 18, fontWeight: 700, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Lap Time Prediction Model</span></div>
          <div style={{ background: 'var(--bg-surface)', padding: '8px 8px 0' }}>
            <LapTimeChart currentLap={currentLap} />
          </div>
          <div className="card-body">
            <div className="flex items-center gap-4" style={{ gap: 16 }}>
              <span className="flex items-center gap-2" style={{ fontSize: 12 }}>
                <span style={{ display: 'inline-block', width: 16, height: 2, background: 'var(--blue)' }} />
                Baseline pace
              </span>
              <span className="flex items-center gap-2" style={{ fontSize: 12 }}>
                <span style={{ display: 'inline-block', width: 16, height: 2, background: 'var(--accent)' }} />
                Current lap
              </span>
              <span className="flex items-center gap-2" style={{ fontSize: 12 }}>
                <span style={{ display: 'inline-block', width: 16, height: 2, background: 'var(--yellow)', borderTop: '2px dashed var(--yellow)' }} />
                Pit window
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Comparison table ──────────────────────────────────────────────── */}
      <div className="card mb-4">
        <div className="card-header"><span className="card-title">Scenario Comparison Matrix</span></div>
        <table className="data-table">
          <thead>
            <tr><th>Scenario</th><th>Pit Lap</th><th>Best Lap</th><th>Race Time</th><th>Rear Wear</th><th>Projected</th><th>Risk</th></tr>
          </thead>
          <tbody>
            {SCENARIOS.map(s => (
              <tr
                key={s.id}
                onClick={() => setActiveScenario(s.id)}
                style={{ cursor: 'pointer', background: activeScenario === s.id ? 'var(--accent-dim)' : 'transparent' }}
              >
                <td style={{ fontWeight: 600 }}>{s.name}</td>
                <td className="mono">L{s.pitLap}</td>
                <td className="mono">{s.lapTime}</td>
                <td className="mono">{s.totalTime}</td>
                <td className="mono" style={{ color: parseFloat(s.rearWear) > 85 ? 'var(--accent)' : 'var(--green)' }}>{s.rearWear}</td>
                <td style={{ fontWeight: 700, color: 'var(--accent)' }}>{s.finish}</td>
                <td>
                  <span className={`badge ${s.id === '2stop' ? 'badge-red' : s.id === 'late-pit' ? 'badge-yellow' : 'badge-green'}`}>
                    {s.id === '2stop' ? 'HIGH' : s.id === 'late-pit' ? 'MED' : 'LOW'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── KDD model insights ────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title flex items-center gap-2"><TrendingUp size={14} />KDD Model Insights — Digital Twin v2.1</span>
        </div>
        <div className="card-body">
          <div className="grid-3">
            {[
              { title: 'Tyre Model: GPTQ-INT4 Quantized', color: 'var(--blue)', text: 'Degradation prediction using quantized neural model. 94.2% accuracy vs physical model on 847 race samples. –18% VRAM, –22% inference time vs FP32 baseline.' },
              { title: 'SIMP Topology: Swingarm Optimized', color: 'var(--green)', text: 'FEA-validated SIMP optimization reduced swingarm mass by 22.4% (4.9 → 3.8 kg). Von Mises stress within safety factor 2.81. Convergence: 847 iterations.' },
              { title: 'Race Pace KDD Pipeline', color: 'var(--cyan)', text: '23-lap simulation completes in 1.2s. Feature extraction: 48 variables. Mining: gradient boosting ensemble. Interpretation: lap time delta per setup change.' },
            ].map(i => (
              <div key={i.title} className="insight-panel" style={{ ['--dot-color' as string]: i.color }}>
                <div className="insight-panel__title" style={{ color: i.color }}>{i.title}</div>
                <p className="insight-panel__body">{i.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
