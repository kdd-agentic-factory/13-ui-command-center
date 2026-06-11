import {
  AlertTriangle,
  Bike,
  Brain,
  CheckCircle,
  Dumbbell,
  Fingerprint,
  LineChart,
  MapPinned,
  Shield,
  Sparkles,
  Target,
  ThumbsUp,
  Zap,
} from 'lucide-react';

import { getSessionContext } from '../domain/sessionContext';
const TRAIT_STATUS = {
  BELOW: 'below ideal',
  ABOVE: 'above ideal',
  WINDOW: 'in the window',
} as const;

type TraitStatus = (typeof TRAIT_STATUS)[keyof typeof TRAIT_STATUS];

interface StyleTrait {
  label: string;
  score: number;
  status: TraitStatus;
  evidence: string;
  coachNote: string;
  color: string;
}

interface ArchetypeScore {
  label: string;
  score: number;
  color: string;
}

interface CornerImpact {
  corner: string;
  description: string;
  color: string;
}

interface WorkOnItem {
  title: string;
  problem: string;
  target: string;
  focus: string;
}

interface Drill {
  title: string;
  body: string;
  target: string;
}

const STYLE_TRAITS: StyleTrait[] = [
  {
    label: 'Braking aggression',
    score: 82,
    status: TRAIT_STATUS.ABOVE,
    evidence: 'Brake pressure peaks early and deep into T1/T12.',
    coachNote: 'Keep the strength, release smoother.',
    color: 'var(--accent)',
  },
  {
    label: 'Corner-entry speed',
    score: 74,
    status: TRAIT_STATUS.WINDOW,
    evidence: 'Entry speed within ±2 km/h of ideal in 9/15 corners.',
    coachNote: 'No major correction needed.',
    color: 'var(--green)',
  },
  {
    label: 'Mid-corner patience',
    score: 58,
    status: TRAIT_STATUS.BELOW,
    evidence: 'Apex timing rushed by 0.18s average.',
    coachNote: 'Wait longer before pickup.',
    color: 'var(--yellow)',
  },
  {
    label: 'Throttle smoothness',
    score: 54,
    status: TRAIT_STATUS.BELOW,
    evidence: 'Pickup slope too sharp above 40% throttle.',
    coachNote: 'Smooth the first 20–45%.',
    color: 'var(--yellow)',
  },
  {
    label: 'Lean reliance',
    score: 81,
    status: TRAIT_STATUS.ABOVE,
    evidence: '56–57° lean held during initial throttle.',
    coachNote: 'Pick the bike up earlier.',
    color: 'var(--accent)',
  },
  {
    label: 'Line consistency',
    score: 86,
    status: TRAIT_STATUS.WINDOW,
    evidence: 'Lap-to-lap deviation <0.6 m.',
    coachNote: 'Keep this — major strength.',
    color: 'var(--green)',
  },
];

const ARCHETYPES: ArchetypeScore[] = [
  { label: 'Point-and-shoot', score: 78, color: 'var(--accent)' },
  { label: 'Late-braker', score: 84, color: 'var(--yellow)' },
  { label: 'Flow-and-drive', score: 52, color: 'var(--blue)' },
  { label: 'Corner-speed rider', score: 48, color: 'var(--text-muted)' },
  { label: 'Smooth-exit rider', score: 46, color: 'var(--green)' },
];

const STYLE_WORKS: CornerImpact[] = [
  {
    corner: 'T1 San Donato',
    description: 'Hard braking strength gives you stable entry and overtaking potential.',
    color: 'var(--green)',
  },
  {
    corner: 'T12 Correntaio',
    description: 'You can stop the bike confidently and rotate late.',
    color: 'var(--green)',
  },
  {
    corner: 'Stop-go sections',
    description: 'Aggressive entry creates time when the corner requires hard deceleration.',
    color: 'var(--blue)',
  },
];

const STYLE_COSTS: CornerImpact[] = [
  {
    corner: 'T15 Bucine',
    description: 'Bike stays leaned too long, delaying throttle pickup onto the main straight.',
    color: 'var(--accent)',
  },
  {
    corner: 'T7 Savelli',
    description: 'Transition is too abrupt, reducing rear grip on exit.',
    color: 'var(--yellow)',
  },
  {
    corner: 'T8/T9 Arrabbiata',
    description: 'Over-reliance on lean increases tyre edge load and reduces safety margin.',
    color: 'var(--accent)',
  },
  {
    corner: 'T13/T14 Biondetti',
    description: 'Line is repeatable, but pickup is too late after direction change.',
    color: 'var(--yellow)',
  },
];

