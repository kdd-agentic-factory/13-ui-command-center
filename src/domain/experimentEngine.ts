/**
 * experimentEngine.ts — Performance Experiment Engine.
 *
 * Turns every KDD recommendation into a measurable on-track experiment and
 * runs the full engineering loop:
 *
 *   data → hypothesis → experiment → validation → learning → next decision
 *
 * Each experiment carries a hypothesis (+confidence), a change set, controlled
 * variables, success criteria, expected gain and risk; once run it closes with
 * a validation status and a before/after metric table, a learning and the next
 * recommendation. Deterministic and personalised, and coherent with the Black
 * Box (rebound validated, TC rejected) and the Knowledge Graph.
 */

export type ExperimentType =
  | 'Rider technique' | 'Setup' | 'Tyre' | 'Race pace' | 'Risk reduction' | 'Digital Twin' | 'A/B setup';

export type ValidationStatus =
  | 'planned' | 'running' | 'validated' | 'partially-validated' | 'rejected' | 'inconclusive' | 'needs-repeat';

export interface ExperimentTypeMeta { type: ExperimentType; desc: string; }
export const EXPERIMENT_TYPES: ExperimentTypeMeta[] = [
  { type: 'Rider technique', desc: 'Validate a change in riding technique.' },
  { type: 'Setup',           desc: 'Test suspension, electronics or geometry.' },
  { type: 'Tyre',            desc: 'Compare compounds, pressures or degradation.' },
  { type: 'Race pace',       desc: 'Validate consistent race rhythm.' },
  { type: 'Risk reduction',  desc: 'Lower risk without losing much time.' },
  { type: 'Digital Twin',    desc: 'Simulate the scenario before going out.' },
  { type: 'A/B setup',       desc: 'Compare two configurations head to head.' },
];

export interface SuccessCriterion { metric: string; target: string; }
export interface MetricResult { metric: string; before: string; after: string; met: boolean; }

export interface ExperimentResult {
  status: ValidationStatus;
  metrics: MetricResult[];
  improved?: string;
  worsened?: string;
  learning: string;
  nextRecommendation: string;
}

export interface Experiment {
  id: string;
  type: ExperimentType;
  title: string;
  problem: string;
  hypothesis: string;
  confidence: number;        // 0–100
  changeSet: string[];
  controlled: string[];      // variables held constant
  successCriteria: SuccessCriterion[];
  expectedGain: string;
  risk: string;
  status: ValidationStatus;
  riderCue?: string;
  targetLaps: string;
  baseline: string;          // the stint it is measured against
  result?: ExperimentResult; // present once completed
}

const STATUS_META: Record<ValidationStatus, { label: string; color: string }> = {
  planned:               { label: 'PLANNED',              color: 'var(--text-muted)' },
  running:               { label: 'RUNNING',              color: 'var(--cyan)' },
  validated:             { label: 'VALIDATED',            color: 'var(--green)' },
  'partially-validated': { label: 'PARTIALLY VALIDATED',  color: 'var(--yellow)' },
  rejected:              { label: 'REJECTED',             color: 'var(--accent)' },
  inconclusive:          { label: 'INCONCLUSIVE',         color: 'var(--text-muted)' },
  'needs-repeat':        { label: 'NEEDS REPEAT',         color: '#FF6A00' },
};
export function statusMeta(s: ValidationStatus) { return STATUS_META[s]; }

/** The closed-loop method, for the workflow strip. */
export const EXPERIMENT_LOOP = [
  'Detect problem', 'Form hypothesis', 'Design experiment', 'Approve',
  'Run on track', 'Measure', 'Validate / reject', 'Store learning', 'Adjust next plan',
];

