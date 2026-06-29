import {
  BarChart3,
  Bike,
  Brain,
  CheckCircle,
  Circle,
  ClipboardList,
  FileText,
  Headphones,
  Lightbulb,
  MessageSquare,
  Route,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Timer,
  Vote,
  Wrench,
  Zap,
} from 'lucide-react';
import { useNavigate } from '../context/NavContext';
import { useGarage } from '../hooks/useGarage';
import { getActiveCircuit } from '../domain/circuits';

interface Advisor {
  name: string;
  role: string;
  status: 'active' | 'standby';
  icon: typeof Brain;
  color: string;
  focus: string;
  evidence: string[];
  recommendation: string;
  confidence: number;
  vote: string;
}

interface CouncilVote {
  advisor: string;
  vote: string;
  reason: string;
  color: string;
}

interface ActionStackItem {
  priority: string;
  type: string;
  action: string;
  color: string;
}

const ADVISORS: Advisor[] = [
  {
    name: 'Crew Chief AI',
    role: 'Strategic command and race calls',
    status: 'active',
    icon: Headphones,
    color: 'var(--accent)',
    focus: 'Next-stint strategy',
    evidence: ['Pace gain is available only if rear stability improves first.', 'Bucine exit instability is limiting the push-lap window.'],
    recommendation: 'Do not chase a full push lap until T15 Bucine exit is stable.',
    confidence: 90,
    vote: 'Conditional support',
  },
  {
    name: 'Telemetry Sage',
    role: 'Data, channels and anomaly detection',
    status: 'active',
    icon: BarChart3,
    color: 'var(--blue)',
    focus: 'Rear slip and brake chatter',
    evidence: ['Rear slip peaks at 14% at T15 Bucine.', 'Brake chatter detected at 18 Hz into T1 San Donato.'],
    recommendation: 'Validate rear rebound +2 clicks and front compression -1 click.',
    confidence: 82,
    vote: 'Support rear-stability plan',
  },
  {
    name: 'Rider Mentor AI',
    role: 'Riding technique and execution',
    status: 'active',
    icon: Bike,
    color: 'var(--purple)',
    focus: 'Throttle timing and lean management',
    evidence: ['Throttle opens 0.3–0.4s late at T15 Bucine.', 'Lean remains above 55° during initial pickup.'],
    recommendation: 'Open throttle 0.3s earlier only after reducing lean below 54°.',
    confidence: 88,
    vote: 'Technique correction first',
  },
  {
    name: 'Safety Guardian',
    role: 'Risk, grip and crash-prevention',
    status: 'active',
    icon: ShieldCheck,
    color: 'var(--green)',
    focus: 'Grip limit and rear tyre thermal load',
    evidence: ['Rear grip down 12%.', 'Rear temperature above safe operating threshold.', 'Lean peaks at 56–57°.'],
    recommendation: 'Do not reduce TC while rear temperature remains high. Abort push lap if rear peak exceeds 124°C.',
    confidence: 95,
    vote: 'Safety conditional',
  },
  {
    name: 'Lap Time Alchemist',
    role: 'Pace modelling and gain extraction',
    status: 'active',
    icon: Timer,
    color: 'var(--yellow)',
    focus: 'Potential lap-time recovery',
    evidence: ['Potential gain -1.284s.', 'Main gain zones: T15 Bucine, T1 San Donato and T12 Correntaio.'],
    recommendation: 'Work exit drive first; apex speed is secondary.',
    confidence: 86,
    vote: 'Support plan',
  },
  {
    name: 'Garage Engineer AI',
    role: 'Setup, mechanics and next-stint configuration',
    status: 'active',
    icon: Wrench,
    color: 'var(--accent)',
    focus: 'Rear instability on exits',
    evidence: ['Rear rebound may return too fast.', 'Rear pressure must be checked hot.', 'TC may need localized support.'],
    recommendation: 'Slow rear rebound by +2 clicks and validate rear hot pressure immediately after stint.',
    confidence: 84,
    vote: 'Support with setup change',
  },
  {
    name: 'Session Chronicler',
    role: 'Debrief, reporting and learning memory',
    status: 'standby',
    icon: FileText,
    color: 'var(--blue)',
    focus: 'Post-stint report',
    evidence: ['Stint 03 report ready.', 'Before → after improvement: -1.326s.'],
    recommendation: 'Store the decision and generate rider-facing next-stint notes.',
    confidence: 93,
    vote: 'No active vote',
  },
];

