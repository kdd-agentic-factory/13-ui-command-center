import { useState } from 'react';
import { Wrench, AlertTriangle, Lightbulb, Check, ChevronRight, Activity, TrendingDown, Gauge, Thermometer, Shield, Ban, Target, User, Settings, Droplets, Siren } from 'lucide-react';
import { useNavigate } from '../context/NavContext';
import { useToast } from '../components/ToastProvider';

/**
 * Garage Setup Advisor (engineer feedback #8) — professional-grade setup
 * hypothesis tool connecting on-track symptoms → telemetry evidence →
 * rider/setup/track split → proposed changes with delta/impact/risk →
 * next-stint validation targets.
 *
 * All Mugello corner names are real: T1 San Donato, T3 Poggio Secco,
 * T7 Savelli, T10 Scarperia, T11 Palagio, T12 Correntaio, T15 Bucine.
 */

/* ── Types ──────────────────────────────────────────────────────────────── */

type Priority = 'High' | 'Medium' | 'Low';

interface TelemetryPoint {
  label: string;
  value: string;
}

interface SetupChange {
  param: string;
  current: string;
  proposed: string;
  delta: string;
  expectedEffect: string;
  risk: string;
}

interface SetupFinding {
  id: string;
  title: string;
  priority: Priority;
  confidence: number;          // 0–1
  affectedZones: string[];
  telemetry: TelemetryPoint[];
  causeRider: string;
  causeSetup: string;
  causeTrack: string;
  changes: SetupChange[];
  validationAction?: string;
  validationTarget?: string;
  riderPct: number;            // rider contribution %
  setupPct: number;            // setup contribution %
  trackPct: number;            // track / tyre contribution %
}

/* ── Data ───────────────────────────────────────────────────────────────── */

const FINDINGS: SetupFinding[] = [
  {
    id: 'rear-instability',
    title: 'Rear instability on corner exit',
    priority: 'High',
    confidence: 0.88,
    affectedZones: ['T7 Savelli exit', 'T12 Correntaio exit', 'T15 Bucine exit'],
    telemetry: [
      { label: 'Rear slip peak', value: '14%' },
      { label: 'Lean at throttle pickup', value: '>55°' },
      { label: 'Rear grip on exit', value: '78%' },
      { label: 'Rear tyre peak temp', value: '130°C' },
    ],
    causeRider: 'Throttle opens too aggressively before the bike is picked up.',
    causeSetup: 'Rear rebound may be returning too fast. Rear tyre pressure may be too low after thermal build-up. TC level may be too low for current rear temperature.',
    causeTrack: 'Track temperature 48°C is increasing rear thermal load.',
    changes: [
      {
        param: 'Traction Control',
        current: 'Level 4',
        proposed: 'Level 5',
        delta: '+1',
        expectedEffect: 'reduce rear slip on throttle pickup',
        risk: 'slight loss of drive onto the straight',
      },
      {
        param: 'Rear rebound',
        current: '7.0 clicks',
        proposed: '9.0 clicks',
        delta: '+2.0 slower',
        expectedEffect: 'calmer rear return on exit',
        risk: 'slower direction change if overdone',
      },
    ],
    validationAction: 'Check rear hot pressure immediately after stint. Target: 1.85–1.90 bar hot.',
    riderPct: 55,
    setupPct: 35,
    trackPct: 10,
  },
  {
    id: 'front-chatter',
    title: 'Front chatter under hard braking',
    priority: 'Medium',
    confidence: 0.76,
    affectedZones: ['T1 San Donato', 'T12 Correntaio'],
    telemetry: [
      { label: 'Brake pressure spike', value: '>92%' },
      { label: 'Chatter frequency', value: '18 Hz' },
      { label: 'Front tyre peak temp', value: '126°C' },
      { label: 'Line deviation on entry', value: '+0.6 m' },
    ],
    causeRider: 'Brake application is abrupt with insufficient feathering on initial lever squeeze.',
    causeSetup: 'Front compression may be too stiff for braking load. Front rebound may not allow the tyre to settle after initial brake pressure. Front pressure is slightly high at 1.90 bar cold.',
    causeTrack: 'High track temperature is increasing front pressure rise when hot.',
    changes: [
      {
        param: 'Front compression',
        current: '8.0 clicks',
        proposed: '7.0 clicks',
        delta: '-1.0 softer',
        expectedEffect: 'reduce chatter into San Donato and Correntaio',
        risk: 'more fork dive if overdone',
      },
      {
        param: 'Front rebound',
        current: '11.0 clicks',
        proposed: '10.0 clicks',
        delta: '-1.0 softer',
        expectedEffect: 'improve front settling during brake release',
        risk: 'less support on trail braking',
      },
    ],
    validationAction: 'Verify hot front pressure after stint. Monitor fork dive under heavy braking.',
    riderPct: 25,
    setupPct: 60,
    trackPct: 15,
  },
  {
    id: 'mid-understeer',
    title: 'Mid-corner understeer',
    priority: 'Low',
    confidence: 0.64,
    affectedZones: ['T3 Poggio Secco', 'T10 Scarperia', 'T11 Palagio'],
    telemetry: [
      { label: 'Apex speed vs ideal', value: '-3 to -5 km/h' },
      { label: 'Line deviation', value: '+0.4 m wide' },
      { label: 'Throttle pickup delay', value: '+0.12 s' },
      { label: 'Lean angle / rotation', value: 'stable but slow' },
    ],
    causeRider: 'Entry speed slightly too low for optimal front loading; rider is not committing to the apex.',
    causeSetup: 'Front ride height may be too high. Rear ride height may not be providing enough pitch for rotation.',
    causeTrack: 'Track camber at Poggio Secco and Scarperia favours rear grip over front bite.',
    changes: [
      {
        param: 'Rear ride height',
        current: '+2 mm',
        proposed: '+3 mm',
        delta: '+1 mm',
        expectedEffect: 'improve turn-in and mid-corner rotation',
        risk: 'may increase instability under braking and reduce rear grip on exit',
      },
    ],
    validationAction: 'Optional test — try +1 mm rear ride height OR -1 mm front ride height. Do not apply both.',
    riderPct: 30,
    setupPct: 50,
    trackPct: 20,
  },
];

