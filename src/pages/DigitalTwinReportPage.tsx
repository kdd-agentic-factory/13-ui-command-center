import { useMemo, useState, useCallback } from 'react';
import { GitBranch, Play, TrendingUp, Loader2, BarChart2, Target } from 'lucide-react';
import { useLiveTelemetry } from '../hooks/useLiveTelemetry';
import { useToast } from '../components/ToastProvider';

// ── Types & constants ─────────────────────────────────────────────────────────

interface Scenario {
  id: string;
  name: string;
  desc: string;
  lapTime: string;
  pitLap: number;
  pitLap2?: number;
  finish: string;
  totalTime: string;
  fuelUsed: string;
  rearWear: string;
  color: string;
  winProb: number;
  podiumProb: number;
  points: number;
}

const BASE_SCENARIOS: Scenario[] = [
  {
    id: 'baseline',   name: 'Race Baseline',     color: '#3B82F6',
    desc: 'Current setup · Lap 7 pace projection',
    lapTime: '1:33.41', pitLap: 11,             finish: 'P3',
    totalTime: '1:28:14.2', fuelUsed: '19.8 kg', rearWear: '78%',
    winProb: 8,  podiumProb: 52, points: 16,
  },
  {
    id: 'early-pit',  name: 'Early Pit L9 → Hard', color: '#22C55E',
    desc: '2 laps earlier · Hard rear for 14 laps',
    lapTime: '1:33.68', pitLap: 9,              finish: 'P3–P4',
    totalTime: '1:28:31.4', fuelUsed: '19.8 kg', rearWear: '42%',
    winProb: 5,  podiumProb: 41, points: 13,
  },
  {
    id: 'late-pit',   name: 'Late Pit L13 → Hard', color: '#F59E0B',
    desc: 'Extend stint · Risk rear cliff',
    lapTime: '1:34.12', pitLap: 13,             finish: 'P2–P4',
    totalTime: '1:28:09.8', fuelUsed: '19.8 kg', rearWear: '95%',
    winProb: 14, podiumProb: 48, points: 15,
  },
  {
    id: '2stop',      name: '2-Stop L9 + L17',    color: '#E03737',
    desc: 'Aggressive · Needs SC window',
    lapTime: '1:32.88', pitLap: 9, pitLap2: 17, finish: 'P1–P5',
    totalTime: '1:28:02.1', fuelUsed: '19.8 kg', rearWear: '55%',
    winProb: 22, podiumProb: 38, points: 14,
  },
];

// Per-lap raw time data (seconds) per scenario, 23 laps
const SCENARIO_LAPS: Record<string, number[]> = {
  'baseline':  [93.1,93.3,93.4,93.4,93.5,93.6,93.4,93.7,94.0,94.4,95.1,93.8,93.5,93.6,93.7,93.9,94.0,94.2,94.5,94.8,95.0,95.2,95.4],
  'early-pit': [93.1,93.3,93.4,93.4,93.5,93.6,93.4,93.7,94.8,94.0,93.8,93.7,93.7,93.8,93.9,94.0,94.1,94.2,94.3,94.4,94.6,94.7,94.9],
  'late-pit':  [93.1,93.3,93.4,93.4,93.5,93.6,93.4,93.7,93.9,94.2,94.6,95.2,96.1,94.0,93.6,93.7,93.8,94.0,94.2,94.5,94.8,95.0,95.2],
  '2stop':     [92.9,93.0,93.1,93.2,93.2,93.3,93.2,93.5,94.6,93.0,92.9,93.0,93.1,93.3,93.5,93.8,95.0,93.2,93.0,93.1,93.2,93.4,93.6],
};

// KDD gradient-boosting feature importance
const FEATURE_IMPORTANCE = [
  { name: 'Rear Tyre Temp',   imp: 0.242, color: '#F59E0B' },
  { name: 'Lap Age (Rear)',   imp: 0.198, color: '#F59E0B' },
  { name: 'Fuel Load',        imp: 0.154, color: '#FB923C' },
  { name: 'Sector 3 Speed',   imp: 0.121, color: '#3B82F6' },
  { name: 'Engine Map',       imp: 0.089, color: '#22C55E' },
  { name: 'Lean Angle Avg',   imp: 0.072, color: '#A78BFA' },
  { name: 'TC Interventions', imp: 0.063, color: '#A78BFA' },
  { name: 'Brake Balance',    imp: 0.044, color: '#38BDF8' },
  { name: 'Ambient Temp',     imp: 0.017, color: '#6B7280' },
];