const COUNCIL_VOTES: CouncilVote[] = [
  { advisor: 'Crew Chief AI', vote: 'Conditional yes', reason: 'Useful only if rear slip persists.', color: 'var(--yellow)' },
  { advisor: 'Telemetry Sage', vote: 'Yes', reason: 'Rear slip peaks at 14% at T15 Bucine.', color: 'var(--green)' },
  { advisor: 'Rider Mentor AI', vote: 'No, not as first action', reason: 'Rider must correct throttle timing before electronics masks the issue.', color: 'var(--accent)' },
  { advisor: 'Safety Guardian', vote: 'Yes, conditionally', reason: 'Rear temp and grip loss increase crash exposure.', color: 'var(--yellow)' },
  { advisor: 'Lap Time Alchemist', vote: 'Conditional', reason: 'TC may cost drive onto the main straight.', color: 'var(--yellow)' },
  { advisor: 'Garage Engineer AI', vote: 'Yes, Sector 3 only', reason: 'Localized rear instability, not global traction issue.', color: 'var(--green)' },
];

const ACTION_STACK: ActionStackItem[] = [
  { priority: 'Priority 1', type: 'Rider correction', action: 'T15 Bucine · open throttle 0.3s earlier after lean <54°.', color: 'var(--blue)' },
  { priority: 'Priority 2', type: 'Setup change', action: 'Rear rebound +2 clicks slower.', color: 'var(--green)' },
  { priority: 'Priority 3', type: 'Electronics condition', action: 'TC +1 in Sector 3 only if rear slip >12%.', color: 'var(--yellow)' },
  { priority: 'Priority 4', type: 'Safety watch', action: 'Abort push lap if rear tyre peak exceeds 124°C.', color: 'var(--accent)' },
  { priority: 'Priority 5', type: 'Validation', action: 'Compare laps 2–4 against Stint 03 baseline.', color: 'var(--text-muted)' },
];

const ENGINEER_ACTIONS = [
  'Approve Oracle recommendation',
  'Modify action stack',
  'Reject recommendation',
  'Ask Oracle why',
  'Simulate alternative',
  'Send to rider dashboard',
  'Send to garage setup',
  'Create next-stint checklist',
  'Generate report',
];

function MetricTile({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div>
      <div className="card-label">{label}</div>
      <div className="text-mono" style={{ fontSize: 18, fontWeight: 900, color: color ?? 'var(--text)' }}>{value}</div>
    </div>
  );
}

function ConsensusBar({ value }: { value: number }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
        <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Agreement level</span>
        <span className="text-mono" style={{ fontSize: 11, color: 'var(--green)', fontWeight: 900 }}>{value}%</span>
      </div>
      <div className="bar-track" style={{ height: 7 }}>
        <div className="bar-fill" style={{ width: `${value}%`, background: 'var(--green)' }} />
      </div>
    </div>
  );
}

