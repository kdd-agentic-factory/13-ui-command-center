import { useState } from 'react';
import {
  BarChart2,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  CloudRain,
  CloudSun,
  Cpu,
  Database,
  Flag,
  Gauge,
  Map,
  Navigation,
  Shield,
  Target,
  Thermometer,
  Upload,
  Wind,
} from 'lucide-react';
import { MUGELLO_CIRCUIT, RACE_SESSION } from '../domain/sessionTruth';
import { getSessionContext } from '../domain/sessionContext';

const SESSION_STATUS = {
  COMPLETED: 'completed',
  PENDING: 'pending',
  NOT_REQUIRED: 'not-required',
} as const;

type SessionStatus = (typeof SESSION_STATUS)[keyof typeof SESSION_STATUS];

const CHECK_STATUS = {
  COMPLETE: 'complete',
  PENDING: 'pending',
} as const;

type CheckStatus = (typeof CHECK_STATUS)[keyof typeof CHECK_STATUS];

interface ScheduleSession {
  session: string;
  day: string;
  time: string;
  status: SessionStatus;
  result: string;
  dataQuality?: string;
  note: string;
}

interface PaceEvolution {
  session: string;
  lap: string;
  setup: string;
  tyres: string;
  trackTemp: string;
  gain: string;
}

interface RivalProfile {
  grid: string;
  rider: string;
  team: string;
  pace: string;
  tyre: string;
  strength: string;
  weakness: string;
  trend: string;
  threat: string;
  strategy: string;
  self?: boolean;
}

interface ChecklistItem {
  label: string;
  status: CheckStatus;
}

interface DataSource {
  source: string;
  status: string;
  quality: string;
}

interface CircuitLibraryItem {
  name: string;
  id: string;
  loaded: boolean;
}

const CIRCUIT_LIBRARY: CircuitLibraryItem[] = [
  { name: 'Mugello', id: MUGELLO_CIRCUIT.id, loaded: true },
  { name: 'Jarama', id: 'jarama', loaded: false },
  { name: 'Jerez', id: 'jerez', loaded: false },
  { name: 'Montmeló', id: 'montmelo', loaded: false },
  { name: 'Portimão', id: 'portimao', loaded: false },
  { name: 'Misano', id: 'misano', loaded: false },
  { name: 'MotorLand Aragón', id: 'aragon', loaded: false },
  { name: 'Valencia', id: 'valencia', loaded: false },
  { name: 'Assen', id: 'assen', loaded: false },
  { name: 'Custom circuit', id: 'custom', loaded: false },
];

const VIEW_MODES = [
  '2D map',
  '3D elevation',
  'Gradient heatmap',
  'Speed heatmap',
  'Brake pressure map',
  'Throttle pickup map',
  'Tyre thermal load map',
  'Racing line comparison',
];

const IMPORT_TYPES = [
  'Upload GPX / CSV / JSON / KML / GeoJSON',
  'Upload elevation profile',
  'Upload sector definitions',
  'Upload corner metadata',
  'Upload onboard lap',
  'Upload telemetry reference',
  'Upload weather history',
  'Upload tyre degradation data',
];

const WEEKEND_SCHEDULE: ScheduleSession[] = [
  { session: 'FP1', day: 'Fri', time: '09:00', status: SESSION_STATUS.COMPLETED, result: 'P3 —· 1:44.102', dataQuality: '96%', note: 'Setup baseline created' },
  { session: 'FP2', day: 'Fri', time: '14:00', status: SESSION_STATUS.COMPLETED, result: 'P5 —· 1:43.847', dataQuality: '94%', note: 'Rear tyre thermal load detected' },
  { session: 'FP3', day: 'Sat', time: '09:30', status: SESSION_STATUS.COMPLETED, result: 'P4 —· 1:43.612', dataQuality: '97%', note: 'Race pace simulation updated' },
  { session: 'Q1', day: 'Sat', time: '14:30', status: SESSION_STATUS.NOT_REQUIRED, result: 'Q2 direct', dataQuality: '—', note: 'No additional run required' },
  { session: 'Q2', day: 'Sat', time: '15:00', status: SESSION_STATUS.COMPLETED, result: 'P3 —· 1:43.201', dataQuality: '98%', note: 'Grid row 1' },
  { session: 'Race', day: 'Sun', time: '14:00', status: SESSION_STATUS.PENDING, result: 'Pending', dataQuality: 'ready', note: `Grid P3 —· planned race distance ${MUGELLO_CIRCUIT.raceLaps} laps` },
];

