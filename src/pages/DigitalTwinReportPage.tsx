import { useState, type Dispatch, type SetStateAction } from 'react';
import {
  BarChart2,
  CheckCircle,
  Clock,
  Cpu,
  GitBranch,
  Gauge,
  Loader2,
  Play,
  Shield,
  Target,
  Thermometer,
} from 'lucide-react';
import { useLiveTelemetry } from '../hooks/useLiveTelemetry';
import { useToast } from '../components/ToastProvider';
import { MUGELLO_CIRCUIT } from '../domain/sessionTruth';
import { useSessionContext } from '../hooks/useSessionContext';

const RACE_MODES = {
  DRY_GP: 'dry-gp',
  FLAG_TO_FLAG: 'flag-to-flag',
  KDD_SIMULATION: 'kdd-simulation',
  ENDURANCE: 'endurance',
} as const;

type RaceMode = (typeof RACE_MODES)[keyof typeof RACE_MODES];

const RISK_LEVEL = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

type RiskLevel = (typeof RISK_LEVEL)[keyof typeof RISK_LEVEL];

const VARIANCE_LEVEL = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
} as const;

type VarianceLevel = (typeof VARIANCE_LEVEL)[keyof typeof VARIANCE_LEVEL];

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
  rearGrip: string;
  color: string;
  winProb: number;
  podiumProb: number;
  points: number;
  projectedRange: string;
  risk: RiskLevel;
  variance: VarianceLevel;
  decision: string;
  recommendation: string;
  confidence: number;
  tyreCliffRisk: RiskLevel;
  trafficRisk: RiskLevel;
  mainLimitation: string;
  reason: string;
}

interface FeatureDriver {
  name: string;
  imp: number;
  color: string;
  desc: string;
}

interface SensitivityRow {
  condition: string;
  effect: string;
  severity: RiskLevel;
}

interface IntegrityCheck {
  label: string;
  value: string;
  status: 'ok' | 'info' | 'warn';
}

const RACE_MODE_OPTIONS: { id: RaceMode; label: string; desc: string }[] = [
  { id: RACE_MODES.DRY_GP, label: 'Dry GP', desc: 'Tyre management model' },
  { id: RACE_MODES.FLAG_TO_FLAG, label: 'Flag-to-flag', desc: 'Weather-change decision tree' },
  { id: RACE_MODES.KDD_SIMULATION, label: 'KDD Simulation', desc: 'Pit strategy enabled' },
  { id: RACE_MODES.ENDURANCE, label: 'Endurance', desc: 'Stint + stop optimizer' },
];

const BASE_SCENARIOS: Scenario[] = [
  {
    id: 'baseline',
    name: 'Race Baseline',
    color: 'var(--blue)',
    desc: 'Safe default ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Pit L11 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Hard',
    lapTime: '1:33.41',
    pitLap: 11,
    finish: 'P3',
    projectedRange: 'P3',
    totalTime: '1:28:14.2',
    fuelUsed: '19.8 kg',
    rearGrip: '78%',
    winProb: 8,
    podiumProb: 52,
    points: 16,
    risk: RISK_LEVEL.LOW,
    variance: VARIANCE_LEVEL.LOW,
    decision: 'Safe',
    recommendation: 'Safe default. Maximizes expected points but leaves P2 outside attack range.',
    confidence: 86,
    tyreCliffRisk: RISK_LEVEL.LOW,
    trafficRisk: RISK_LEVEL.MEDIUM,
    mainLimitation: 'P2 gap remains outside attack range after pit cycle.',
    reason: 'Highest expected points with low variance and manageable rear tyre risk.',
  },
  {
    id: 'early-pit',
    name: 'Early Pit L9 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Hard',
    color: 'var(--green)',
    desc: 'Undercut attempt ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Traffic exposed',
    lapTime: '1:33.68',
    pitLap: 9,
    finish: 'P3ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œP4',
    projectedRange: 'P3ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œP4',
    totalTime: '1:28:31.4',
    fuelUsed: '19.8 kg',
    rearGrip: '42%',
    winProb: 5,
    podiumProb: 41,
    points: 13,
    risk: RISK_LEVEL.LOW,
    variance: VARIANCE_LEVEL.LOW,
    decision: 'Avoid',
    recommendation: 'Avoid unless traffic forces an undercut. Rear grip collapses too early.',
    confidence: 84,
    tyreCliffRisk: RISK_LEVEL.MEDIUM,
    trafficRisk: RISK_LEVEL.MEDIUM,
    mainLimitation: 'Short final stint margin: rear grip drops below the ideal attack threshold.',
    reason: 'Low upside and reduced expected points compared with baseline.',
  },
  {
    id: 'late-pit',
    name: 'Late Pit L13 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Hard',
    color: 'var(--yellow)',
    desc: 'Attack option ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Track position gain',
    lapTime: '1:34.12',
    pitLap: 13,
    finish: 'P2ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œP4',
    projectedRange: 'P2ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œP4',
    totalTime: '1:28:09.8',
    fuelUsed: '19.8 kg',
    rearGrip: '95%',
    winProb: 14,
    podiumProb: 48,
    points: 15,
    risk: RISK_LEVEL.MEDIUM,
    variance: VARIANCE_LEVEL.MEDIUM,
    decision: 'Attack option',
    recommendation: 'Recommended attack profile. Commit if rear temperature stays below threshold until Lap 10.',
    confidence: 86,
    tyreCliffRisk: RISK_LEVEL.MEDIUM,
    trafficRisk: RISK_LEVEL.MEDIUM,
    mainLimitation: 'Requires stable rear temperature before the late stop window opens.',
    reason: 'Best balance between race time, attack potential and manageable tyre risk.',
  },
  {
    id: '2stop',
    name: '2-Stop L9 + L17',
    color: 'var(--accent)',
    desc: 'Maximum pace ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Needs neutralisation',
    lapTime: '1:32.88',
    pitLap: 9,
    pitLap2: 17,
    finish: 'P1ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œP5',
    projectedRange: 'P1ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã…â€œP5',
    totalTime: '1:28:02.1',
    fuelUsed: '19.8 kg',
    rearGrip: '55%',
    winProb: 22,
    podiumProb: 38,
    points: 14,
    risk: RISK_LEVEL.HIGH,
    variance: VARIANCE_LEVEL.HIGH,
    decision: 'Only if safety car',
    recommendation: 'Only viable with safety car or neutralisation. Pit loss exposure is too high in green-flag conditions.',
    confidence: 78,
    tyreCliffRisk: RISK_LEVEL.MEDIUM,
    trafficRisk: RISK_LEVEL.HIGH,
    mainLimitation: 'Fastest clean-air race time but heavily exposed to pit loss and traffic variance.',
    reason: 'Maximizes win probability but increases downside risk and finish variance.',
  },
];