export function buildExperiments(rider: string, bike: string, circuit: string): Experiment[] {
  const combo = `${rider} · ${bike} · ${circuit}`;
  return [
    // ── Active / running ──────────────────────────────────────────────────────
    {
      id: 'EXP-04', type: 'Rider technique', title: 'Exit Drive Validation',
      problem: `Throttle opens 0.3–0.4s late at T15 Bucine (${circuit}).`,
      hypothesis: 'The rider waits too long because the bike stays leaned above 55°; rear rebound also returns too fast on exit.',
      confidence: 82,
      changeSet: ['Rear rebound +2 clicks slower', 'Keep TC unchanged', 'Throttle only after lean <54°', 'Focus laps: 2–5'],
      controlled: ['Same tyre set', 'Same fuel/load', 'Same rider', 'Same circuit'],
      successCriteria: [
        { metric: 'Rear slip', target: '<10%' },
        { metric: 'Exit speed', target: '+5 km/h' },
        { metric: 'Throttle pickup', target: '0.3s earlier' },
        { metric: 'Risk index', target: 'not increased' },
      ],
      expectedGain: '-0.31s to -0.48s per lap',
      risk: 'Low-medium', status: 'running',
      riderCue: 'Pick the bike up first, then feed the gas.',
      targetLaps: '5', baseline: 'Stint 03',
      // no result yet — live validation in progress
    },
    // ── Validated (setup) — matches Black Box decision d1 ─────────────────────
    {
      id: 'EXP-03', type: 'Setup', title: 'Rear Rebound Validation',
      problem: 'Rear instability on corner exit (T15 Bucine, T12 Correntaio).',
      hypothesis: 'Rear rebound returns too fast and unsettles the bike when throttle is applied.',
      confidence: 84,
      changeSet: ['Rear rebound +2 clicks slower'],
      controlled: ['Same tyre set', 'Same fuel/load', 'Same rider', 'Same circuit', 'Same target laps'],
      successCriteria: [
        { metric: 'Rear slip reduction', target: '>3%' },
        { metric: 'Exit speed', target: 'not reduced' },
        { metric: 'Direction change penalty', target: '<0.05s' },
        { metric: 'Crash-risk index', target: 'not increased' },
      ],
      expectedGain: '-0.31s per lap', risk: 'Low-medium', status: 'validated',
      targetLaps: '5', baseline: 'Stint 02',
      result: {
        status: 'validated',
        metrics: [
          { metric: 'Rear slip',       before: '14.0%',     after: '9.6%',      met: true },
          { metric: 'Exit speed',      before: '184 km/h',  after: '190 km/h',  met: true },
          { metric: 'Throttle pickup', before: '0.40s late',after: '0.12s late',met: true },
          { metric: 'Lap time',        before: '1:57.842',  after: '1:57.511',  met: true },
        ],
        learning: 'Rear rebound +2 clicks with earlier pickup improves Bucine exit without increasing risk.',
        nextRecommendation: 'Keep the setup change. Repeat validation on T12 Correntaio.',
      },
    },
    // ── Partially validated (tyre) ────────────────────────────────────────────
    {
      id: 'EXP-02', type: 'Tyre', title: 'Rear Soft Thermal Window',
      problem: 'Rear grip drops 12% after lap 6.',
      hypothesis: 'Rear soft overheats during high-lean throttle pickup.',
      confidence: 67,
      changeSet: ['A · Rear Soft · 5 laps', 'B · Rear Medium · 5 laps · same target pace'],
      controlled: ['Same rider', 'Same circuit', 'Same fuel window', 'Same weather window'],
      successCriteria: [
        { metric: 'Rear temp stability', target: 'improved' },
        { metric: 'Grip drop', target: 'reduced' },
        { metric: 'One-lap pace', target: 'not slower' },
      ],
      expectedGain: 'Consistent end-of-stint pace', risk: 'Low', status: 'partially-validated',
      targetLaps: '5+5', baseline: 'Stint 02 (soft)',
      result: {
        status: 'partially-validated',
        metrics: [
          { metric: 'Cliff onset',  before: 'L19',  after: 'L22',  met: true },
          { metric: 'Grip drop',    before: '12%',  after: '6%',   met: true },
          { metric: 'One-lap pace', before: '1:57.5', after: '1:57.9', met: false },
        ],
        improved: 'Thermal stability and grip drop (cliff pushed L19 → L22).',
        worsened: 'One-lap pace 0.4s slower on medium.',
        learning: 'Use rear medium only for long stints / hot tracks; keep soft for qualifying and short runs.',
        nextRecommendation: 'Adopt medium for race stints >12 laps. Do not generalise to cooler sessions.',
      },
    },
    // ── Rejected — matches Black Box decision d2 ──────────────────────────────
    {
      id: 'EXP-01', type: 'Setup', title: 'Traction Control 4 → 5',
      problem: 'Residual rear spin on the two Arrabbiata exits.',
      hypothesis: 'Raising TC one step removes the spin events at acceptable time cost.',
      confidence: 55,
      changeSet: ['TC 4 → 5 in Sector 3'],
      controlled: ['Same tyre set', 'Same rider', 'Same circuit'],
      successCriteria: [
        { metric: 'Spin events', target: '<1/lap' },
        { metric: 'Lap time cost', target: '<0.05s' },
      ],
      expectedGain: 'Fewer spin events', risk: 'Low', status: 'rejected',
      targetLaps: '3', baseline: 'Stint 03',
      result: {
        status: 'rejected',
        metrics: [
          { metric: 'Spin events',   before: '3/lap',  after: '1/lap',   met: true },
          { metric: 'Lap time cost', before: '0.00s',  after: '+0.11s',  met: false },
        ],
        worsened: 'Lap time cost +0.11s — over the 0.05s budget; the cut hurt drive more than the spin did.',
        learning: `For ${combo}, TC5 over-manages the rear here; the rebound fix already covered the instability.`,
        nextRecommendation: 'Keep TC4. Revisit only if rear tyre drops below the thermal window.',
      },
    },
  ];
}