// ── Multi-Scenario Lap Time Chart ─────────────────────────────────────────────

function MultiScenarioChart({
  scenarios, currentLap, activeId,
}: {
  scenarios: Scenario[];
  currentLap: number;
  activeId: string;
}) {
  const W = 680; const H = 150;
  const P = { t: 18, r: 16, b: 26, l: 44 };
  const cw = W - P.l - P.r;
  const ch = H - P.t - P.b;
  const LAPS = 23;
  const minT = 92.0; const maxT = 97.0;

  const xOf = (lap: number) => P.l + ((lap - 1) / (LAPS - 1)) * cw;
  const yOf = (t: number)   => P.t + ch - ((t - minT) / (maxT - minT)) * ch;
  const curX = xOf(Math.min(currentLap, LAPS));

  const yTicks = [93, 94, 95, 96, 97];
  const xTicks = [1, 5, 9, 11, 13, 17, 23];

  // Confidence band for active scenario (±0.25s)
  const activeSc = scenarios.find(s => s.id === activeId);
  const activeLaps = activeSc ? SCENARIO_LAPS[activeSc.id] : [];

  return (
    <svg
      width="100%" height={H + 4}
      viewBox={`0 0 ${W} ${H + 4}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: 'block' }}
    >
      {/* Y-axis grid */}
      {yTicks.map(t => {
        const y = yOf(t);
        const sec = t % 60;
        return (
          <g key={t}>
            <line x1={P.l} y1={y} x2={W - P.r} y2={y}
              stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={P.l - 6} y={y + 3} textAnchor="end"
              fill="#535A6E" fontSize="8" fontFamily="JetBrains Mono,monospace">
              :{sec.toFixed(0).padStart(2, '0')}
            </text>
          </g>
        );
      })}

      {/* X-axis labels */}
      {xTicks.map(l => (
        <text key={l} x={xOf(l)} y={H - 2} textAnchor="middle"
          fill="#535A6E" fontSize="8" fontFamily="JetBrains Mono,monospace">
          L{l}
        </text>
      ))}
      <text x={P.l - 6} y={P.t - 4} fill="#535A6E" fontSize="7"
        textAnchor="end" fontFamily="JetBrains Mono,monospace">1:m</text>

      {/* Confidence band for active scenario */}
      {activeSc && activeLaps.length > 0 && (() => {
        const topPts = activeLaps.map((t, i) =>
          `${xOf(i + 1)},${yOf(t - 0.25)}`).join(' ');
        const botPts = [...activeLaps].reverse().map((t, ri) =>
          `${xOf(activeLaps.length - ri)},${yOf(t + 0.25)}`).join(' ');
        return (
          <polygon
            points={`${topPts} ${botPts}`}
            fill={activeSc.color} opacity="0.07"
          />
        );
      })()}

      {/* Inactive scenario lines first */}
      {scenarios.filter(sc => sc.id !== activeId).map(sc => {
        const laps = SCENARIO_LAPS[sc.id];
        const pts = laps.map((t, i) => `${xOf(i + 1)},${yOf(t)}`).join(' ');
        return (
          <g key={sc.id}>
            {[sc.pitLap, sc.pitLap2 ?? null].filter((x): x is number => x !== null).map(pl => (
              <line key={pl}
                x1={xOf(pl)} y1={P.t} x2={xOf(pl)} y2={H - P.b}
                stroke={sc.color} strokeWidth="1"
                strokeDasharray="3,3" opacity="0.25"
              />
            ))}
            <polyline points={pts} fill="none"
              stroke={sc.color} strokeWidth="1"
              opacity="0.28" strokeLinejoin="round" />
          </g>
        );
      })}

      {/* Active scenario line (on top) */}
      {activeSc && (() => {
        const laps = SCENARIO_LAPS[activeSc.id];
        const pts = laps.map((t, i) => `${xOf(i + 1)},${yOf(t)}`).join(' ');
        return (
          <g>
            {[activeSc.pitLap, activeSc.pitLap2 ?? null]
              .filter((x): x is number => x !== null)
              .map(pl => (
                <g key={pl}>
                  <line x1={xOf(pl)} y1={P.t} x2={xOf(pl)} y2={H - P.b}
                    stroke={activeSc.color} strokeWidth="1.2"
                    strokeDasharray="4,3" opacity="0.8" />
                  <text x={xOf(pl) + 3} y={P.t + 9}
                    fill={activeSc.color} fontSize="7"
                    fontFamily="JetBrains Mono,monospace">
                    PIT
                  </text>
                </g>
              ))}
            <polyline points={pts} fill="none"
              stroke={activeSc.color} strokeWidth="2.2"
              opacity="1" strokeLinejoin="round" />
          </g>
        );
      })()}

      {/* Current lap marker */}
      <line x1={curX} y1={P.t} x2={curX} y2={H - P.b}
        stroke="var(--accent)" strokeWidth="1.5" opacity="0.9" />
      <text x={curX + 3} y={P.t + 8} fill="var(--accent)"
        fontSize="7" fontFamily="JetBrains Mono,monospace">
        NOW
      </text>
    </svg>
  );
}

// ── Feature Importance Chart ──────────────────────────────────────────────────

function FeatureImportanceChart() {
  const maxImp = FEATURE_IMPORTANCE[0].imp;
  return (
    <div>
      {FEATURE_IMPORTANCE.map((f, i) => (
        <div key={f.name} style={{ marginBottom: 7 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginBottom: 3,
          }}>
            <span style={{
              fontSize: 11,
              color: i < 3 ? 'var(--text)' : 'var(--text-muted)',
              fontWeight: i < 3 ? 600 : 400,
            }}>
              {f.name}
            </span>
            <span style={{
              fontSize: 10, fontFamily: 'JetBrains Mono,monospace',
              color: f.color, fontWeight: 700,
            }}>
              {(f.imp * 100).toFixed(1)}%
            </span>
          </div>
          <div className="bar-track" style={{ height: 5 }}>
            <div className="bar-fill" style={{
              width: `${(f.imp / maxImp) * 100}%`,
              background: f.color,
              opacity: i < 3 ? 1 : 0.55,
              transition: 'width 0.6s cubic-bezier(0.16,1,0.3,1)',
            }} />
          </div>
        </div>
      ))}
      <div style={{
        marginTop: 12, padding: '8px 10px',
        background: 'rgba(59,130,246,0.06)',
        border: '1px solid rgba(59,130,246,0.15)',
        borderRadius: 6,
        fontSize: 10, color: 'var(--text-muted)',
        fontFamily: 'JetBrains Mono,monospace',
        lineHeight: 1.5,
      }}>
        48 total features · SHAP values · GBM ensemble
      </div>
    </div>
  );
}

// ── Outcome Probability Panel ─────────────────────────────────────────────────

function OutcomeProbPanel({
  scenarios, activeId, onSelect,
}: {
  scenarios: Scenario[];
  activeId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      {scenarios.map(s => (
        <div
          key={s.id}
          onClick={() => onSelect(s.id)}
          style={{
            marginBottom: 14, cursor: 'pointer',
            opacity: s.id === activeId ? 1 : 0.55,
            transition: 'opacity 0.2s',
          }}
        >
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginBottom: 4,
          }}>
            <span style={{
              fontSize: 11,
              fontWeight: s.id === activeId ? 700 : 400,
              color: s.id === activeId ? s.color : 'var(--text-muted)',
            }}>
              {s.name}
            </span>
            <span style={{
              fontSize: 10, fontFamily: 'JetBrains Mono,monospace',
              color: 'var(--text-muted)',
            }}>
              P1: {s.winProb}% · Podium: {s.podiumProb}%
            </span>
          </div>
          {/* Stacked probability bar */}
          <div style={{
            display: 'flex', height: 7, borderRadius: 4,
            overflow: 'hidden', background: 'rgba(255,255,255,0.04)',
          }}>
            <div style={{
              width: `${s.winProb}%`, background: s.color,
              transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)',
            }} />
            <div style={{
              width: `${s.podiumProb - s.winProb}%`,
              background: s.color, opacity: 0.4,
              transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)',
            }} />
          </div>
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            marginTop: 2,
          }}>
            <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
              {s.points} pts expected
            </span>
            <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
              {s.finish} proj.
            </span>
          </div>
        </div>
      ))}
      <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
        {[
          { label: 'P1 win',    opacity: 1   },
          { label: 'Podium',    opacity: 0.4 },
        ].map(l => (
          <span key={l.label} style={{
            display: 'flex', alignItems: 'center', gap: 5,
            fontSize: 10, color: 'var(--text-muted)',
          }}>
            <span style={{
              display: 'inline-block', width: 12, height: 6,
              borderRadius: 2, background: '#888', opacity: l.opacity,
            }} />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function DigitalTwinReportPage() {
  const telem = useLiveTelemetry();
  const { toast } = useToast();
  const [activeScenario, setActiveScenario] = useState('baseline');
  const [simulating, setSimulating]         = useState(false);
  const [scenarios, setScenarios]           = useState<Scenario[]>(BASE_SCENARIOS);
  const [lastSimLap, setLastSimLap]         = useState<number | null>(null);

  const scenario   = scenarios.find(s => s.id === activeScenario)!;
  const currentLap = telem.lapCount;

  // Baseline race time for comparison delta
  const baselineTotal = useMemo(() => {
    const bs = scenarios.find(s => s.id === 'baseline');
    return bs ? parseTotalTime(bs.totalTime) : 0;
  }, [scenarios]);

  // ── Re-run Sim ──────────────────────────────────────────────────────────────
  const handleRerunSim = useCallback(async () => {
    if (simulating) return;
    setSimulating(true);
    toast({ type: 'info', title: 'Simulation started',
      message: `Running 23-lap KDD model from Lap ${currentLap}…` });

    await new Promise<void>(res => setTimeout(res, 1200));

    const variation = (Math.random() - 0.5) * 0.4;
    setScenarios(prev =>
      prev.map(s => ({
        ...s,
        lapTime: formatLapTime(parseLapTime(s.lapTime) + variation),
      }))
    );
    setLastSimLap(currentLap);
    setSimulating(false);

    toast({
      type: 'success',
      title: 'Simulation complete',
      message: `23-lap model updated from Lap ${currentLap}. Δ ${variation >= 0 ? '+' : ''}${variation.toFixed(3)}s.`,
    });
  }, [simulating, currentLap, toast]);

  return (
    <div className="page">

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Digital Twin Report</h1>
          <p className="page-subtitle">Race simulation · What-if scenarios · Lap time model · KDD degradation prediction</p>
        </div>
        <div className="flex items-center gap-2">
          <GitBranch size={14} style={{ color: 'var(--blue)' }} />
          <span className="badge badge-blue">4 scenarios loaded</span>
          {lastSimLap !== null && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
              last sim: L{lastSimLap}
            </span>
          )}
        </div>
      </div>

      {/* ── Scenario selector cards ──────────────────────────────────────────── */}
      <div className="grid-4 mb-4">
        {scenarios.map(s => (
          <div
            key={s.id}
            className="twin-scenario"
            style={activeScenario === s.id
              ? { borderColor: s.color, background: `${s.color}14` }
              : {}}
            onClick={() => setActiveScenario(s.id)}
          >
            <div>
              <div style={{
                fontWeight: 700, fontSize: 13, marginBottom: 2,
                color: activeScenario === s.id ? s.color : 'var(--text)',
              }}>
                {s.name}
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.desc}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="text-mono" style={{
                fontSize: 15, fontWeight: 700,
                color: activeScenario === s.id ? s.color : 'var(--text)',
              }}>
                {s.finish}
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                Win {s.winProb}%
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 2: Sim results + Multi-scenario chart ────────────────────────── */}
      <div className="grid-2 mb-4">

        <div className="card">
          <div className="card-header">
            <span className="card-title">{scenario.name} — Sim Results</span>
            <button
              className="btn btn-primary btn-sm flex items-center gap-2"
              style={{ fontSize: 12 }}
              onClick={handleRerunSim}
              disabled={simulating}
            >
              {simulating
                ? <><Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} />Running…</>
                : <><Play size={12} />Re-run Sim</>
              }
            </button>
          </div>
          <div className="card-body">
            <div className="grid-3" style={{ marginBottom: 20 }}>
              {[
                { label: 'Best Lap',       value: scenario.lapTime,   color: 'var(--text)' },
                { label: 'Pit Lap',        value: `L${scenario.pitLap}${scenario.pitLap2 ? ` + L${scenario.pitLap2}` : ''}`, color: 'var(--yellow)' },
                { label: 'Proj. Finish',   value: scenario.finish,    color: scenario.color },
                { label: 'Race Time',      value: scenario.totalTime, color: 'var(--text)' },
                { label: 'Fuel Consumed',  value: scenario.fuelUsed,  color: 'var(--orange)' },
                { label: 'Rear Tyre End',  value: scenario.rearWear,  color: parseFloat(scenario.rearWear) > 85 ? 'var(--accent)' : 'var(--green)' },
              ].map(m => (
                <div key={m.label} style={{ opacity: simulating ? 0.5 : 1, transition: 'opacity 300ms ease' }}>
                  <div className="card-label">{m.label}</div>
                  <div className="text-mono" style={{ fontSize: 17, fontWeight: 700, color: m.color }}>{m.value}</div>
                </div>
              ))}
            </div>
            {/* Vs baseline delta */}
            {activeScenario !== 'baseline' && (() => {
              const thisSec  = parseTotalTime(scenario.totalTime);
              const deltaMs  = (thisSec - baselineTotal) * 1000;
              const isFaster = deltaMs < 0;
              return (
                <div style={{
                  padding: '8px 12px',
                  background: isFaster ? 'rgba(34,197,94,0.08)' : 'rgba(224,55,55,0.08)',
                  border: `1px solid ${isFaster ? 'rgba(34,197,94,0.25)' : 'rgba(224,55,55,0.25)'}`,
                  borderRadius: 6,
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    vs Baseline race time
                  </span>
                  <span className="text-mono" style={{
                    fontSize: 14, fontWeight: 700,
                    color: isFaster ? 'var(--green)' : 'var(--accent)',
                  }}>
                    {isFaster ? '' : '+'}{(deltaMs / 1000).toFixed(1)}s
                  </span>
                </div>
              );
            })()}
            {simulating && (
              <div style={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--border-mid)',
                borderRadius: 6, padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 10,
                marginTop: 12,
              }}>
                <Loader2 size={16} style={{
                  color: 'var(--blue)',
                  animation: 'spin 0.8s linear infinite', flexShrink: 0,
                }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                    KDD Pipeline running…
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                    23-lap model · 48 features · gradient boosting
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">All-Scenario Lap Time Overlay</span>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {scenarios.map(s => (
                <span key={s.id} style={{
                  display: 'flex', alignItems: 'center', gap: 4,
                  fontSize: 9, fontFamily: 'JetBrains Mono,monospace',
                  color: activeScenario === s.id ? s.color : 'var(--text-muted)',
                  fontWeight: activeScenario === s.id ? 700 : 400,
                  cursor: 'pointer',
                }}
                  onClick={() => setActiveScenario(s.id)}
                >
                  <span style={{
                    display: 'inline-block', width: 14,
                    height: activeScenario === s.id ? 2.5 : 1.5,
                    background: s.color, borderRadius: 2,
                    opacity: activeScenario === s.id ? 1 : 0.45,
                  }} />
                  {s.name.replace(' → Hard', '')}
                </span>
              ))}
            </div>
          </div>
          <div style={{ background: 'var(--bg-surface)', padding: '8px 6px 0' }}>
            <MultiScenarioChart
              scenarios={scenarios}
              currentLap={currentLap}
              activeId={activeScenario}
            />
          </div>
          <div className="card-body" style={{ padding: '8px 16px' }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
              Shaded band = ±0.25s confidence interval · Dashed = pit stop · Bold = active scenario
            </span>
          </div>
        </div>
      </div>

      {/* ── Row 3: Feature importance + Outcome probability ──────────────────── */}
      <div className="grid-2 mb-4">

        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2">
              <BarChart2 size={13} />KDD Feature Importance
            </span>
            <span className="badge badge-blue">GBM · 48 vars</span>
          </div>
          <div className="card-body">
            <FeatureImportanceChart />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2">
              <Target size={13} />Outcome Probability Model
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
              Monte Carlo · 5000 runs
            </span>
          </div>
          <div className="card-body">
            <OutcomeProbPanel
              scenarios={scenarios}
              activeId={activeScenario}
              onSelect={setActiveScenario}
            />
          </div>
        </div>
      </div>

      {/* ── Scenario comparison table ────────────────────────────────────────── */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Scenario Comparison Matrix</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>click row to activate</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Scenario</th><th>Pit Lap(s)</th>
              <th>Best Lap</th><th>Race Δ</th>
              <th>Rear Wear</th><th>Projected</th>
              <th>Win %</th><th>Risk</th>
            </tr>
          </thead>
          <tbody>
            {scenarios.map(s => {
              const deltaS   = parseTotalTime(s.totalTime) - baselineTotal;
              const isFaster = deltaS < 0;
              return (
                <tr
                  key={s.id}
                  onClick={() => setActiveScenario(s.id)}
                  style={{
                    cursor: 'pointer',
                    background: activeScenario === s.id ? `${s.color}14` : 'transparent',
                  }}
                >
                  <td style={{ fontWeight: 600, color: activeScenario === s.id ? s.color : 'var(--text)' }}>
                    {s.name}
                  </td>
                  <td className="mono">
                    L{s.pitLap}{s.pitLap2 ? ` + L${s.pitLap2}` : ''}
                  </td>
                  <td className="mono">{s.lapTime}</td>
                  <td className="mono" style={{ color: isFaster ? 'var(--green)' : s.id === 'baseline' ? 'var(--text-muted)' : 'var(--accent)' }}>
                    {s.id === 'baseline' ? 'REF' : `${isFaster ? '' : '+'}${deltaS.toFixed(1)}s`}
                  </td>
                  <td className="mono" style={{ color: parseFloat(s.rearWear) > 85 ? 'var(--accent)' : 'var(--green)' }}>
                    {s.rearWear}
                  </td>
                  <td style={{ fontWeight: 700, color: s.color }}>{s.finish}</td>
                  <td className="mono" style={{ color: s.color }}>{s.winProb}%</td>
                  <td>
                    <span className={`badge ${s.id === '2stop' ? 'badge-red' : s.id === 'late-pit' ? 'badge-yellow' : 'badge-green'}`}>
                      {s.id === '2stop' ? 'HIGH' : s.id === 'late-pit' ? 'MED' : 'LOW'}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── KDD model insights ────────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title flex items-center gap-2">
            <TrendingUp size={14} />KDD Model Insights — Digital Twin v2.1
          </span>
        </div>
        <div className="card-body">
          <div className="grid-3">
            {[
              {
                title: 'Tyre Model: GPTQ-INT4 Quantized',
                color: 'var(--blue)',
                text: 'Degradation prediction using quantized neural model. 94.2% accuracy vs physical model on 847 race samples. –18% VRAM, –22% inference time vs FP32 baseline.',
              },
              {
                title: 'SIMP Topology: Swingarm Optimized',
                color: 'var(--green)',
                text: 'FEA-validated SIMP optimization reduced swingarm mass by 22.4% (4.9 → 3.8 kg). Von Mises stress within safety factor 2.81. Convergence: 847 iterations.',
              },
              {
                title: 'Race Pace KDD Pipeline',
                color: 'var(--cyan)',
                text: `23-lap simulation completes in 1.2s. Feature extraction: 48 variables. Mining: gradient boosting ensemble. Interpretation: lap time delta per setup change. Last run: L${lastSimLap ?? currentLap}.`,
              },
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

// ── Helpers ───────────────────────────────────────────────────────────────────

function parseLapTime(lapTime: string): number {
  const [mStr, sStr] = lapTime.split(':');
  return parseInt(mStr, 10) * 60 + parseFloat(sStr);
}

function formatLapTime(totalSeconds: number): string {
  const m = Math.floor(totalSeconds / 60);
  const s = (totalSeconds % 60).toFixed(2).padStart(5, '0');
  return `${m}:${s}`;
}

function parseTotalTime(totalTime: string): number {
  // Format: "1:28:14.2"
  const parts = totalTime.split(':');
  if (parts.length === 3) {
    return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseFloat(parts[2]);
  }
  return 0;
}