/* ── Static setup baseline ──────────────────────────────────────────────── */

interface Param {
  key: string;
  label: string;
  current: string;
  baseline: string;
  proposed: string | null;
  delta: string | null;
  impact: string;
  risk: string;
  group: string;
}

const PARAMS: Param[] = [
  // Front
  { key: 'frontPreload', label: 'Front preload',  current: '0.75',    baseline: '0.75',  proposed: null,   delta: null,       impact: 'braking support acceptable',                                risk: 'no change', group: 'Front' },
  { key: 'frontComp',    label: 'Front compression (0.5-click)', current: '8.0 clicks', baseline: '8.0 clicks', proposed: '7.0 clicks', delta: '-1.0 softer', impact: 'reduce braking chatter',                                       risk: 'more fork dive', group: 'Front' },
  { key: 'frontRebound', label: 'Front rebound (0.5-click)',   current: '11.0 clicks', baseline: '11.0 clicks', proposed: '10.0 clicks', delta: '-1.0 softer', impact: 'improve front settling during brake release',                  risk: 'less trail-braking support', group: 'Front' },
  { key: 'frontHeight',  label: 'Front ride height', current: '12.0 mm',   baseline: '12.0 mm',  proposed: null,   delta: null,       impact: 'geometry stable — no change recommended',                        risk: 'no change', group: 'Front' },
  // Rear
  { key: 'rearPreload',  label: 'Rear preload',     current: '1.00',    baseline: '1.00',  proposed: null,   delta: null,       impact: 'rear balance stable',                                           risk: 'no change', group: 'Rear' },
  { key: 'rearComp',     label: 'Rear comp hi/lo (0.5-click)', current: '6.0 / 9.0',   baseline: '6.0 / 9.0',  proposed: null,   delta: null,       impact: 'no complaint on entry',                                          risk: 'no change', group: 'Rear' },
  { key: 'rearRebound',  label: 'Rear rebound (0.5-click)',    current: '7.0 clicks', baseline: '7.0 clicks', proposed: '9.0 clicks', delta: '+2.0 slower', impact: 'calm rear return on exit',                                       risk: 'slower direction change', group: 'Rear' },
  { key: 'rearHeight',   label: 'Rear ride height', current: '+2.0 mm',   baseline: '+2.0 mm',  proposed: '+3.0 mm (optional test)', delta: '+1.0 mm', impact: 'improve mid-corner rotation (understeer finding only)',           risk: 'may reduce rear grip on exit', group: 'Rear' },
  // Tyres
  { key: 'frontPress',   label: 'Front pressure',   current: '1.90 bar', baseline: '1.86 bar', proposed: '1.86 bar cold', delta: '-0.04 bar', impact: 'reduce hot pressure peak, lower chatter amplitude',              risk: 'less front support if too low', group: 'Tyres' },
  { key: 'rearPress',    label: 'Rear pressure',    current: '1.70 bar', baseline: '1.72 bar', proposed: null,   delta: null,       impact: 'verify hot — do not change cold target yet',                      risk: 'monitor hot build-up', group: 'Tyres' },
  // Electronics
  { key: 'tc',           label: 'Traction control',  current: 'Level 4', baseline: 'Level 4',  proposed: 'Level 5', delta: '+1',       impact: 'reduce rear slip on throttle pickup',                             risk: 'slight loss of exit drive', group: 'Electronics' },
  { key: 'engineBrake',  label: 'Engine brake',     current: 'Level 2', baseline: 'Level 2',  proposed: null,   delta: null,       impact: 'keep — rear exit instability is not entry-related',               risk: 'no change', group: 'Electronics' },
  { key: 'powerMap',     label: 'Power map',        current: 'Map B',   baseline: 'Map B',   proposed: null,   delta: null,       impact: 'no top-speed deficit detected',                                   risk: 'no change', group: 'Electronics' },
];