const STRENGTHS = [
  {
    title: 'Line repeatability',
    body: 'Your racing line is consistent lap after lap. This makes setup changes easier to validate.',
  },
  {
    title: 'Braking confidence',
    body: 'You brake hard and late without major instability. This is useful into T1 San Donato.',
  },
  {
    title: 'Corner-entry commitment',
    body: 'You commit decisively into the corner, especially in heavy braking zones.',
  },
  {
    title: 'Mental rhythm',
    body: 'Your pace does not collapse after a mistake; recovery laps remain controlled.',
  },
];

const WORK_ON: WorkOnItem[] = [
  {
    title: 'Mid-corner patience',
    problem: 'You try to finish the corner too early.',
    target: 'Hold neutral throttle 0.15–0.20s longer before pickup.',
    focus: 'T15 Bucine, T12 Correntaio',
  },
  {
    title: 'Lean-to-throttle transition',
    problem: 'Throttle starts while lean is still above 55°.',
    target: 'Pick the bike up 2–3° before opening above 40%.',
    focus: 'T15 Bucine, T8/T9 Arrabbiata',
  },
  {
    title: 'Throttle ramp',
    problem: 'Initial throttle slope is too sharp.',
    target: 'Smooth pickup from 18% to 42% over 0.3s.',
    focus: 'T7 Savelli, T15 Bucine',
  },
  {
    title: 'Exit-first thinking',
    problem: 'Entry is strong, but exit is sacrificed.',
    target: 'Brake 5–9 m earlier when the following straight matters.',
    focus: 'T1 San Donato, T15 Bucine',
  },
];

const COACHING_CUES = [
  { label: 'Before T15 Bucine', cue: '“Finish the turn before asking for drive.”' },
  { label: 'At throttle pickup', cue: '“Pick it up first, then feed the gas.”' },
  { label: 'Into T1 San Donato', cue: '“Brake strong, release earlier.”' },
  { label: 'Through Arrabbiata', cue: '“Trust the line, do not add lean to fix direction.”' },
];

const DRILLS: Drill[] = [
  {
    title: 'Drill 1 · Bucine exit',
    body: '3 laps focused only on lean-to-throttle transition.',
    target: 'Throttle pickup 0.3s earlier with lean <54°.',
  },
  {
    title: 'Drill 2 · San Donato release',
    body: '3 laps braking 5 m earlier and releasing smoother.',
    target: 'Reduce chatter and improve rotation.',
  },
  {
    title: 'Drill 3 · Arrabbiata flow',
    body: '2 laps with no extra steering correction.',
    target: 'Keep line within ±0.4 m and reduce tyre edge load.',
  },
];

function ScoreBar({ label, score, color }: ArchetypeScore) {
  return (
    <div style={{ marginBottom: 11 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{label}</span>
        <span className="text-mono" style={{ fontSize: 11, color, fontWeight: 900 }}>{score}%</span>
      </div>
      <div className="bar-track" style={{ height: 6 }}>
        <div className="bar-fill" style={{ width: `${score}%`, background: color }} />
      </div>
    </div>
  );
}

function StatTile({ label, value, detail, color }: { label: string; value: string; detail: string; color?: string }) {
  return (
    <div>
      <div className="card-label">{label}</div>
      <div className="text-mono" style={{ fontSize: 18, fontWeight: 900, color: color ?? 'var(--text)' }}>{value}</div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.35 }}>{detail}</div>
    </div>
  );
}