const PACE_EVOLUTION: PaceEvolution[] = [
  { session: 'FP1', lap: '1:44.102', setup: 'baseline setup', tyres: 'Medium/Soft', trackTemp: '34—°C', gain: 'REF' },
  { session: 'FP2', lap: '1:43.847', setup: 'rear compression -1', tyres: 'Medium/Soft', trackTemp: '39—°C', gain: '-0.255s' },
  { session: 'FP3', lap: '1:43.612', setup: 'engine brake EB4', tyres: 'Medium/Soft', trackTemp: '31—°C', gain: '-0.490s' },
  { session: 'Q2', lap: '1:43.201', setup: 'qualifying map', tyres: 'Soft/Soft', trackTemp: '42—°C', gain: '-0.901s' },
];

const RIVAL_PROFILES: RivalProfile[] = [
  {
    grid: 'P1',
    rider: 'M. Marquez',
    team: 'Ducati',
    pace: '1:43.04',
    tyre: 'M/S',
    strength: 'Sector 3 —· Bucine exit',
    weakness: 'T1 braking under traffic',
    trend: 'stable',
    threat: 'High',
    strategy: 'Likely push early, protect rear after L10.',
  },
  {
    grid: 'P2',
    rider: 'P. Espargaro',
    team: 'Aprilia',
    pace: '1:43.18',
    tyre: 'M/M',
    strength: 'Sector 1 —· San Donato braking',
    weakness: 'S3 exit speed',
    trend: 'improving',
    threat: 'Medium',
    strategy: 'Consistent medium rear, lower cliff risk.',
  },
  {
    grid: 'P3',
    rider: '#47 KDD',
    team: 'KDD',
    pace: '1:43.41',
    tyre: 'M/S',
    strength: 'Sector 2 —· Arrabbiata flow',
    weakness: 'Bucine exit traction',
    trend: 'improving',
    threat: 'Self',
    strategy: 'Protect rear L1——œL5, attack P2 only if gap <0.6s.',
    self: true,
  },
  {
    grid: 'P4',
    rider: 'J. Martin',
    team: 'Pramac',
    pace: '1:43.55',
    tyre: 'S/S',
    strength: 'Sector 3 launch and exit speed',
    weakness: 'Rear degradation',
    trend: 'aggressive',
    threat: 'Medium-high L1——œL8',
    strategy: 'High early pressure, rear cliff expected after first stint phase.',
  },
];

const CHECKLIST: ChecklistItem[] = [
  { label: 'Procedural Mugello map loaded', status: CHECK_STATUS.COMPLETE },
  { label: 'Telemetry baseline loaded', status: CHECK_STATUS.COMPLETE },
  { label: 'Weather forecast loaded', status: CHECK_STATUS.COMPLETE },
  { label: 'Tyre allocation loaded', status: CHECK_STATUS.COMPLETE },
  { label: 'Rival model loaded', status: CHECK_STATUS.COMPLETE },
  { label: 'Digital twin scenarios loaded', status: CHECK_STATUS.COMPLETE },
  { label: 'Setup baseline selected', status: CHECK_STATUS.COMPLETE },
  { label: 'Race strategy selected', status: CHECK_STATUS.COMPLETE },
  { label: 'Start procedure reviewed', status: CHECK_STATUS.COMPLETE },
  { label: 'Rain contingency ready', status: CHECK_STATUS.PENDING },
];

const DATA_SOURCES: DataSource[] = [
  { source: 'Circuit geometry', status: MUGELLO_CIRCUIT.assetStatusLabel, quality: 'procedural' },
  { source: 'Elevation model', status: 'Procedural gradient brief —· no real mesh asset loaded', quality: 'procedural' },
  { source: 'Historical telemetry', status: 'FP1 —· FP2 —· FP3 —· Q2 loaded', quality: '96%' },
  { source: 'Rival data', status: 'Timing sheets + sector model', quality: '89%' },
  { source: 'Weather', status: 'Forecast + track sensors', quality: '91%' },
  { source: 'Tyre model', status: 'Compound database + stint degradation', quality: '93%' },
  { source: 'Setup sheets', status: 'FP1——œQ2 versions loaded', quality: '94%' },
];

function StatusBadge({ status }: { status: SessionStatus }) {
  if (status === SESSION_STATUS.COMPLETED) return <span className="badge badge-green">Completed</span>;
  if (status === SESSION_STATUS.NOT_REQUIRED) return <span className="badge badge-muted">Not required</span>;
  return <span className="badge badge-yellow">Pending</span>;
}

function StatTile({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="card-label">{label}</div>
      <div className="text-mono" style={{ fontSize: 17, fontWeight: 800, color: color ?? 'var(--text)' }}>{value}</div>
    </div>
  );
}