export function AICrewPage() {
  const garage = useGarage();
  const navigate = useNavigate();
  const activeAdvisors = ADVISORS.filter(advisor => advisor.status === 'active').length;

  function askOracle(prompt: string) {
    navigate('copilot', prompt);
  }

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Oracle Pit Wall</h1>
          <p className="page-subtitle">AI Council of Race Engineers · {garage.profile.rider.name} · {garage.profile.bike.brand} {garage.profile.bike.model} · {getActiveCircuit().name} {getActiveCircuit().layout}</p>
        </div>
        <div className="flex items-center gap-2" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span className="badge badge-green">Council status · {activeAdvisors} / {ADVISORS.length} advisors active</span>
          <span className="badge badge-blue">Consensus strong · 84%</span>
        </div>
      </div>

      <div className="card mb-4" style={{
 background: 'linear-gradient(135deg, rgba(224,55,55,0.10), rgba(59,130,246,0.04))' }}>
        <div className="card-header">
          <span className="card-title flex items-center gap-2"><Sparkles size={15} style={{ color: 'var(--accent)' }} /> Oracle Verdict</span>
          <span className="badge badge-green">Approved by 5 / 6 active advisors</span>
        </div>
        <div className="card-body">
          <div className="grid-3" style={{ alignItems: 'start' }}>
            <div>
              <div className="card-label">Primary recommendation</div>
              <div style={{ fontSize: 20, fontWeight: 900, color: 'var(--text)', lineHeight: 1.25, marginBottom: 8 }}>
                Prioritize rear stability and throttle timing before chasing more apex speed.
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                Telemetry, Safety Guardian and Garage Engineer agree: the limitation is rear instability under throttle, not lack of speed.
              </div>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text)' }}>Next action:</strong> slow rear rebound by +2 clicks, keep TC conditional in Sector 3, and coach the rider to open throttle 0.3s earlier at T15 Bucine after lean drops below 54°.
            </div>
            <div className="grid-2" style={{ gap: 12 }}>
              <MetricTile label="Expected gain" value="-0.42s/lap" color="var(--green)" />
              <MetricTile label="Risk impact" value="-9 pts" color="var(--green)" />
              <MetricTile label="Confidence" value="88%" color="var(--blue)" />
              <MetricTile label="Conflict level" value="Low" color="var(--yellow)" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid-2 mb-4" style={{ gap: 16, alignItems: 'stretch' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><Brain size={14} style={{ color: 'var(--blue)' }} /> Council Consensus</span>
            <span className="badge badge-green">Strong</span>
          </div>
          <div className="card-body">
            <ConsensusBar value={84} />
            <div style={{ marginTop: 14, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.6 }}>
              <strong style={{ color: 'var(--text)' }}>Main agreement:</strong> rear instability on corner exits is the main limiter.<br />
              <strong style={{ color: 'var(--text)' }}>Supporting advisors:</strong> Telemetry Sage, Rider Mentor AI, Safety Guardian, Garage Engineer AI and Lap Time Alchemist.<br />
              <strong style={{ color: 'var(--yellow)' }}>Dissenting view:</strong> Crew Chief AI warns that TC +1 may reduce exit drive onto the main straight.<br />
              <strong style={{ color: 'var(--green)' }}>Final call:</strong> use TC +1 only if rear slip exceeds 12% for two consecutive laps.
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><Route size={14} style={{ color: 'var(--yellow)' }} /> Current Decision Theme</span>
            <span className="badge badge-yellow">rear grip + exit drive</span>
          </div>
          <div className="card-body">
            <div className="grid-3" style={{ marginBottom: 14 }}>
              <MetricTile label="Primary focus" value="T15 Bucine" color="var(--accent)" />
              <MetricTile label="Brake focus" value="T1 San Donato" color="var(--blue)" />
              <MetricTile label="Rotation focus" value="T12 Correntaio" color="var(--yellow)" />
            </div>
            <div style={{ padding: '10px 12px', border: '1px solid rgba(245,158,11,0.18)', borderRadius: 8, background: 'rgba(245,158,11,0.07)', fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 }}>
              Main debate: TC +1 vs rider-only correction. Final call: hybrid approach — rider correction first, conditional electronic support only if slip persists.
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title flex items-center gap-2"><Vote size={14} style={{ color: 'var(--green)' }} /> Council Vote</span>
          <span className="badge badge-blue">Question: apply TC +1 before next stint?</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr><th>Advisor</th><th>Vote</th><th>Reason</th></tr>
            </thead>
            <tbody>
              {COUNCIL_VOTES.map(vote => (
                <tr key={vote.advisor}>
                  <td style={{ fontWeight: 800 }}>{vote.advisor}</td>
                  <td><span className="badge badge-muted" style={{ color: vote.color }}>{vote.vote}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text-muted)' }}>{vote.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-body" style={{ borderTop: '1px solid var(--border)' }}>
          <strong style={{ color: 'var(--green)' }}>Final decision:</strong>{' '}
          <span style={{ color: 'var(--text-muted)' }}>Conditional TC +1 in Sector 3 only if rear slip remains above 12%.</span>
        </div>
      </div>

      <div className="grid-2 mb-4" style={{ gap: 12 }}>
        {ADVISORS.map(advisor => {
          const Icon = advisor.icon;
          return (
            <div key={advisor.name} className="card" style={{ borderColor: `color-mix(in srgb, ${advisor.color} 28%, transparent)` }}>
              <div className="card-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 11, display: 'grid', placeItems: 'center', color: advisor.color, background: `color-mix(in srgb, ${advisor.color} 15%, transparent)`, border: `1px solid color-mix(in srgb, ${advisor.color} 35%, transparent)` }}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 900 }}>{advisor.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{advisor.role}</div>
                  </div>
                </div>
                <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.06em', color: advisor.status === 'active' ? 'var(--green)' : 'var(--text-muted)' }}>
                  <Circle size={7} fill="currentColor" /> {advisor.status === 'active' ? 'ON' : 'STANDBY'}
                </span>
              </div>
              <div className="card-body">
                <div className="card-label">Current focus</div>
                <div style={{ fontSize: 13, fontWeight: 800, color: advisor.color, marginBottom: 10 }}>{advisor.focus}</div>
                <div className="card-label">Evidence</div>
                <ul style={{ margin: '6px 0 12px', paddingLeft: 17, color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.55 }}>
                  {advisor.evidence.map(item => <li key={item}>{item}</li>)}
                </ul>
                <div className="card-label">Recommendation</div>
                <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.55, marginBottom: 12 }}>{advisor.recommendation}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div className="bar-track" style={{ height: 5 }}>
                      <div className="bar-fill" style={{ width: `${advisor.confidence}%`, background: advisor.color }} />
                    </div>
                  </div>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>{advisor.confidence}% conf</span>
                  <span className="badge badge-muted" style={{ color: advisor.color }}>{advisor.vote}</span>
                  <button
                    className="btn btn-ghost btn-sm"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                    onClick={() => askOracle(`As ${advisor.name}, explain your vote "${advisor.vote}" and convert it into one exact next-stint instruction for ${getActiveCircuit().name}.`)}
                  >
                    <MessageSquare size={11} /> Ask
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid-2 mb-4" style={{ gap: 16, alignItems: 'stretch' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><Lightbulb size={14} style={{ color: 'var(--yellow)' }} /> Council Debate</span>
            <span className="badge badge-yellow">resolved</span>
          </div>
          <div className="card-body" style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.65 }}>
            <strong style={{ color: 'var(--text)' }}>Conflict:</strong> Rider Mentor prefers technique correction before electronics. Safety Guardian recommends TC support due to rear thermal load.<br />
            <strong style={{ color: 'var(--green)' }}>Resolution:</strong> hybrid strategy — prioritize smoother throttle pickup, but enable conditional TC +1 if rear slip persists.<br />
            <strong style={{ color: 'var(--yellow)' }}>Risk:</strong> low-medium.<br />
            <strong style={{ color: 'var(--blue)' }}>Expected result:</strong> stability improves without masking rider input.
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><ClipboardList size={14} style={{ color: 'var(--blue)' }} /> Action Stack · Next Stint</span>
            <span className="badge badge-blue">ordered execution</span>
          </div>
          <div className="card-body">
            {ACTION_STACK.map(action => (
              <div key={action.priority} style={{ display: 'grid', gridTemplateColumns: '86px 135px 1fr', gap: 10, alignItems: 'start', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                <span className="mono" style={{ fontSize: 10, color: action.color, fontWeight: 900 }}>{action.priority}</span>
                <span style={{ fontSize: 12, fontWeight: 900, color: 'var(--text)' }}>{action.type}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.45 }}>{action.action}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2" style={{ gap: 16 }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><CheckCircle size={14} style={{ color: 'var(--green)' }} /> Oracle Memory</span>
            <span className="badge badge-muted">learning loop</span>
          </div>
          <div className="card-body" style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.65 }}>
            <strong style={{ color: 'var(--text)' }}>Previous decision:</strong> Stint 02 · reduce engine brake EB4 → EB3.<br />
            <strong style={{ color: 'var(--green)' }}>Outcome:</strong> entry stability improved at T1 San Donato. Exit drive unchanged.<br />
            <strong style={{ color: 'var(--yellow)' }}>Lesson learned:</strong> engine brake adjustment helped entry but did not solve rear slip.<br />
            <strong style={{ color: 'var(--blue)' }}>Current implication:</strong> focus moves to rear rebound and throttle pickup.
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><SlidersHorizontal size={14} style={{ color: 'var(--accent)' }} /> Engineer Control</span>
            <span className="badge badge-red">manual override available</span>
          </div>
          <div className="card-body" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {ENGINEER_ACTIONS.map(action => (
              <button
                key={action}
                type="button"
                className="btn btn-sm"
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                onClick={() => askOracle(`Engineer selected: ${action}. Explain the implications for the Oracle Pit Wall decision and produce the next operational step.`)}
              >
                <Zap size={12} /> {action}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