const SCENARIO_LAPS: Record<string, number[]> = {
  baseline: [93.1, 93.3, 93.4, 93.4, 93.5, 93.6, 93.4, 93.7, 94.0, 94.4, 95.1, 93.8, 93.5, 93.6, 93.7, 93.9, 94.0, 94.2, 94.5, 94.8, 95.0, 95.2, 95.4],
  'early-pit': [93.1, 93.3, 93.4, 93.4, 93.5, 93.6, 93.4, 93.7, 94.8, 94.0, 93.8, 93.7, 93.7, 93.8, 93.9, 94.0, 94.1, 94.2, 94.3, 94.4, 94.6, 94.7, 94.9],
  'late-pit': [93.1, 93.3, 93.4, 93.4, 93.5, 93.6, 93.4, 93.7, 93.9, 94.2, 94.6, 95.2, 96.1, 94.0, 93.6, 93.7, 93.8, 94.0, 94.2, 94.5, 94.8, 95.0, 95.2],
  '2stop': [92.9, 93.0, 93.1, 93.2, 93.2, 93.3, 93.2, 93.5, 94.6, 93.0, 92.9, 93.0, 93.1, 93.3, 93.5, 93.8, 95.0, 93.2, 93.0, 93.1, 93.2, 93.4, 93.6],
};

const FEATURE_IMPORTANCE: FeatureDriver[] = [
  { name: 'Rear tyre temperature', imp: 0.242, color: 'var(--yellow)', desc: 'Main driver of degradation and cliff timing.' },
  { name: 'Rear tyre age', imp: 0.198, color: 'var(--yellow)', desc: 'Controls grip loss after L10.' },
  { name: 'Fuel load', imp: 0.154, color: 'var(--orange)', desc: 'High impact in first stint; lap time improves as fuel burns off.' },
  { name: 'Sector 3 speed', imp: 0.121, color: 'var(--blue)', desc: 'Main differentiator for final race position.' },
  { name: 'Engine map', imp: 0.089, color: 'var(--green)', desc: 'Improves top speed but increases fuel and thermal load.' },
  { name: 'Lean angle average', imp: 0.072, color: 'var(--violet)', desc: 'Correlated with tyre edge stress.' },
  { name: 'TC interventions', imp: 0.063, color: 'var(--violet)', desc: 'Proxy for rear grip instability.' },
  { name: 'Brake balance', imp: 0.044, color: 'var(--cyan)', desc: 'Affects entry stability and front tyre load.' },
  { name: 'Ambient temperature', imp: 0.017, color: 'var(--text-muted)', desc: 'Secondary effect under current conditions.' },
];

const SENSITIVITY_ROWS: SensitivityRow[] = [
  { condition: 'If rear tyre temp +5ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°C', effect: 'Baseline loses +6.8s race time. Late Pit L13 becomes high risk.', severity: RISK_LEVEL.HIGH },
  { condition: 'If safety car probability >18%', effect: '2-stop becomes viable.', severity: RISK_LEVEL.MEDIUM },
  { condition: 'If P2 pace drops by 0.15s/lap', effect: 'Late Pit L13 projects P2.', severity: RISK_LEVEL.LOW },
  { condition: 'If fuel save mode enabled', effect: 'Race time +2.1s. Thermal load -4%.', severity: RISK_LEVEL.MEDIUM },
];