function PreparationProgress() {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)' }}>Preparation progress</span>
        <span className="text-mono" style={{ fontSize: 12, color: 'var(--green)', fontWeight: 800 }}>82%</span>
      </div>
      <div className="bar-track" style={{ height: 8 }}>
        <div className="bar-fill" style={{ width: '82%', background: 'var(--green)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 10, color: 'var(--text-muted)' }}>
        <span>Circuit model</span>
        <span>Strategy</span>
        <span>Race brief</span>
      </div>
    </div>
  );
}

function PaceEvolutionChart() {
  const points = PACE_EVOLUTION.map(item => parseLapTime(item.lap));
  const min = Math.min(...points) - 0.2;
  const max = Math.max(...points) + 0.2;
  const W = 560;
  const H = 92;
  const PAD = { t: 12, r: 16, b: 24, l: 44 };
  const cw = W - PAD.l - PAD.r;
  const ch = H - PAD.t - PAD.b;
  const xOf = (index: number) => PAD.l + (index / (PACE_EVOLUTION.length - 1)) * cw;
  const yOf = (pace: number) => PAD.t + ch - ((pace - min) / (max - min)) * ch;
  const polyline = points.map((pace, index) => `${xOf(index)},${yOf(pace)}`).join(' ');

  return (
    <svg width="100%" height={H + 4} viewBox={`0 0 ${W} ${H + 4}`} preserveAspectRatio="xMidYMid meet" style={{ display: 'block' }}>
      {[min + 0.2, min + 0.5, min + 0.8].map(tick => (
        <line key={tick} x1={PAD.l} y1={yOf(tick)} x2={W - PAD.r} y2={yOf(tick)} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
      ))}
      <polygon points={`${PAD.l},${PAD.t + ch} ${polyline} ${W - PAD.r},${PAD.t + ch}`} fill="rgba(59,130,246,0.12)" />
      <polyline points={polyline} fill="none" stroke="#3B82F6" strokeWidth="2" strokeLinejoin="round" />
      {PACE_EVOLUTION.map((item, index) => {
        const cx = xOf(index);
        const cy = yOf(points[index]);
        const isBest = item.session === 'Q2';
        return (
          <g key={item.session}>
            <circle cx={cx} cy={cy} r={isBest ? 5 : 3.5} fill={isBest ? 'var(--green)' : 'var(--blue)'} stroke="rgba(255,255,255,0.18)" strokeWidth="2" />
            <text x={cx} y={H - 4} textAnchor="middle" fill={isBest ? 'var(--green)' : 'var(--text-muted)'} fontSize="8" fontFamily="JetBrains Mono,monospace" fontWeight={isBest ? 800 : 500}>{item.session}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function PreGrandPrixPage() {
  const [selectedCircuit, setSelectedCircuit] = useState(MUGELLO_CIRCUIT.shortName);
  const [activeViewMode, setActiveViewMode] = useState('3D elevation');
  const [showRivalDetail, setShowRivalDetail] = useState(true);
  const completedChecks = CHECKLIST.filter(item => item.status === CHECK_STATUS.COMPLETE).length;

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Pre-GP Engineering Workspace</h1>
          <p className="page-subtitle">Circuit loading —· weekend planning —· race simulation —· setup baseline —· rival intelligence</p>
        </div>
        <div className="flex items-center gap-2" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span className="badge badge-green">PRE-RACE</span>
          <span className="badge badge-blue">Simulation ready</span>
          <span className="badge badge-muted"><Calendar size={13} /> Round 7/20</span>
        </div>
      </div>

      <div className="card mb-4" style={{
 }}>
        <div className="card-header">
          <span className="card-title">GP {MUGELLO_CIRCUIT.shortName} —· {MUGELLO_CIRCUIT.country} —· {MUGELLO_CIRCUIT.season} Season</span>
          <span className="badge badge-yellow">Race not started —· preparation phase</span>
        </div>
        <div className="card-body">
          <div className="grid-4" style={{ marginBottom: 18 }}>
            <StatTile label="Status" value="PRE-RACE" color="var(--green)" />
            <StatTile label="Circuit" value={`${MUGELLO_CIRCUIT.lengthKm} km —· ${MUGELLO_CIRCUIT.turns} turns`} color="var(--blue)" />
            <StatTile label="Race distance" value={`${MUGELLO_CIRCUIT.raceLaps} laps`} color="var(--text)" />
            <StatTile label="Digital Twin" value="Ready —· 4 scenarios" color="var(--yellow)" />
          </div>
          <PreparationProgress />
        </div>
      </div>

      <div className="grid-2 mb-4">
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><Database size={14} />Circuit Data Loader</span>
            <span className="badge badge-green">Mugello session truth active</span>
          </div>
          <div className="card-body">
            <div className="card-label" style={{ marginBottom: 8 }}>Circuit library</div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {CIRCUIT_LIBRARY.map(circuit => {
                const active = selectedCircuit === circuit.name;
                return (
                  <button key={circuit.id} type="button" disabled={!circuit.loaded} onClick={() => setSelectedCircuit(circuit.name)} title={circuit.loaded ? 'Loaded for the active session circuit' : 'Not loaded — selecting would mismatch the active session circuit'} style={{ border: `1px solid ${active ? 'var(--blue)' : !circuit.loaded ? 'rgba(245,158,11,0.28)' : 'var(--border)'}`, background: active ? 'rgba(59,130,246,0.12)' : 'rgba(255,255,255,0.03)', color: active ? 'var(--blue)' : !circuit.loaded ? 'var(--yellow)' : 'var(--text-muted)', borderRadius: 999, padding: '6px 10px', fontSize: 10, fontFamily: 'JetBrains Mono,monospace', fontWeight: active ? 800 : 500, cursor: circuit.loaded ? 'pointer' : 'not-allowed', opacity: circuit.loaded ? 1 : 0.72 }}>
                    {circuit.name}{!circuit.loaded ? ' —· not loaded' : ''}
                  </button>
                );
              })}
            </div>
            <div style={{ marginBottom: 16, padding: '10px 12px', border: '1px solid rgba(245,158,11,0.22)', background: 'rgba(245,158,11,0.07)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--yellow)' }}>Integrity guard:</strong> {RACE_SESSION.productName} is locked to Mugello for this batch. Jarama and other library entries are visible as not-loaded to prevent circuit/session mismatch.
            </div>
            <div className="grid-2" style={{ marginBottom: 16 }}>
              <StatTile label="Selected circuit" value={`${selectedCircuit} GP Layout`} color="var(--blue)" />
              <StatTile label="Geometry asset" value="Procedural" color="var(--yellow)" />
              <StatTile label="Corner set" value="15 / 15 loaded" color="var(--green)" />
              <StatTile label="Circuit mismatch" value="Guarded" color="var(--green)" />
            </div>
            <div className="card-label" style={{ marginBottom: 8 }}>Import circuit data</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 8 }}>
              {IMPORT_TYPES.map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'rgba(255,255,255,0.03)', fontSize: 11, color: 'var(--text-muted)' }}>
                  <Upload size={13} style={{ color: 'var(--blue)' }} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><Map size={14} />Circuit Intelligence —· {getSessionContext().circuitName}</span>
            <span className="badge badge-blue">MotoGP layout</span>
          </div>
          <div className="card-body">
            <div className="grid-4" style={{ marginBottom: 16 }}>
              <StatTile label="Length" value={`${MUGELLO_CIRCUIT.lengthKm} km`} />
              <StatTile label="Turns" value={`${MUGELLO_CIRCUIT.turns} —· ${MUGELLO_CIRCUIT.leftTurns}L / ${MUGELLO_CIRCUIT.rightTurns}R`} />
              <StatTile label="Main straight" value={`${MUGELLO_CIRCUIT.mainStraightKm} km`} color="var(--yellow)" />
              <StatTile label="Elevation variance" value="41.19 m" color="var(--blue)" />
            </div>
            <div className="grid-2">
              <div>
                <div className="card-label" style={{ marginBottom: 8 }}>Key zones</div>
                {[
                  'T1 San Donato —· heavy braking after main straight',
                  'T3 Poggio Secco —· high point / crest',
                  'T8/T9 Arrabbiata —· high-speed lean load',
                  'T12 Correntaio —· braking stability',
                  'T15 Bucine —· exit onto main straight',
                ].map(zone => <div key={zone} style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 7 }}>—¢ {zone}</div>)}
              </div>
              <div>
                <div className="card-label" style={{ marginBottom: 8 }}>Primary performance drivers</div>
                {[
                  'Braking stability into T1 San Donato',
                  'High-speed commitment through Arrabbiata 1/2',
                  'Rear grip out of T15 Bucine',
                  'Top speed and aero drag on the main straight',
                ].map(driver => <div key={driver} style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 7 }}>—¢ {driver}</div>)}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2 mb-4">
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><Navigation size={14} />Procedural Circuit Model</span>
            <span className="badge badge-yellow">No real mesh asset</span>
          </div>
          <div className="card-body">
            <div style={{ height: 220, border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', background: 'radial-gradient(circle at 35% 40%, rgba(59,130,246,0.20), transparent 30%), radial-gradient(circle at 65% 55%, rgba(245,158,11,0.18), transparent 28%), rgba(255,255,255,0.03)', position: 'relative', overflow: 'hidden', marginBottom: 14 }}>
              <svg width="100%" height="100%" viewBox="0 0 520 220" preserveAspectRatio="none">
                <path d="M52 160 C95 80,150 58,213 82 C270 104,254 159,320 156 C390 150,426 103,470 70" fill="none" stroke="rgba(255,255,255,0.16)" strokeWidth="20" strokeLinecap="round" />
                <path d="M52 160 C95 80,150 58,213 82 C270 104,254 159,320 156 C390 150,426 103,470 70" fill="none" stroke="var(--blue)" strokeWidth="4" strokeLinecap="round" />
                <path d="M80 150 C150 100,220 100,300 150 C360 185,420 120,465 82" fill="none" stroke="var(--yellow)" strokeWidth="2" strokeDasharray="5,5" opacity="0.9" />
                <circle cx="52" cy="160" r="5" fill="var(--accent)" />
                <text x="60" y="165" fill="var(--accent)" fontSize="11" fontFamily="JetBrains Mono,monospace">T1 San Donato</text>
                <text x="205" y="72" fill="var(--yellow)" fontSize="11" fontFamily="JetBrains Mono,monospace">Poggio Secco crest</text>
                <text x="330" y="148" fill="var(--green)" fontSize="11" fontFamily="JetBrains Mono,monospace">Arrabbiata load</text>
                <text x="390" y="96" fill="var(--blue)" fontSize="11" fontFamily="JetBrains Mono,monospace">Bucine exit</text>
              </svg>
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {VIEW_MODES.map(mode => {
                const active = activeViewMode === mode;
                return <button key={mode} type="button" onClick={() => setActiveViewMode(mode)} style={{ border: `1px solid ${active ? 'var(--accent)' : 'var(--border)'}`, background: active ? 'rgba(224,55,55,0.10)' : 'rgba(255,255,255,0.03)', color: active ? 'var(--accent)' : 'var(--text-muted)', borderRadius: 999, padding: '5px 9px', fontSize: 10, cursor: 'pointer' }}>{mode}</button>;
              })}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><Gauge size={14} />Elevation & Gradient Brief</span>
            <span className="badge badge-yellow">procedural gradient</span>
          </div>
          <div className="card-body">
            <div className="grid-2" style={{ marginBottom: 16 }}>
              <StatTile label="Altitude variance" value="41.19 m" color="var(--blue)" />
              <StatTile label="Highest section" value="Poggio Secco" color="var(--yellow)" />
            </div>
            {[
              'Main straight crest ─—™ San Donato braking',
              'Casanova/Savelli downhill transition',
              'Arrabbiata 1/2 high-speed load',
              'Bucine exit onto main straight',
            ].map(item => <div key={item} style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>—¢ {item}</div>)}
            <div style={{ marginTop: 14, padding: '10px 12px', border: '1px solid rgba(245,158,11,0.18)', background: 'rgba(245,158,11,0.07)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 }}>
              <strong style={{ color: 'var(--yellow)' }}>Engineering implication:</strong> suspension and braking setup must handle cresting, compression and rear load transfer before committing to race trim.
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2 mb-4">
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><Calendar size={14} />Weekend Schedule & Data Readiness</span>
            <span className="badge badge-muted">Class: KDD Prototype Simulation</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Session</th><th>Day / Time</th><th>Status</th><th>Result</th><th>Data quality</th><th>Engineering note</th></tr></thead>
              <tbody>
                {WEEKEND_SCHEDULE.map(row => (
                  <tr key={row.session} style={row.session === 'Race' ? { background: 'rgba(245,158,11,0.08)' } : {}}>
                    <td style={{ fontWeight: 800 }}>{row.session}</td>
                    <td className="mono text-dim">{row.day} {row.time}</td>
                    <td><StatusBadge status={row.status} /></td>
                    <td>{row.result}</td>
                    <td className="mono">{row.dataQuality}</td>
                    <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{row.note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><BarChart2 size={14} />Pace Evolution</span>
            <span className="badge badge-green">-0.901s total</span>
          </div>
          <div className="card-body">
            <PaceEvolutionChart />
            <div style={{ marginTop: 12 }}>
              {PACE_EVOLUTION.map(item => (
                <div key={item.session} style={{ display: 'grid', gridTemplateColumns: '42px 80px 1fr 88px', gap: 10, alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span className="badge badge-muted">{item.session}</span>
                  <span className="mono" style={{ color: 'var(--text)', fontWeight: 800 }}>{item.lap}</span>
                  <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{item.setup} —· {item.tyres} —· track {item.trackTemp}</span>
                  <span className="mono" style={{ color: item.session === 'FP1' ? 'var(--text-muted)' : 'var(--green)', fontWeight: 800 }}>{item.gain}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 }}>
              <strong style={{ color: 'var(--green)' }}>Main gain:</strong> Sector 2 —· -0.420s. <strong style={{ color: 'var(--yellow)' }}>Remaining weakness:</strong> Sector 3 —· Bucine exit.
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2 mb-4">
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><CloudSun size={14} />Weather & Track Evolution</span>
            <span className="badge badge-yellow">late rain risk 35%</span>
          </div>
          <div className="card-body">
            <div className="grid-3" style={{ marginBottom: 14 }}>
              {[
                { label: 'Race start', value: '14:00 —· 28—°C —· rain 5%', icon: <CloudSun size={18} style={{ color: 'var(--yellow)' }} /> },
                { label: 'Mid race', value: '15:00 —· 28—°C —· rain 10%', icon: <Wind size={18} style={{ color: 'var(--text-muted)' }} /> },
                { label: 'Late race', value: '16:00 —· 26—°C —· rain 35%', icon: <CloudRain size={18} style={{ color: 'var(--blue)' }} /> },
              ].map(item => (
                <div key={item.label} style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.03)' }}>
                  {item.icon}
                  <div className="card-label" style={{ marginTop: 8 }}>{item.label}</div>
                  <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 800 }}>{item.value}</div>
                </div>
              ))}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text)' }}>Strategy implication:</strong> Race likely starts dry. Rain risk increases near race end. Wet setup and rain tyres must be ready.<br />
              <strong style={{ color: 'var(--blue)' }}>Impact if rain arrives after Lap 18:</strong> Soft rear degradation slows, Hard option loses warm-up advantage, flag-to-flag probability increases to 18%.
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><Thermometer size={14} />Tyre Allocation & Plan</span>
            <span className="badge badge-green">race plan selected</span>
          </div>
          <div className="card-body">
            <div className="grid-2" style={{ marginBottom: 14 }}>
              <div>
                <div className="card-label" style={{ marginBottom: 8 }}>Front</div>
                {['Soft: 2 new / 1 used', 'Medium: 3 new / 1 used', 'Hard: 2 new / 1 used', 'Wet: approved'].map(row => <div key={row} style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>—¢ {row}</div>)}
              </div>
              <div>
                <div className="card-label" style={{ marginBottom: 8 }}>Rear</div>
                {['Soft: 3 new / 0 used', 'Medium: 2 new / 2 used', 'Hard: 2 new / 1 used', 'Wet: approved'].map(row => <div key={row} style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 6 }}>—¢ {row}</div>)}
              </div>
            </div>
            <div className="grid-3">
              <StatTile label="Race plan" value="F Medium —· R Soft" color="var(--green)" />
              <StatTile label="Backup dry" value="F Medium —· R Hard" color="var(--yellow)" />
              <StatTile label="Rain plan" value="Wet ready" color="var(--blue)" />
            </div>
            <div style={{ marginTop: 14, padding: '10px 12px', border: '1px solid rgba(224,55,55,0.18)', background: 'rgba(224,55,55,0.07)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--accent)' }}>Tyre risk:</strong> rear soft thermal cliff from L13 if track temperature exceeds 46—°C.
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2 mb-4">
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><Gauge size={14} />Setup Baseline</span>
            <span className="badge badge-blue">Q2 Race Adapted</span>
          </div>
          <div className="card-body">
            <div className="grid-3" style={{ marginBottom: 16 }}>
              <StatTile label="Front preload" value="0.75" />
              <StatTile label="Front comp/rebound" value="8 / 11 clicks" />
              <StatTile label="Rear preload" value="1.00" />
              <StatTile label="Rear comp H/L" value="6 / 9" />
              <StatTile label="Rear rebound" value="7 clicks" />
              <StatTile label="Engine brake" value="EB4" color="var(--yellow)" />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text)' }}>Electronics:</strong> Launch MAP-4 —· Race MAP-6 —· TC race TC4 —· Start TC6.<br />
              <strong style={{ color: 'var(--text)' }}>Setup focus:</strong> rear stability out of Bucine, brake support into San Donato, flow through Arrabbiata 1/2.
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><Cpu size={14} />KDD Pre-Race Analysis</span>
            <span className="badge badge-green">Completed —· 87% confidence</span>
          </div>
          <div className="card-body">
            <div className="grid-3" style={{ marginBottom: 16 }}>
              <StatTile label="Qualifying" value="P3 —· front row" color="var(--yellow)" />
              <StatTile label="Race projection" value="P2——œP3" color="var(--green)" />
              <StatTile label="Simulation" value={`${MUGELLO_CIRCUIT.raceLaps} laps —· 5k MC`} color="var(--blue)" />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--green)' }}>Main opportunity:</strong> Sector 2 and Bucine exit.<br />
              <strong style={{ color: 'var(--accent)' }}>Main risk:</strong> rear soft thermal load from L13.<br />
              <strong style={{ color: 'var(--text)' }}>Strategic recommendation:</strong> start Front Medium / Rear Soft. Protect rear L1——œL5. Attack P2 only if gap &lt;0.6s before San Donato.
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title flex items-center gap-2"><Target size={14} />Rival Intelligence —· KDD Scout Agent</span>
          <button type="button" onClick={() => setShowRivalDetail(v => !v)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', borderRadius: 5, cursor: 'pointer', color: 'var(--text-muted)', fontSize: 11, fontFamily: 'JetBrains Mono,monospace' }}>
            {showRivalDetail ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            {showRivalDetail ? 'Hide detail' : 'Show detail'}
          </button>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead><tr><th>Grid</th><th>Rider</th><th>Team</th><th>Race Pace</th><th>Tyre</th><th>Strength</th><th>Weakness</th><th>Trend</th><th>Threat</th><th>Strategy</th></tr></thead>
            <tbody>
              {RIVAL_PROFILES.map(rival => (
                <tr key={rival.rider} style={rival.self ? { background: 'var(--accent-dim)' } : {}}>
                  <td className="mono">{rival.grid}</td>
                  <td style={{ fontWeight: rival.self ? 800 : 600, color: rival.self ? 'var(--accent)' : 'var(--text)' }}>{rival.rider}</td>
                  <td className="text-dim">{rival.team}</td>
                  <td className="mono">{rival.pace}</td>
                  <td className="mono text-dim">{rival.tyre}</td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{rival.strength}</td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>{rival.weakness}</td>
                  <td style={{ fontSize: 11 }}>{rival.trend}</td>
                  <td><span className={`badge ${rival.threat.includes('High') ? 'badge-red' : rival.threat.includes('Medium') ? 'badge-yellow' : rival.self ? 'badge-red' : 'badge-muted'}`}>{rival.threat}</span></td>
                  <td style={{ minWidth: 230, fontSize: 11, color: 'var(--text-muted)' }}>{rival.strategy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {showRivalDetail && (
          <div className="card-body" style={{ borderTop: '1px solid var(--border)' }}>
            <div className="grid-2">
              <div className="insight-panel" style={{ ['--dot-color' as string]: 'var(--green)' }}>
                <div className="insight-panel__title" style={{ color: 'var(--green)' }}>Attack P2</div>
                <p className="insight-panel__body">Best zone: T1 San Donato after slipstream. Secondary: Bucine exit into main straight. Attack only if gap is &lt;0.6s before the braking marker.</p>
              </div>
              <div className="insight-panel" style={{ ['--dot-color' as string]: 'var(--yellow)' }}>
                <div className="insight-panel__title" style={{ color: 'var(--yellow)' }}>Defend P4</div>
                <p className="insight-panel__body">Protect inside into San Donato, avoid poor exit from Bucine and do not overheat the rear in the first five laps.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid-3 mb-4">
        <div className="insight-panel" style={{ ['--dot-color' as string]: 'var(--yellow)' }}>
          <div className="insight-panel__title" style={{ color: 'var(--yellow)' }}>Tyre Strategy —· Dry Race Mode</div>
          <p className="insight-panel__body">Recommended Front Medium / Rear Soft. Objective: manage rear soft to race distance. Risk begins around L13. Backup: Front Medium / Rear Hard if track temp exceeds 48—°C.</p>
        </div>
        <div className="insight-panel" style={{ ['--dot-color' as string]: 'var(--blue)' }}>
          <div className="insight-panel__title" style={{ color: 'var(--blue)' }}>Sector Opportunity —· S2</div>
          <p className="insight-panel__body">Target Casanova ─—™ Savelli ─—™ Arrabbiata 1/2. Gap to P2: +0.08s. Improve throttle pickup out of Savelli and reduce steering correction through Arrabbiata 2.</p>
        </div>
        <div className="insight-panel" style={{ ['--dot-color' as string]: 'var(--green)' }}>
          <div className="insight-panel__title" style={{ color: 'var(--green)' }}>Grid Start Strategy</div>
          <p className="insight-panel__body">P3 Row 1 —· Launch MAP-4 —· Start TC6 —· clutch slip 8%. Plan A: hold inside into San Donato. Plan B: outside cutback if boxed in. Do not overheat rear with launch spin.</p>
        </div>
      </div>

      <div className="grid-2 mb-4">
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><Flag size={14} />Rain / Flag-to-Flag Contingency</span>
            <span className="badge badge-yellow">pending wet validation</span>
          </div>
          <div className="card-body" style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            <strong style={{ color: 'var(--text)' }}>Trigger:</strong> rain probability &gt;30% or sector wet flag confirmed.<br />
            <strong style={{ color: 'var(--text)' }}>Bike B:</strong> wet setup loaded.<br />
            <strong style={{ color: 'var(--text)' }}>Tyres:</strong> wet approved —· intermediate standby.<br />
            <strong style={{ color: 'var(--text)' }}>Electronics:</strong> Rain MAP-2 —· TC rain TC8 —· EB5.<br />
            <strong style={{ color: 'var(--blue)' }}>Rider instruction:</strong> avoid kerbs through Biondetti 1/2, brake earlier into San Donato, protect front wet temperature.
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><ClipboardList size={14} />Session Objectives</span>
            <span className="badge badge-blue">operational brief</span>
          </div>
          <div className="card-body">
            {[
              ['FP1', 'Validate baseline gearing and brake stability at San Donato.'],
              ['FP2', 'Compare rear soft vs medium degradation.'],
              ['FP3', 'Race pace run and fuel load calibration.'],
              ['Q2', 'Maximize front-row start.'],
              ['Warm-up', 'Confirm rear pressure and launch map.'],
              ['Race', 'Hold P3 at start, protect rear until L5, attack P2 if gap <0.6s.'],
            ].map(([label, text]) => (
              <div key={label} style={{ display: 'grid', gridTemplateColumns: '72px 1fr', gap: 10, padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="mono" style={{ color: 'var(--blue)', fontWeight: 800 }}>{label}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2 mb-4">
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><CheckCircle size={14} />Pre-GP Checklist</span>
            <span className="badge badge-yellow">{completedChecks} / {CHECKLIST.length} complete</span>
          </div>
          <div className="card-body">
            {CHECKLIST.map(item => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: '1px solid var(--border)', gap: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.label}</span>
                <span className={`badge ${item.status === CHECK_STATUS.COMPLETE ? 'badge-green' : 'badge-yellow'}`}>{item.status === CHECK_STATUS.COMPLETE ? 'Complete' : 'Pending validation'}</span>
              </div>
            ))}
            <div style={{ marginTop: 12, padding: '10px 12px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)' }}>
              Missing: wet setup validation.
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><Shield size={14} />Data Sources & Integrity</span>
            <span className="badge badge-green">91% confidence</span>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead><tr><th>Source</th><th>Status</th><th>Quality</th></tr></thead>
              <tbody>
                {DATA_SOURCES.map(source => (
                  <tr key={source.source}>
                    <td style={{ fontWeight: 700 }}>{source.source}</td>
                    <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{source.status}</td>
                    <td className="mono" style={{ color: source.quality === 'active' ? 'var(--blue)' : 'var(--green)' }}>{source.quality}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title flex items-center gap-2"><Target size={14} />Engineer Brief</span>
          <span className="badge badge-blue">final pre-race call</span>
        </div>
        <div className="card-body">
          <div className="grid-4" style={{ marginBottom: 16 }}>
            <StatTile label="Priority 1" value="Protect rear L1——œL5" color="var(--green)" />
            <StatTile label="Priority 2" value="Attack P2 at T1" color="var(--yellow)" />
            <StatTile label="Priority 3" value="Monitor rear from L8" color="var(--accent)" />
            <StatTile label="Priority 4" value="Wet plan from 16:00" color="var(--blue)" />
          </div>
          <div style={{ padding: '12px 14px', background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)', borderRadius: 'var(--radius-lg)', fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.55 }}>
              <strong style={{ color: 'var(--green)' }}>Final call:</strong> race starts dry. Keep rain plan ready but do not compromise dry setup. Before competing, the team has locked Mugello session truth, exposed procedural geometry status, checked historical telemetry, selected setup, modelled rivals and locked a race operating plan.
          </div>
        </div>
      </div>
    </div>
  );
}

function parseLapTime(lapTime: string): number {
  const [minutes, seconds] = lapTime.split(':');
  return parseInt(minutes, 10) * 60 + parseFloat(seconds);
}

export default PreGrandPrixPage;