export function RidingStylePage() {
  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Rider Style DNA</h1>
          <p className="page-subtitle">{getSessionContext().setup.rider ?? 'Rubén Juárez'} · {getSessionContext().setup.bike ?? 'Yamaha R1'} · {getSessionContext().circuitName} GP · Rider Coach AI profile</p>
        </div>
        <div className="flex items-center gap-2" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span className="badge badge-blue"><Fingerprint size={11} style={{ verticalAlign: -1, marginRight: 4 }} /> dynamic profile</span>
          <span className="badge badge-green">GPS · IMU · ECU · lap comparison</span>
        </div>
      </div>

      <div className="card mb-4" style={{ background: 'linear-gradient(135deg, rgba(168,85,247,0.10), rgba(59,130,246,0.05))', borderLeft: '4px solid var(--purple)' }}>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
            <div style={{ width: 58, height: 58, borderRadius: 15, flex: 'none', display: 'grid', placeItems: 'center', color: 'var(--purple)', background: 'color-mix(in srgb, var(--purple) 15%, transparent)', border: '1px solid color-mix(in srgb, var(--purple) 35%, transparent)' }}>
              <Bike size={26} />
            </div>
            <div style={{ flex: 1, minWidth: 280 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.14em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>YOUR ARCHETYPE</div>
              <div style={{ fontSize: 23, fontWeight: 900 }}>Point-and-shoot rider · aggressive entry · lean-dependent rotation</div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, lineHeight: 1.55 }}>
                You brake hard and deep, rotate the bike late and rely on lean angle to finish the corner. Fast in stop-go corners and heavy braking zones, but throttle pickup is delayed because the bike stays leaned over too long.
              </div>
            </div>
            <div style={{ minWidth: 220 }}>
              <StatTile label="Mugello style fit" value="72 / 100" detail="needs more flow-and-drive" color="var(--yellow)" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2 mb-4" style={{ gap: 16, alignItems: 'stretch' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><MapPinned size={14} style={{ color: 'var(--blue)' }} /> Circuit Fit · {getSessionContext().circuitName}</span>
            <span className="badge badge-yellow">72 / 100</span>
          </div>
          <div className="card-body" style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65 }}>
            <strong style={{ color: 'var(--text)' }}>Why:</strong> Mugello rewards flow, exit drive and high-speed commitment. Your hard-braking style helps into T1 San Donato and T12 Correntaio, but costs time through flowing sections and long-exit corners.
            <br /><br />
            <strong style={{ color: 'var(--green)' }}>Main adaptation:</strong> less stop-and-go, more roll speed and smoother pickup.
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><Brain size={14} style={{ color: 'var(--purple)' }} /> Archetype Comparison</span>
            <span className="badge badge-blue">vs Mugello ideal</span>
          </div>
          <div className="card-body">
            {ARCHETYPES.map(item => <ScoreBar key={item.label} {...item} />)}
            <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, border: '1px solid rgba(59,130,246,0.18)', background: 'rgba(59,130,246,0.07)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--blue)' }}>Mugello ideal style:</strong> Flow-and-drive · high-speed commitment. Required adaptation: less late rotation, more exit preparation.
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title flex items-center gap-2"><Target size={14} style={{ color: 'var(--accent)' }} /> Style Profile · vs Ideal Window</span>
          <span className="badge badge-muted">0–100 scoring · evidence-based</span>
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {STYLE_TRAITS.map(trait => (
            <div key={trait.label} style={{ display: 'grid', gridTemplateColumns: '190px 1fr 120px', gap: 14, alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{trait.label}</div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 800, color: trait.color, marginTop: 2 }}>{trait.score} / 100 · {trait.status}</div>
              </div>
              <div>
                <div className="bar-track" style={{ height: 8, marginBottom: 5 }}>
                  <div className="bar-fill" style={{ width: `${trait.score}%`, background: trait.color }} />
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.45 }}>
                  Evidence: {trait.evidence} Coach note: {trait.coachNote}
                </div>
              </div>
              <span className={`badge ${trait.status === TRAIT_STATUS.WINDOW ? 'badge-green' : trait.status === TRAIT_STATUS.ABOVE ? 'badge-red' : 'badge-yellow'}`}>{trait.status}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid-2 mb-4" style={{ gap: 16, alignItems: 'start' }}>
        <div className="card" style={{ borderColor: 'color-mix(in srgb, var(--green) 32%, transparent)' }}>
          <div className="card-header"><span className="card-title flex items-center gap-2"><CheckCircle size={14} style={{ color: 'var(--green)' }} /> Where Your Style Works</span></div>
          <div className="card-body">
            {STYLE_WORKS.map(item => (
              <div key={item.corner} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: item.color, marginBottom: 4 }}>{item.corner}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.description}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ borderColor: 'color-mix(in srgb, var(--accent) 32%, transparent)' }}>
          <div className="card-header"><span className="card-title flex items-center gap-2"><AlertTriangle size={14} style={{ color: 'var(--accent)' }} /> Where Your Style Costs Time</span></div>
          <div className="card-body">
            {STYLE_COSTS.map(item => (
              <div key={item.corner} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: item.color, marginBottom: 4 }}>{item.corner}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2 mb-4" style={{ gap: 16, alignItems: 'start' }}>
        <div className="card" style={{ borderColor: 'color-mix(in srgb, var(--green) 32%, transparent)' }}>
          <div className="card-header"><span className="card-title flex items-center gap-2"><ThumbsUp size={14} style={{ color: 'var(--green)' }} /> Strengths · Keep Doing</span></div>
          <div className="card-body">
            {STRENGTHS.map(item => (
              <div key={item.title} style={{ display: 'flex', gap: 9, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                <ThumbsUp size={13} style={{ color: 'var(--green)', flex: 'none', marginTop: 2 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--text)', marginBottom: 3 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ borderColor: 'color-mix(in srgb, var(--yellow) 32%, transparent)' }}>
          <div className="card-header"><span className="card-title flex items-center gap-2"><Target size={14} style={{ color: 'var(--yellow)' }} /> Work On · Personalised</span></div>
          <div className="card-body">
            {WORK_ON.map((item, index) => (
              <div key={item.title} style={{ display: 'flex', gap: 10, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ flex: 'none', width: 22, height: 22, borderRadius: '50%', background: 'rgba(245,158,11,0.12)', color: 'var(--yellow)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 900 }}>{index + 1}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--text)', marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}><strong style={{ color: 'var(--text)' }}>Problem:</strong> {item.problem}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}><strong style={{ color: 'var(--text)' }}>Target:</strong> {item.target}</div>
                  <div style={{ fontSize: 11, color: 'var(--blue)', marginTop: 4 }}>Focus corners: {item.focus}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-3 mb-4" style={{ alignItems: 'stretch' }}>
        <div className="card">
          <div className="card-header"><span className="card-title flex items-center gap-2"><Sparkles size={14} style={{ color: 'var(--blue)' }} /> Coaching Cues</span></div>
          <div className="card-body">
            {COACHING_CUES.map(item => (
              <div key={item.label} style={{ padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--text)', marginBottom: 3 }}>{item.label}</div>
                <div style={{ fontSize: 13, color: 'var(--blue)', lineHeight: 1.4 }}>{item.cue}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title flex items-center gap-2"><Dumbbell size={14} style={{ color: 'var(--green)' }} /> Next Session Drills</span></div>
          <div className="card-body">
            {DRILLS.map(drill => (
              <div key={drill.title} style={{ padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: 'var(--text)', marginBottom: 4 }}>{drill.title}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{drill.body}</div>
                <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 4 }}>Target: {drill.target}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title flex items-center gap-2"><Shield size={14} style={{ color: 'var(--yellow)' }} /> Style Risk</span></div>
          <div className="card-body">
            <div className="grid-2" style={{ marginBottom: 14 }}>
              <StatTile label="Current risk" value="Medium" detail="style-linked crash exposure" color="var(--yellow)" />
              <StatTile label="Risk pattern" value="Lean + throttle" detail="high lean during pickup" color="var(--accent)" />
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text)' }}>Crash-risk link:</strong> rear slip risk increases when throttle exceeds 40% above 55° lean.<br />
              <strong style={{ color: 'var(--green)' }}>Safety recommendation:</strong> do not chase more lean. Chase earlier pickup with less lean.
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 16 }}>
        <div className="card">
          <div className="card-header"><span className="card-title flex items-center gap-2"><LineChart size={14} style={{ color: 'var(--green)' }} /> Style Evolution</span><span className="badge badge-green">+5 points</span></div>
          <div className="card-body">
            <div className="grid-4">
              <StatTile label="Previous stint" value="49 / 100" detail="throttle smoothness" color="var(--text-muted)" />
              <StatTile label="Current stint" value="54 / 100" detail="throttle smoothness" color="var(--yellow)" />
              <StatTile label="Improvement" value="+5 points" detail="positive trend" color="var(--green)" />
              <StatTile label="Target" value="70 / 100" detail="still below target" color="var(--blue)" />
            </div>
          </div>
        </div>

        <div className="card" style={{ borderColor: 'color-mix(in srgb, var(--blue) 35%, transparent)' }}>
          <div className="card-header"><span className="card-title flex items-center gap-2"><Zap size={14} style={{ color: 'var(--blue)' }} /> Rider Coach AI Summary</span></div>
          <div className="card-body" style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.65 }}>
            Your strengths are clear: braking confidence, repeatable lines and strong commitment on entry.
            <br /><br />
            The next step is not to brake harder or lean more. The next step is to make the bike ready to accelerate earlier.
            <br /><br />
            <strong style={{ color: 'var(--blue)' }}>For Mugello, the style adaptation is simple:</strong> less point-and-shoot, more flow-and-drive.
          </div>
        </div>
      </div>
    </div>
  );
}
