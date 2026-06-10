import { useState } from 'react';
import { Wrench, AlertTriangle, Lightbulb, Check, ChevronRight, Activity } from 'lucide-react';
import { useNavigate } from '../context/NavContext';
import { useToast } from '../components/ToastProvider';

/**
 * Garage Setup Advisor (engineer feedback #8) — connects on-track performance to
 * a concrete setup change. Each detected issue reads problem → likely cause →
 * actionable recommendation, and the current setup snapshot highlights exactly
 * which parameters the AI proposes to move.
 */

type Severity = 'high' | 'medium' | 'low';

interface SetupIssue {
  id: string;
  problem: string;
  where: string;
  severity: Severity;
  cause: string;
  recs: string[];
  confidence: number; // 0–1
  touches: string[];  // setup param keys it proposes to change
}

const ISSUES: SetupIssue[] = [
  {
    id: 'rear-instability',
    problem: 'Rear instability on slow-corner exit',
    where: 'Turns 4–7',
    severity: 'high',
    cause: 'Too much throttle opening with low traction, compounded by rear rebound returning too fast — the rear steps out as the bike picks up.',
    recs: ['Raise traction control +1 in sector 2', 'Reduce engine brake in turns 4–6', 'Slow rear rebound by 2 clicks', 'Re-check rear pressure after the stint'],
    confidence: 0.88,
    touches: ['tc', 'engineBrake', 'rearRebound', 'rearPress'],
  },
  {
    id: 'front-chatter',
    problem: 'Front chatter under hard braking',
    where: 'Turn 3',
    severity: 'medium',
    cause: 'Front preload too high feeding a 17–22 Hz vibration into the contact patch as the fork tops out.',
    recs: ['Soften front preload by 0.25', 'Add 1 click of low-speed compression'],
    confidence: 0.74,
    touches: ['frontPreload', 'frontComp'],
  },
  {
    id: 'mid-understeer',
    problem: 'Mid-corner understeer',
    where: 'Turn 9',
    severity: 'low',
    cause: 'Front not loaded on entry — too much trailing brake keeps the front light and the bike runs wide.',
    recs: ['Trail less front brake', 'Lower front ride height by 1 mm'],
    confidence: 0.61,
    touches: ['frontHeight'],
  },
];

interface Param { key: string; label: string; value: string; group: string; }
const SETUP: Param[] = [
  { key: 'frontPreload', label: 'Front preload', value: '0.75', group: 'Front' },
  { key: 'frontComp', label: 'Front compression', value: '8 clicks', group: 'Front' },
  { key: 'frontRebound', label: 'Front rebound', value: '11 clicks', group: 'Front' },
  { key: 'frontHeight', label: 'Front ride height', value: '12 mm', group: 'Front' },
  { key: 'rearPreload', label: 'Rear preload', value: '1.00', group: 'Rear' },
  { key: 'rearComp', label: 'Rear comp (hi/lo)', value: '6 / 9', group: 'Rear' },
  { key: 'rearRebound', label: 'Rear rebound', value: '7 clicks', group: 'Rear' },
  { key: 'rearHeight', label: 'Rear ride height', value: '+2 mm', group: 'Rear' },
  { key: 'frontPress', label: 'Front pressure', value: '1.90 bar', group: 'Tyres' },
  { key: 'rearPress', label: 'Rear pressure', value: '1.70 bar', group: 'Tyres' },
  { key: 'tc', label: 'Traction control', value: 'Level 4', group: 'Electronics' },
  { key: 'engineBrake', label: 'Engine brake', value: 'Level 2', group: 'Electronics' },
  { key: 'powerMap', label: 'Power map', value: 'Map B', group: 'Electronics' },
];

const SEV_COLOR: Record<Severity, string> = { high: 'var(--accent)', medium: 'var(--yellow)', low: 'var(--blue)' };

export function GarageSetupAdvisorPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string>(ISSUES[0].id);
  const active = ISSUES.find(i => i.id === selected) ?? ISSUES[0];
  const groups = ['Front', 'Rear', 'Tyres', 'Electronics'];

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Garage Setup Advisor</h1>
          <p className="page-subtitle">Mugello · Garage Setup Advisor AI · performance → setup change</p>
        </div>
        <span className="badge badge-green" style={{ animation: 'pulse 2s infinite' }}>STINT 03 · 3 findings</span>
      </div>

      <div className="grid-2" style={{ gap: 16, alignItems: 'start' }}>
        {/* Detected issues */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {ISSUES.map(iss => {
            const open = iss.id === selected;
            return (
              <div
                key={iss.id}
                className="card"
                style={{ cursor: 'pointer', borderColor: open ? `color-mix(in srgb, ${SEV_COLOR[iss.severity]} 55%, transparent)` : undefined, boxShadow: open ? `0 0 0 1px ${SEV_COLOR[iss.severity]}` : undefined }}
                onClick={() => setSelected(iss.id)}
              >
                <div className="card-header" style={{ marginBottom: open ? 10 : 0 }}>
                  <span className="card-title flex items-center gap-2">
                    <AlertTriangle size={14} style={{ color: SEV_COLOR[iss.severity] }} />
                    {iss.problem}
                  </span>
                  <span className="badge" style={{ background: `color-mix(in srgb, ${SEV_COLOR[iss.severity]} 15%, transparent)`, color: SEV_COLOR[iss.severity], textTransform: 'uppercase' }}>
                    {iss.severity}
                  </span>
                </div>

                {open && (
                  <>
                    <div style={{ display: 'flex', gap: 14, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginBottom: 12 }}>
                      <span><Activity size={11} style={{ verticalAlign: -1, color: 'var(--accent)' }} /> {iss.where}</span>
                      <span>confidence {(iss.confidence * 100).toFixed(0)}%</span>
                    </div>

                    <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>LIKELY CAUSE</div>
                    <div style={{ fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.5, marginBottom: 12 }}>{iss.cause}</div>

                    <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Lightbulb size={12} style={{ color: 'var(--green)' }} /> RECOMMENDATION
                    </div>
                    <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {iss.recs.map(r => (
                        <li key={r} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: 13, color: 'var(--text)' }}>
                          <Check size={14} style={{ color: 'var(--green)', flex: 'none', marginTop: 2 }} /> {r}
                        </li>
                      ))}
                    </ul>
                    <button className="btn btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
                      onClick={() => { toast({ type: 'success', title: 'Setup change staged', message: `${iss.recs.length} action(s) for "${iss.problem}" sent to the garage.` }); navigate('setup'); }}>
                      Apply to garage setup <ChevronRight size={12} />
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* Current setup snapshot — params the active issue touches are highlighted */}
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><Wrench size={14} style={{ color: 'var(--accent)' }} /> Current setup · Yamaha R1</span>
            <span className="badge badge-yellow">{active.touches.length} proposed changes</span>
          </div>
          {groups.map(g => (
            <div key={g} style={{ marginTop: 12 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>{g.toUpperCase()}</div>
              <div className="grid-2" style={{ gap: 8 }}>
                {SETUP.filter(p => p.group === g).map(p => {
                  const hit = active.touches.includes(p.key);
                  return (
                    <div key={p.key} className="stat-tile" style={{ borderColor: hit ? 'color-mix(in srgb, var(--accent) 50%, transparent)' : undefined, background: hit ? 'var(--accent-dim)' : undefined }}>
                      <div className="stat-tile__label" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                        {hit && <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />}
                        {p.label}
                      </div>
                      <span className="stat-tile__value" style={{ fontSize: 16, color: hit ? 'var(--accent)' : undefined }}>{p.value}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