const PRIORITY_COLOR: Record<Priority, string> = {
  High: 'var(--accent)',
  Medium: 'var(--yellow)',
  Low: 'var(--blue)',
};

/* ── Helpers ────────────────────────────────────────────────────────────── */

const pctBar = (pct: number, color: string, size = 60) => (
  <div style={{ width: size, height: 5, borderRadius: 3, background: 'var(--bg-tertiary)', overflow: 'hidden', display: 'inline-block', verticalAlign: 'middle' }}>
    <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3 }} />
  </div>
);

/* ── Page component ─────────────────────────────────────────────────────── */

export function GarageSetupAdvisorPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selected, setSelected] = useState<string>(FINDINGS[0].id);
  const active = FINDINGS.find(f => f.id === selected) ?? FINDINGS[0];
  const groups = ['Front', 'Rear', 'Tyres', 'Electronics'];

  const totalChanges = PARAMS.filter(p => p.delta !== null && p.delta !== 'no change' && p.delta !== null).length;
  // Count unique proposed changes (a param with a non-null, non-zero delta)
  const proposedCount = PARAMS.filter(p => p.proposed !== null).length;

  return (
    <div className="page">

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ════════════════════════════════════════════════════════════════ */}

      <div className="card" style={{ marginBottom: 16, padding: '16px 20px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <div>
            <h1 className="page-title" style={{ fontSize: 20, letterSpacing: '-0.02em' }}>GARAGE SETUP ADVISOR</h1>
            <p className="page-subtitle" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              Performance issue → setup hypothesis → next-stint change
            </p>
          </div>
          <div style={{ textAlign: 'right', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>
            <div>Stint 03</div>
            <div style={{ color: 'var(--green)' }}>3 findings · {proposedCount} proposed changes · confidence 82%</div>
          </div>
        </div>

        {/* Session context bar */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center',
          padding: '8px 12px', borderRadius: 6,
          border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)',
          fontSize: 11, fontFamily: 'var(--font-mono)',
        }}>
          <span><span style={{ color: 'var(--text-muted)' }}>Circuit</span> <strong style={{ color: 'var(--text)' }}>Mugello</strong></span>
          <span className="sep" style={{ width: 1, height: 14, background: 'var(--border)' }} />
          <span><span style={{ color: 'var(--text-muted)' }}>Bike</span> <strong style={{ color: 'var(--text)' }}>Yamaha R1</strong></span>
          <span className="sep" style={{ width: 1, height: 14, background: 'var(--border)' }} />
          <span><span style={{ color: 'var(--text-muted)' }}>Condition</span> <strong style={{ color: 'var(--yellow)' }}>Dry</strong> · Track <strong>48°C</strong></span>
          <span className="sep" style={{ width: 1, height: 14, background: 'var(--border)' }} />
          <span><span style={{ color: 'var(--text-muted)' }}>Baseline</span> <strong>Race Baseline FP3</strong></span>
          <span className="sep" style={{ width: 1, height: 14, background: 'var(--border)' }} />
          <span><span style={{ color: 'var(--text-muted)' }}>Active</span> <strong style={{ color: 'var(--accent)' }}>Stint 03</strong></span>
          <span className="sep" style={{ width: 1, height: 14, background: 'var(--border)' }} />
          <span><span style={{ color: 'var(--text-muted)' }}>Validation target</span> <strong style={{ color: 'var(--green)' }}>Next stint · Laps 1–3</strong></span>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* TWO-COLUMN LAYOUT — Findings (left) · Setup Changes (right) */}
      {/* ════════════════════════════════════════════════════════════════ */}

      <div className="grid-2" style={{ gap: 16, alignItems: 'start' }}>

        {/* ─── LEFT: SETUP FINDINGS ─────────────────────────────────── */}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
            SETUP FINDINGS · STINT 03
          </div>

          {FINDINGS.map(f => {
            const open = f.id === selected;
            return (
              <div
                key={f.id}
                className="card"
                style={{
                  cursor: 'pointer',
                  borderColor: open ? `color-mix(in srgb, ${PRIORITY_COLOR[f.priority]} 55%, transparent)` : undefined,
                  boxShadow: open ? `0 0 0 1px ${PRIORITY_COLOR[f.priority]}` : undefined,
                  padding: open ? 14 : 12,
                }}
                onClick={() => setSelected(f.id)}
              >
                {/* ── Finding header ── */}
                <div className="flex items-center justify-between" style={{ marginBottom: open ? 10 : 0 }}>
                  <div className="flex items-center gap-2" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>
                    <AlertTriangle size={14} style={{ color: PRIORITY_COLOR[f.priority], flex: 'none' }} />
                    {f.title}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="badge" style={{ background: `color-mix(in srgb, ${PRIORITY_COLOR[f.priority]} 15%, transparent)`, color: PRIORITY_COLOR[f.priority], textTransform: 'uppercase', fontSize: 10 }}>
                      {f.priority}
                    </span>
                    <ChevronRight size={14} style={{ color: 'var(--text-dim)', transform: open ? 'rotate(90deg)' : undefined, transition: 'transform .15s' }} />
                  </div>
                </div>

                {open && (
                  <>
                    {/* Confidence + zones */}
                    <div style={{ display: 'flex', gap: 14, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)', marginBottom: 10, flexWrap: 'wrap' }}>
                      <span><Gauge size={11} style={{ verticalAlign: -1 }} /> confidence {(f.confidence * 100).toFixed(0)}%</span>
                      {f.affectedZones.map(z => (
                        <span key={z} style={{ background: 'rgba(255,255,255,0.04)', padding: '1px 7px', borderRadius: 4 }}>
                          {z}
                        </span>
                      ))}
                    </div>

                    {/* Telemetry evidence */}
                    <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                      <Activity size={11} style={{ verticalAlign: -1, color: 'var(--accent)' }} /> TELEMETRY EVIDENCE
                    </div>
                    <div className="grid-2" style={{ gap: 4, marginBottom: 10 }}>
                      {f.telemetry.map(t => (
                        <div key={t.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: 'var(--font-mono)', padding: '2px 6px', background: 'rgba(255,255,255,0.02)', borderRadius: 4 }}>
                          <span style={{ color: 'var(--text-dim)' }}>{t.label}</span>
                          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>{t.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Causes split */}
                    <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>LIKELY CAUSE</div>

                    {/* Rider */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                      <User size={13} style={{ color: 'var(--blue)', flex: 'none', marginTop: 2 }} />
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.4 }}>
                        <span style={{ color: 'var(--blue)', fontWeight: 600 }}>Rider input:</span> {f.causeRider}
                      </div>
                    </div>
                    {/* Setup */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 6, alignItems: 'flex-start' }}>
                      <Settings size={13} style={{ color: 'var(--yellow)', flex: 'none', marginTop: 2 }} />
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.4 }}>
                        <span style={{ color: 'var(--yellow)', fontWeight: 600 }}>Setup hypothesis:</span> {f.causeSetup}
                      </div>
                    </div>
                    {/* Track */}
                    <div style={{ display: 'flex', gap: 8, marginBottom: 12, alignItems: 'flex-start' }}>
                      <Thermometer size={13} style={{ color: 'var(--accent)', flex: 'none', marginTop: 2 }} />
                      <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.4 }}>
                        <span style={{ color: 'var(--accent)', fontWeight: 600 }}>Environmental factor:</span> {f.causeTrack}
                      </div>
                    </div>

                    {/* Recommended changes */}
                    <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--green)', fontFamily: 'var(--font-mono)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <Lightbulb size={12} /> RECOMMENDED SETUP CHANGES
                    </div>

                    {f.changes.map((ch, idx) => (
                      <div key={ch.param} style={{
                        padding: '8px 10px', marginBottom: 6, borderRadius: 6,
                        border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)',
                        fontSize: 12,
                      }}>
                        <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>
                          {idx + 1}. {ch.param}: {ch.current} → {ch.proposed}
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px', fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                          <span>Delta: <strong style={{ color: 'var(--accent)' }}>{ch.delta}</strong></span>
                          <span>Risk: <strong style={{ color: 'var(--yellow)' }}>{ch.risk}</strong></span>
                        </div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                          Expected effect: {ch.expectedEffect}
                        </div>
                      </div>
                    ))}

                    {/* Validation action */}
                    {f.validationAction && (
                      <div style={{
                        marginTop: 6, padding: '8px 10px', borderRadius: 6,
                        border: '1px solid color-mix(in srgb, var(--green) 30%, transparent)',
                        background: 'rgba(34,197,94,0.04)',
                        fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)',
                      }}>
                        <span style={{ color: 'var(--green)', fontWeight: 600 }}>▸</span> {f.validationAction}
                      </div>
                    )}

                    {/* Rider vs Setup bar */}
                    <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>
                        <User size={10} style={{ verticalAlign: -1 }} /> RIDER VS SETUP CONTRIBUTION
                      </div>
                      <div style={{ display: 'flex', gap: 12, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
                        <span>Rider <span style={{ color: 'var(--blue)' }}>{f.riderPct}%</span> {pctBar(f.riderPct, 'var(--blue)')}</span>
                        <span>Setup <span style={{ color: 'var(--yellow)' }}>{f.setupPct}%</span> {pctBar(f.setupPct, 'var(--yellow)')}</span>
                        <span>Track <span style={{ color: 'var(--accent)' }}>{f.trackPct}%</span> {pctBar(f.trackPct, 'var(--accent)')}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>

        {/* ─── RIGHT: SETUP CHANGE PLAN + CURRENT SETUP ─────────────── */}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* ── Setup Change Plan ────────────────────────────────────── */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 10 }}>
              <span className="card-title flex items-center gap-2"><Wrench size={14} style={{ color: 'var(--accent)' }} /> SETUP CHANGE PLAN</span>
              <span className="badge badge-yellow">{proposedCount} proposed changes</span>
            </div>

            {/* Column headers */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px 1.1fr 1.1fr',
              gap: 4, fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)',
              letterSpacing: '0.08em', marginBottom: 4, padding: '0 4px',
            }}>
              <span>Parameter</span>
              <span style={{ textAlign: 'center' }}>Current</span>
              <span style={{ textAlign: 'center' }}>Proposed</span>
              <span style={{ textAlign: 'center' }}>Delta</span>
              <span style={{ textAlign: 'center' }}>Expected effect</span>
              <span style={{ textAlign: 'center' }}>Risk</span>
            </div>

            {PARAMS.filter(p => p.proposed !== null).map(p => (
              <div key={p.key} style={{
                display: 'grid', gridTemplateColumns: '1fr 60px 60px 60px 1.1fr 1.1fr',
                gap: 4, alignItems: 'center',
                padding: '5px 4px', borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-mono)',
                background: 'rgba(255,255,255,0.02)', marginBottom: 2,
              }}>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{p.label}</span>
                <span style={{ textAlign: 'center', color: 'var(--text-muted)' }}>{p.current}</span>
                <span style={{ textAlign: 'center', color: 'var(--accent)', fontWeight: 600 }}>{p.proposed}</span>
                <span style={{ textAlign: 'center', color: 'var(--yellow)' }}>{p.delta}</span>
                <span style={{ textAlign: 'center', fontSize: 10, color: 'var(--text-dim)' }}>{p.impact}</span>
                <span style={{ textAlign: 'center', fontSize: 10, color: p.risk === 'no change' ? 'var(--green)' : 'var(--yellow)' }}>{p.risk}</span>
              </div>
            ))}

            {/* Validation action row */}
            <div style={{
              marginTop: 8, padding: '6px 8px', borderRadius: 4,
              border: '1px dashed color-mix(in srgb, var(--green) 30%, transparent)',
              fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)',
            }}>
              <span style={{ color: 'var(--green)' }}>▸ Validation:</span> Check rear hot pressure after stint · Target 1.85–1.90 bar hot
            </div>
          </div>

          {/* ── Current Setup ───────────────────────────────────────── */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 10 }}>
              <span className="card-title flex items-center gap-2"><Settings size={14} style={{ color: 'var(--accent)' }} /> CURRENT SETUP · YAMAHA R1</span>
              <span className="badge badge-blue" style={{ fontSize: 10 }}>Baseline: Race Baseline FP3</span>
            </div>
            {groups.map(g => (
              <div key={g} style={{ marginTop: 10 }}>
                <div style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 4 }}>{g.toUpperCase()}</div>
                <div className="grid-2" style={{ gap: 6 }}>
                  {PARAMS.filter(p => p.group === g).map(p => {
                    const hasChange = p.proposed !== null;
                    return (
                      <div key={p.key} className="stat-tile" style={{
                        borderColor: hasChange ? 'color-mix(in srgb, var(--accent) 50%, transparent)' : undefined,
                        background: hasChange ? 'var(--accent-dim)' : undefined,
                      }}>
                        <div className="stat-tile__label" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10 }}>
                          {hasChange && <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--accent)', display: 'inline-block' }} />}
                          {p.label}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                          <span className="stat-tile__value" style={{ fontSize: 14, color: hasChange ? 'var(--accent)' : undefined }}>{p.current}</span>
                          {hasChange && (
                            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--yellow)' }}>
                              → {p.proposed} ({p.delta})
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* ── Predicted Impact ─────────────────────────────────────── */}
          <div className="card">
            <div className="card-header" style={{ marginBottom: 8 }}>
              <span className="card-title flex items-center gap-2"><TrendingDown size={14} style={{ color: 'var(--green)' }} /> PREDICTED IMPACT</span>
            </div>
            <div className="grid-2" style={{ gap: 8 }}>
              <div className="stat-tile">
                <div className="stat-tile__label">Lap-time effect</div>
                <span className="stat-tile__value" style={{ color: 'var(--green)' }}>-0.118s / lap</span>
              </div>
              <div className="stat-tile">
                <div className="stat-tile__label">Risk reduction</div>
                <span className="stat-tile__value" style={{ color: 'var(--yellow)' }}>-9 points</span>
              </div>
              <div className="stat-tile">
                <div className="stat-tile__label">Rear slip reduction</div>
                <span className="stat-tile__value" style={{ color: 'var(--accent)' }}>-4.5%</span>
              </div>
              <div className="stat-tile">
                <div className="stat-tile__label">Confidence</div>
                <span className="stat-tile__value" style={{ color: 'var(--blue)' }}>82%</span>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 8, fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
              <span><span style={{ color: 'var(--green)' }}>Main gain:</span> T15 Bucine exit</span>
              <span className="sep" style={{ width: 1, height: 12, background: 'var(--border)' }} />
              <span><span style={{ color: 'var(--yellow)' }}>Trade-off:</span> Rear stability improves, but exit drive may reduce slightly if TC intervention becomes excessive.</span>
            </div>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* FULL-WIDTH SECTIONS — Do Not Change · Safety · Validation */}
      {/* ════════════════════════════════════════════════════════════════ */}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginTop: 16 }}>

        {/* ─── Do Not Change ────────────────────────────────────────── */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: 8 }}>
            <span className="card-title flex items-center gap-2"><Ban size={14} style={{ color: 'var(--green)' }} /> DO NOT CHANGE</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {PARAMS.filter(p => p.proposed === null && p.risk === 'no change').map(p => (
              <div key={p.key} style={{
                padding: '6px 8px', borderRadius: 4, fontSize: 11,
                border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)',
              }}>
                <div style={{ fontWeight: 600, color: 'var(--text)' }}>{p.label} · Keep {p.current}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  Reason: {p.impact}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Setup Safety Check ───────────────────────────────────── */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: 8 }}>
            <span className="card-title flex items-center gap-2"><Shield size={14} style={{ color: 'var(--yellow)' }} /> SETUP SAFETY CHECK</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {PARAMS.filter(p => p.proposed !== null).map(p => (
              <div key={p.key} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '4px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-mono)',
                background: p.risk === 'no change' ? 'rgba(34,197,94,0.06)' : 'rgba(255,255,255,0.02)',
              }}>
                <span style={{ color: 'var(--text-dim)' }}>{p.label}</span>
                <span style={{
                  color: p.risk === 'more fork dive' || p.risk === 'less trail-braking support' || p.risk === 'may reduce rear grip on exit'
                    ? 'var(--yellow)' : p.risk === 'no change' ? 'var(--green)' : 'var(--yellow)',
                }}>
                  {p.risk === 'more fork dive' || p.risk === 'less trail-braking support' || p.risk === 'may reduce rear grip on exit'
                    ? 'Monitor' : p.risk === 'no change' ? 'Safe' : p.risk}
                </span>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 8, padding: '6px 8px', borderRadius: 4, fontSize: 10, fontFamily: 'var(--font-mono)',
            border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)',
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ color: 'var(--text-muted)' }}>Combined change risk</span>
              <span style={{ color: 'var(--yellow)', fontWeight: 600 }}>Medium</span>
            </div>
            <div style={{ color: 'var(--text-dim)', fontSize: 10 }}>
              Recommendation: Apply electronics + rear rebound first. Hold geometry unchanged.
            </div>
          </div>
        </div>

        {/* ─── Next-Stint Validation Targets ────────────────────────── */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: 8 }}>
            <span className="card-title flex items-center gap-2"><Target size={14} style={{ color: 'var(--accent)' }} /> NEXT-STINT VALIDATION</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>T15 BUCINE</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
              <span>▸ Rear slip &lt;10%</span>
              <span>▸ Throttle pickup 0.3s earlier</span>
              <span>▸ Exit speed +6 km/h</span>
            </div>
            <div style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>T1 SAN DONATO</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
              <span>▸ Chatter frequency &lt;12 Hz</span>
              <span>▸ Brake release smoother</span>
              <span>▸ Line deviation &lt;0.3 m</span>
            </div>
            <div style={{ fontSize: 10, letterSpacing: '0.08em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>T12 CORRENTAIO</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, fontSize: 11, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>
              <span>▸ Front stability improved</span>
              <span>▸ No front push on entry</span>
            </div>
            <div style={{
              marginTop: 2, padding: '6px 8px', borderRadius: 4,
              border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
              background: 'rgba(255,255,255,0.02)',
              fontSize: 11, fontFamily: 'var(--font-mono)',
            }}>
              <span style={{ color: 'var(--accent)' }}>Rear hot pressure:</span>{' '}
              <span style={{ color: 'var(--text-dim)' }}>Target 1.85–1.90 bar</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Apply to garage button ─────────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <button
          className="btn btn-primary"
          style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          onClick={() => {
            toast({
              type: 'success', title: 'Setup change plan staged',
              message: `${proposedCount} change(s) sent to the garage. Apply electronics + rear rebound first, then re-validate next stint.`,
            });
            navigate('setup');
          }}
        >
          Apply to garage setup <ChevronRight size={14} />
        </button>
      </div>

    </div>
  );
}