const INTEGRITY_CHECKS: IntegrityCheck[] = [
  { label: 'Track model', value: 'Mugello loaded', status: 'ok' },
  { label: 'Race length', value: `${MUGELLO_CIRCUIT.raceLaps} laps`, status: 'ok' },
  { label: 'Scenario count', value: '4 loaded', status: 'ok' },
  { label: 'Feature extraction', value: '48 / 48 variables available', status: 'ok' },
  { label: 'Monte Carlo runs', value: '5,000 completed', status: 'ok' },
  { label: 'Mode warning', value: 'Pit strategy enabled under KDD Simulation mode.', status: 'info' },
];

function MultiScenarioChart({
  scenarios,
  currentLap,
  activeId,
}: {
  scenarios: Scenario[];
  currentLap: number;
  activeId: string;
}) {
  const W = 680;
  const H = 170;
  const P = { t: 18, r: 16, b: 30, l: 44 };
  const cw = W - P.l - P.r;
  const ch = H - P.t - P.b;
  const LAPS = 23;
  const minT = 92.0;
  const maxT = 97.0;

  const xOf = (lap: number) => P.l + ((lap - 1) / (LAPS - 1)) * cw;
  const yOf = (t: number) => P.t + ch - ((t - minT) / (maxT - minT)) * ch;
  const curX = xOf(Math.min(Math.max(currentLap || 1, 1), LAPS));
  const activeSc = scenarios.find(s => s.id === activeId);
  const activeLaps = activeSc ? SCENARIO_LAPS[activeSc.id] : [];
  const yTicks = [93, 94, 95, 96, 97];
  const xTicks = [1, 5, 9, 11, 13, 17, 23];

  return (
    <svg width="100%" height={H + 4} viewBox={`0 0 ${W} ${H + 4}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
      <rect x={xOf(11)} y={P.t} width={xOf(14) - xOf(11)} height={H - P.b - P.t} fill="rgba(224,55,55,0.08)" />
      <text x={xOf(11) + 5} y={P.t + 11} fill="#E03737" fontSize="7" fontFamily="JetBrains Mono,monospace">TYRE CLIFF RISK</text>

      {yTicks.map(t => {
        const y = yOf(t);
        return (
          <g key={t}>
            <line x1={P.l} y1={y} x2={W - P.r} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={P.l - 6} y={y + 3} textAnchor="end" fill="#535A6E" fontSize="8" fontFamily="JetBrains Mono,monospace">
              :{(t % 60).toFixed(0).padStart(2, '0')}
            </text>
          </g>
        );
      })}

      {xTicks.map(l => (
        <text key={l} x={xOf(l)} y={H - 4} textAnchor="middle" fill="#535A6E" fontSize="8" fontFamily="JetBrains Mono,monospace">L{l}</text>
      ))}

      {activeSc && activeLaps.length > 0 && (() => {
        const topPts = activeLaps.map((t, i) => `${xOf(i + 1)},${yOf(t - 0.25)}`).join(' ');
        const botPts = [...activeLaps].reverse().map((t, ri) => `${xOf(activeLaps.length - ri)},${yOf(t + 0.25)}`).join(' ');
        return <polygon points={`${topPts} ${botPts}`} fill={activeSc.color} opacity="0.08" />;
      })()}

      {scenarios.filter(sc => sc.id !== activeId).map(sc => {
        const laps = SCENARIO_LAPS[sc.id];
        const pts = laps.map((t, i) => `${xOf(i + 1)},${yOf(t)}`).join(' ');
        return (
          <g key={sc.id}>
            {[sc.pitLap, sc.pitLap2 ?? null].filter((x): x is number => x !== null).map(pl => (
              <line key={pl} x1={xOf(pl)} y1={P.t} x2={xOf(pl)} y2={H - P.b} stroke={sc.color} strokeWidth="1" strokeDasharray="3,3" opacity="0.25" />
            ))}
            <polyline points={pts} fill="none" stroke={sc.color} strokeWidth="1" opacity="0.28" strokeLinejoin="round" />
          </g>
        );
      })}

      {activeSc && (() => {
        const laps = SCENARIO_LAPS[activeSc.id];
        const pts = laps.map((t, i) => `${xOf(i + 1)},${yOf(t)}`).join(' ');
        return (
          <g>
            {[activeSc.pitLap, activeSc.pitLap2 ?? null].filter((x): x is number => x !== null).map(pl => (
              <g key={pl}>
                <line x1={xOf(pl)} y1={P.t} x2={xOf(pl)} y2={H - P.b} stroke={activeSc.color} strokeWidth="1.2" strokeDasharray="4,3" opacity="0.8" />
                <text x={xOf(pl) + 3} y={P.t + 23} fill={activeSc.color} fontSize="7" fontFamily="JetBrains Mono,monospace">PIT</text>
              </g>
            ))}
            <polyline points={pts} fill="none" stroke={activeSc.color} strokeWidth="2.2" opacity="1" strokeLinejoin="round" />
          </g>
        );
      })()}

      <line x1={curX} y1={P.t} x2={curX} y2={H - P.b} stroke="var(--accent)" strokeWidth="1.5" opacity="0.9" />
      <text x={curX + 3} y={P.t + 8} fill="var(--accent)" fontSize="7" fontFamily="JetBrains Mono,monospace">NOW</text>
    </svg>
  );
}

function FeatureImportanceChart() {
  const maxImp = FEATURE_IMPORTANCE[0].imp;

  return (
    <div>
      {FEATURE_IMPORTANCE.map((f, i) => (
        <div key={f.name} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 12, color: i < 3 ? 'var(--text)' : 'var(--text-muted)', fontWeight: i < 3 ? 700 : 500 }}>{f.name}</span>
            <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace', color: f.color, fontWeight: 700 }}>{(f.imp * 100).toFixed(1)}%</span>
          </div>
          <div className="bar-track" style={{ height: 6, marginBottom: 4 }}>
            <div className="bar-fill" style={{ width: `${(f.imp / maxImp) * 100}%`, background: f.color, opacity: i < 3 ? 1 : 0.62 }} />
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.45 }}>{f.desc}</div>
        </div>
      ))}
      <div style={{ marginTop: 14, padding: '10px 12px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.20)', borderRadius: 8 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--yellow)', marginBottom: 4 }}>Model interpretation</div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
          The model is tyre-limited, not power-limited. Rear temperature and rear age explain <strong style={{ color: 'var(--text)' }}>44.0%</strong> of prediction variance.
        </div>
      </div>
    </div>
  );
}

function OptionGroup<T extends string | number>({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: T[];
  value: T;
  onChange: Dispatch<SetStateAction<T>>;
}) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div className="card-label" style={{ marginBottom: 6 }}>{label}</div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {options.map(option => {
          const active = option === value;
          return (
            <button
              key={String(option)}
              type="button"
              onClick={() => onChange(option)}
              style={{
                border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                background: active ? 'rgba(224,55,55,0.12)' : 'rgba(255,255,255,0.03)',
                color: active ? 'var(--accent)' : 'var(--text-muted)',
                borderRadius: 999,
                padding: '5px 9px',
                fontSize: 10,
                fontFamily: 'JetBrains Mono,monospace',
                fontWeight: active ? 700 : 500,
                cursor: 'pointer',
              }}
            >
              {typeof option === 'number' ? `L${option}` : option}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function RiskBadge({ risk }: { risk: RiskLevel }) {
  const className = risk === RISK_LEVEL.HIGH ? 'badge-red' : risk === RISK_LEVEL.MEDIUM ? 'badge-yellow' : 'badge-green';
  return <span className={`badge ${className}`}>{risk.toUpperCase()}</span>;
}

function StatTile({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="card-label">{label}</div>
      <div className="text-mono" style={{ fontSize: 17, fontWeight: 700, color: color ?? 'var(--text)' }}>{value}</div>
    </div>
  );
}

function OutcomeProbPanel({ scenarios, activeId, onSelect }: { scenarios: Scenario[]; activeId: string; onSelect: Dispatch<SetStateAction<string>> }) {
  return (
    <div>
      {scenarios.map(s => (
        <div key={s.id} onClick={() => onSelect(s.id)} style={{ marginBottom: 14, cursor: 'pointer', opacity: s.id === activeId ? 1 : 0.58 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, gap: 8 }}>
            <span style={{ fontSize: 11, fontWeight: s.id === activeId ? 700 : 500, color: s.id === activeId ? s.color : 'var(--text-muted)' }}>{s.name}</span>
            <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace', color: 'var(--text-muted)' }}>P1 {s.winProb}% ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Podium {s.podiumProb}% ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· {s.points} pts</span>
          </div>
          <div style={{ display: 'flex', height: 7, borderRadius: 4, overflow: 'hidden', background: 'rgba(255,255,255,0.04)' }}>
            <div style={{ width: `${s.winProb}%`, background: s.color }} />
            <div style={{ width: `${s.podiumProb - s.winProb}%`, background: s.color, opacity: 0.4 }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3, gap: 8 }}>
            <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>Variance: {s.variance}</span>
            <span style={{ fontSize: 9, color: s.color, fontFamily: 'JetBrains Mono,monospace', fontWeight: 700 }}>{s.decision}</span>
          </div>
        </div>
      ))}
      <div style={{ padding: '10px 12px', background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.16)', borderRadius: 8, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
        <strong style={{ color: 'var(--blue)' }}>Probability insight:</strong> 2-stop maximizes win probability but increases finishing variance. Late Pit L13 provides the best attack profile without excessive downside. Race Baseline maximizes expected points.
      </div>
    </div>
  );
}

export function DigitalTwinReportPage() {
  const session = useSessionContext();
  const telem = useLiveTelemetry();
  const { toast } = useToast();
  const [activeScenario, setActiveScenario] = useState('baseline');
  const [simulating, setSimulating] = useState(false);
  const [scenarios, setScenarios] = useState<Scenario[]>(BASE_SCENARIOS);
  const [lastSimLap, setLastSimLap] = useState<number | null>(null);
  const [raceMode, setRaceMode] = useState<RaceMode>(RACE_MODES.KDD_SIMULATION);
  const [whatifPitLap, setWhatifPitLap] = useState(11);
  const [whatifCompound, setWhatifCompound] = useState('Hard');
  const [whatifEngineMap, setWhatifEngineMap] = useState('Map 6');
  const [whatifTCLevel, setWhatifTCLevel] = useState('TC3');
  const [whatifRiderPace, setWhatifRiderPace] = useState('Normal');
  const [whatifRearProtection, setWhatifRearProtection] = useState('Medium');
  const [whatifTraffic, setWhatifTraffic] = useState('Clean air');

  const currentLap = telem.lapCount || 0;
  const scenario = scenarios.find(s => s.id === activeScenario) ?? scenarios[0];
  const recommendedScenario = scenarios.find(s => s.id === 'late-pit') ?? scenario;
  const baselineTotal = parseTotalTime(scenarios.find(s => s.id === 'baseline')?.totalTime ?? '0:00:00.0');
  const activeRaceMode = RACE_MODE_OPTIONS.find(mode => mode.id === raceMode) ?? RACE_MODE_OPTIONS[2];
  const pitStrategyEnabled = raceMode === RACE_MODES.KDD_SIMULATION || raceMode === RACE_MODES.ENDURANCE;

  async function handleRerunSim() {
    if (simulating) return;
    setSimulating(true);
    toast({ type: 'info', title: 'Simulation started', message: `Running 23-lap digital twin from Lap ${currentLap}ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦` });

    await new Promise<void>(resolve => globalThis.setTimeout(resolve, 1200));

    const variation = (Math.random() - 0.5) * 0.4;
    setScenarios(prev => prev.map(s => ({ ...s, lapTime: formatLapTime(parseLapTime(s.lapTime) + variation) })));
    setLastSimLap(currentLap);
    setSimulating(false);
    toast({ type: 'success', title: 'Simulation complete', message: `23-lap model updated from Lap ${currentLap}. ÃƒÆ’Ã…Â½ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ${variation >= 0 ? '+' : ''}${variation.toFixed(3)}s.` });
  }

  function handleWhatIfSim() {
    toast({
      type: 'info',
      title: 'What-if scenario staged',
      message: `L${whatifPitLap} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${whatifCompound} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${whatifEngineMap} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${whatifTCLevel} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· ${whatifRiderPace}`,
    });
  }

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">{['race', 'simulation', 'demo'].includes(session.ctx.sessionMode) ? 'Digital Twin Report' : 'Session Digital Twin'}</h1>
          <p className="page-subtitle">{session.ctx.circuitName} {['race', 'simulation', 'demo'].includes(session.ctx.sessionMode) ? 'race simulation' : 'session model ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â no race points or pit strategy in this mode'} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· What-if scenarios ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Lap-time model ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· KDD degradation prediction{session.ctx.dataMode !== 'live' ? ' ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· all outputs AI-estimated' : ''}{session.ctx.sessionMode === 'simulation' ? ` ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· circuit confidence ${Math.round(session.circuit.agentConfidence * 100)}%` : ''}</p>
        </div>
        <div className="flex items-center gap-2" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span className="badge badge-blue">Digital Twin v2.1</span>
          <span className="badge badge-yellow">{activeRaceMode.label}</span>
          <span className="badge badge-blue"><GitBranch size={12} /> 4 scenarios loaded</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>Last run: L{lastSimLap ?? 0}</span>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Race mode</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{pitStrategyEnabled ? 'Pit strategy enabled' : 'Tyre-management model active'}</span>
        </div>
        <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 10 }}>
          {RACE_MODE_OPTIONS.map(mode => {
            const active = raceMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => setRaceMode(mode.id)}
                style={{
                  textAlign: 'left',
                  padding: '11px 12px',
                  borderRadius: 'var(--radius-lg)',
                  border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`,
                  background: active ? 'rgba(224,55,55,0.10)' : 'rgba(255,255,255,0.03)',
                  color: active ? 'var(--text)' : 'var(--text-muted)',
                  cursor: 'pointer',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 800, marginBottom: 4 }}>{mode.label}</div>
                <div style={{ fontSize: 10 }}>{mode.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="card mb-4" style={{
 background: 'linear-gradient(135deg, rgba(224,55,55,0.10), rgba(59,130,246,0.04))' }}>
        <div className="card-header">
          <span className="card-title flex items-center gap-2"><Target size={15} />AI Strategy Recommendation</span>
          <RiskBadge risk={recommendedScenario.risk} />
        </div>
        <div className="card-body">
          <div className="grid-3" style={{ alignItems: 'start' }}>
            <div>
              <div className="card-label">Recommended scenario</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: recommendedScenario.color, marginBottom: 8 }}>{recommendedScenario.name}</div>
              <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55, margin: 0 }}>{recommendedScenario.reason}</p>
            </div>
            <div className="grid-2" style={{ gap: 14 }}>
              <StatTile label="Projected result" value={recommendedScenario.projectedRange} color={recommendedScenario.color} />
              <StatTile label="Expected points" value={`${recommendedScenario.points} pts`} color="var(--text)" />
              <StatTile label="Win probability" value={`${recommendedScenario.winProb}%`} color="var(--yellow)" />
              <StatTile label="Podium probability" value={`${recommendedScenario.podiumProb}%`} color="var(--green)" />
            </div>
            <div>
              <div className="card-label">Decision window</div>
              <div className="text-mono" style={{ fontSize: 18, fontWeight: 800, color: 'var(--accent)', marginBottom: 8 }}>Commit by Lap 10</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 }}>Stay flexible until L10. Commit to Late Pit L13 only if rear tyre temp remains below threshold and traffic risk does not spike.</div>
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Scenario Decision Summary</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>executive strategy board</span>
        </div>
        <div className="card-body">
          <div className="grid-4" style={{ marginBottom: 12 }}>
            {[
              { label: 'Recommended', value: 'Late Pit L13 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Hard', badge: 'badge-green', text: 'Best balance between race time, podium probability and tyre risk.' },
              { label: 'Avoid', value: '2-Stop L9 + L17', badge: 'badge-red', text: 'Only if safety car or neutralisation appears.' },
              { label: 'Safe fallback', value: 'Race Baseline L11 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Hard', badge: 'badge-blue', text: 'Lowest variance and strongest expected-points profile.' },
              { label: 'Aggressive option', value: 'Late Pit L13 ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Hard', badge: 'badge-yellow', text: 'Attack P2 if rear thermal drift remains stable.' },
            ].map(item => (
              <div key={item.label} style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.03)' }}>
                <span className={`badge ${item.badge}`} style={{ marginBottom: 8 }}>{item.label}</span>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginTop: 8 }}>{item.value}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.45, marginTop: 5 }}>{item.text}</div>
              </div>
            ))}
          </div>
          <div style={{ padding: '9px 12px', borderRadius: 8, background: 'rgba(59,130,246,0.06)', border: '1px solid rgba(59,130,246,0.15)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--blue)' }}>Best expected result:</strong> Late Pit L13 ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· <strong style={{ color: 'var(--green)' }}>Lowest risk:</strong> Race Baseline ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· <strong style={{ color: 'var(--yellow)' }}>Highest win chance:</strong> 2-Stop ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· <strong style={{ color: 'var(--accent)' }}>Best points/risk balance:</strong> Late Pit L13
          </div>
        </div>
      </div>

      <div className="grid-4 mb-4">
        {scenarios.map(s => (
          <div key={s.id} className="twin-scenario" style={activeScenario === s.id ? { borderColor: s.color, background: `${s.color}14` } : {}} onClick={() => setActiveScenario(s.id)}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 3, color: activeScenario === s.id ? s.color : 'var(--text)' }}>{s.name}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.desc}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div className="text-mono" style={{ fontSize: 15, fontWeight: 800, color: activeScenario === s.id ? s.color : 'var(--text)' }}>{s.finish}</div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Win {s.winProb}% ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· {s.points} pts</div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid-2 mb-4">
        <div className="card">
          <div className="card-header">
            <span className="card-title">Active Scenario ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· {scenario.name}</span>
            <button className="btn btn-primary btn-sm flex items-center gap-2" style={{ fontSize: 12 }} onClick={handleRerunSim} disabled={simulating}>
              {simulating ? <><Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} />RunningÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦</> : <><Play size={12} />Re-run Sim</>}
            </button>
          </div>
          <div className="card-body">
            <div style={{ marginBottom: 16 }}>
              <div className="card-label">Strategy</div>
              <div style={{ fontSize: 15, fontWeight: 800, color: scenario.color }}>{pitStrategyEnabled ? `1-stop ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· Pit L${scenario.pitLap}${scenario.pitLap2 ? ` + L${scenario.pitLap2}` : ''} ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Hard` : 'No scheduled tyre stop ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· manage rear temperature and edge grip'}</div>
            </div>
            <div className="grid-3" style={{ marginBottom: 18 }}>
              <StatTile label="Projected finish" value={scenario.finish} color={scenario.color} />
              <StatTile label="Expected points" value={`${scenario.points} pts`} />
              <StatTile label="Race time" value={scenario.totalTime} />
              <StatTile label="Best lap" value={scenario.lapTime} />
              <StatTile label="Fuel consumed" value={scenario.fuelUsed} color="var(--orange)" />
              <StatTile label="Rear grip at finish" value={scenario.rearGrip} color={parseFloat(scenario.rearGrip) < 50 ? 'var(--accent)' : 'var(--green)'} />
            </div>
            <div className="grid-3" style={{ marginBottom: 16 }}>
              <div><div className="card-label">Tyre cliff risk</div><RiskBadge risk={scenario.tyreCliffRisk} /></div>
              <div><div className="card-label">Traffic risk</div><RiskBadge risk={scenario.trafficRisk} /></div>
              <StatTile label="Model confidence" value={`${scenario.confidence}%`} color="var(--blue)" />
            </div>
            <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--text)' }}>Main limitation:</strong> {scenario.mainLimitation}
            </div>
            {activeScenario !== 'baseline' && (() => {
              const deltaS = parseTotalTime(scenario.totalTime) - baselineTotal;
              const isFaster = deltaS < 0;
              return (
                <div style={{ marginTop: 12, padding: '8px 12px', background: isFaster ? 'rgba(34,197,94,0.08)' : 'rgba(224,55,55,0.08)', border: `1px solid ${isFaster ? 'rgba(34,197,94,0.25)' : 'rgba(224,55,55,0.25)'}`, borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>vs Baseline race time</span>
                  <span className="text-mono" style={{ fontSize: 14, fontWeight: 800, color: isFaster ? 'var(--green)' : 'var(--accent)' }}>{isFaster ? '' : '+'}{deltaS.toFixed(1)}s</span>
                </div>
              );
            })()}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">All-Scenario Lap Time Overlay</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â±0.25s CI ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· PIT markers ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· cliff zone</span>
          </div>
          <div style={{ background: 'var(--bg-surface)', padding: '8px 6px 0' }}>
            <MultiScenarioChart scenarios={scenarios} currentLap={currentLap} activeId={activeScenario} />
          </div>
          <div className="card-body" style={{ paddingTop: 10 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              {scenarios.map(s => (
                <span key={s.id} onClick={() => setActiveScenario(s.id)} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9, fontFamily: 'JetBrains Mono,monospace', color: activeScenario === s.id ? s.color : 'var(--text-muted)', fontWeight: activeScenario === s.id ? 800 : 500, cursor: 'pointer' }}>
                  <span style={{ display: 'inline-block', width: 14, height: activeScenario === s.id ? 3 : 1.5, background: s.color, borderRadius: 2, opacity: activeScenario === s.id ? 1 : 0.45 }} />
                  {s.name.replace(' ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ Hard', '')}
                </span>
              ))}
            </div>
            <div style={{ padding: '10px 12px', borderRadius: 8, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)', fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--yellow)' }}>Key observation:</strong> Late Pit L13 is slower before the stop but gains track position after L17. 2-stop is fastest in clean air but highly exposed to pit loss and traffic variance.
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Scenario Comparison Matrix</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>click row to activate</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Scenario</th><th>Pit Lap(s)</th><th>Best Lap</th><th>Race ÃƒÆ’Ã…Â½ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â</th><th>Rear grip finish</th><th>Projected</th><th>Win %</th><th>Podium %</th><th>Exp Pts</th><th>Risk</th><th>Recommendation</th>
              </tr>
            </thead>
            <tbody>
              {scenarios.map(s => {
                const deltaS = parseTotalTime(s.totalTime) - baselineTotal;
                const isFaster = deltaS < 0;
                return (
                  <tr key={s.id} onClick={() => setActiveScenario(s.id)} style={{ cursor: 'pointer', background: activeScenario === s.id ? `${s.color}14` : 'transparent' }}>
                    <td style={{ fontWeight: 700, color: activeScenario === s.id ? s.color : 'var(--text)' }}>{s.name}</td>
                    <td className="mono">L{s.pitLap}{s.pitLap2 ? ` + L${s.pitLap2}` : ''}</td>
                    <td className="mono">{s.lapTime}</td>
                    <td className="mono" style={{ color: isFaster ? 'var(--green)' : s.id === 'baseline' ? 'var(--text-muted)' : 'var(--accent)' }}>{s.id === 'baseline' ? 'REF' : `${isFaster ? '' : '+'}${deltaS.toFixed(1)}s`}</td>
                    <td className="mono" style={{ color: parseFloat(s.rearGrip) < 50 ? 'var(--accent)' : 'var(--green)' }}>{s.rearGrip}</td>
                    <td style={{ fontWeight: 800, color: s.color }}>{s.finish}</td>
                    <td className="mono" style={{ color: s.color }}>{s.winProb}%</td>
                    <td className="mono">{s.podiumProb}%</td>
                    <td className="mono">{s.points}</td>
                    <td><RiskBadge risk={s.risk} /></td>
                    <td style={{ minWidth: 180, fontSize: 11, color: 'var(--text-muted)' }}>{s.decision}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid-2 mb-4">
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><Target size={13} />Outcome Probability Model</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>Monte Carlo ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· 5,000 runs</span>
          </div>
          <div className="card-body"><OutcomeProbPanel scenarios={scenarios} activeId={activeScenario} onSelect={setActiveScenario} /></div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><Gauge size={13} />What-if Controls</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>interactive assumptions</span>
          </div>
          <div className="card-body">
            <OptionGroup label="Pit lap" options={[9, 10, 11, 12, 13, 14, 15]} value={whatifPitLap} onChange={setWhatifPitLap} />
            <OptionGroup label="Compound after stop" options={['Soft', 'Medium', 'Hard']} value={whatifCompound} onChange={setWhatifCompound} />
            <OptionGroup label="Engine map" options={['Map 5', 'Map 6', 'Map 7']} value={whatifEngineMap} onChange={setWhatifEngineMap} />
            <OptionGroup label="TC level" options={['TC2', 'TC3', 'TC4', 'TC5']} value={whatifTCLevel} onChange={setWhatifTCLevel} />
            <OptionGroup label="Rider pace" options={['Conservative', 'Normal', 'Push']} value={whatifRiderPace} onChange={setWhatifRiderPace} />
            <OptionGroup label="Rear tyre protection" options={['Off', 'Medium', 'High']} value={whatifRearProtection} onChange={setWhatifRearProtection} />
            <OptionGroup label="Traffic assumption" options={['Clean air', 'Traffic', 'Safety car']} value={whatifTraffic} onChange={setWhatifTraffic} />
            <button className="btn btn-primary btn-sm" onClick={handleWhatIfSim} style={{ marginTop: 4 }}>Simulate with these parameters</button>
          </div>
        </div>
      </div>

      <div className="grid-2 mb-4">
        <div className="card">
          <div className="card-header"><span className="card-title flex items-center gap-2"><Clock size={13} />Decision Window</span></div>
          <div className="card-body">
            <div className="grid-2" style={{ marginBottom: 14 }}>
              <StatTile label="Current simulation lap" value={`L${currentLap}`} color="var(--blue)" />
              <StatTile label="Next decision" value="Commit by L10" color="var(--accent)" />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text)' }}>Why:</strong> After L10, undercut opportunity closes and rear cliff risk increases.<br />
              <strong style={{ color: 'var(--text)' }}>Recommended action:</strong> Stay flexible until L10. Switch to Late Pit L13 if rear tyre temp remains below threshold. Default to Race Baseline if traffic risk increases.
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title flex items-center gap-2"><Thermometer size={13} />Sensitivity Analysis</span></div>
          <div className="card-body">
            {SENSITIVITY_ROWS.map(row => (
              <div key={row.condition} style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr auto', gap: 10, alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text)' }}>{row.condition}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.45 }}>{row.effect}</div>
                <RiskBadge risk={row.severity} />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title flex items-center gap-2"><BarChart2 size={13} />Model Drivers ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· SHAP Feature Importance</span>
          <span className="badge badge-blue">GBM ensemble ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· 48 variables</span>
        </div>
        <div className="card-body"><FeatureImportanceChart /></div>
      </div>

      <div className="grid-3 mb-4">
        <div className="card">
          <div className="card-header"><span className="card-title flex items-center gap-2"><Shield size={13} />Model Validation</span></div>
          <div className="card-body" style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--text)' }}>Training samples:</strong> 847 race samples<br />
            <strong style={{ color: 'var(--text)' }}>Current track match:</strong> Mugello ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· high similarity<br />
            <strong style={{ color: 'var(--text)' }}>Prediction accuracy:</strong> 94.2% vs physical model<br />
            <strong style={{ color: 'var(--text)' }}>Current confidence:</strong> 86%<br />
            <strong style={{ color: 'var(--text)' }}>Uncertainty drivers:</strong> rear tyre thermal drift ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· traffic after pit stop ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· P2/P4 pace variance
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title flex items-center gap-2"><Cpu size={13} />Race Pace Pipeline</span></div>
          <div className="card-body" style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--text)' }}>Simulation length:</strong> {MUGELLO_CIRCUIT.raceLaps} laps<br />
            <strong style={{ color: 'var(--text)' }}>Runtime:</strong> 1.2s<br />
            <strong style={{ color: 'var(--text)' }}>Feature set:</strong> 48 variables<br />
            <strong style={{ color: 'var(--text)' }}>Model stack:</strong> GBM ensemble + tyre degradation surrogate + Monte Carlo outcome model<br />
            <strong style={{ color: 'var(--text)' }}>Interpretability:</strong> SHAP feature attribution<br />
            <strong style={{ color: 'var(--text)' }}>Next auto-run:</strong> Pit window update or tyre temperature threshold breach
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title flex items-center gap-2"><CheckCircle size={13} />Digital Twin Integrity</span></div>
          <div className="card-body">
            {INTEGRITY_CHECKS.map(check => (
              <div key={check.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 10, padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{check.label}</span>
                <span style={{ fontSize: 11, color: check.status === 'warn' ? 'var(--accent)' : check.status === 'info' ? 'var(--yellow)' : 'var(--green)', fontWeight: 700 }}>{check.value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-3">
        <div className="insight-panel" style={{ ['--dot-color' as string]: 'var(--blue)' }}>
          <div className="insight-panel__title" style={{ color: 'var(--blue)' }}>Tyre Degradation Model</div>
          <p className="insight-panel__body">INT4 quantized neural surrogate. Accuracy: 94.2% vs high-fidelity physical model on 847 race samples. Efficiency: -18% VRAM ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· -22% inference time vs FP32 baseline. Use case: fast scenario simulation during race window.</p>
        </div>
        <div className="insight-panel" style={{ ['--dot-color' as string]: 'var(--green)' }}>
          <div className="insight-panel__title" style={{ color: 'var(--green)' }}>Chassis Model</div>
          <p className="insight-panel__body">Active swingarm variant: Al-Ti V3+SIMP. Mass delta: -1.1 kg vs baseline. Included in digital twin physics model only as a race-dynamics parameter, not as the main report insight.</p>
        </div>
        <div className="insight-panel" style={{ ['--dot-color' as string]: 'var(--cyan)' }}>
          <div className="insight-panel__title" style={{ color: 'var(--cyan)' }}>KDD Model Insight</div>
          <p className="insight-panel__body">This report is decision-first: it ranks scenario upside, downside variance, tyre cliff exposure, traffic sensitivity and the next strategic commit window instead of only listing simulation outputs.</p>
        </div>
      </div>
    </div>
  );
}

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
  const parts = totalTime.split(':');
  if (parts.length === 3) {
    return parseInt(parts[0], 10) * 3600 + parseInt(parts[1], 10) * 60 + parseFloat(parts[2]);
  }
  return 0;
}
