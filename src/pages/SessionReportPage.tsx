import type { ReactNode } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  ClipboardList,
  Cpu,
  Download,
  FileSpreadsheet,
  FileText,
  Flag,
  Gauge,
  Lightbulb,
  Send,
  Shield,
  Target,
  Thermometer,
  Video,
  Zap,
} from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import { MUGELLO_CIRCUIT } from '../domain/sessionTruth';
import { useSessionContext } from '../hooks/useSessionContext';

interface MetricCard {
  label: string;
  value: string;
  detail: string;
  color: string;
}

interface LossItem {
  phase: string;
  loss: string;
  issue: string;
  color: string;
}

interface CriticalCorner {
  corner: string;
  loss: string;
  issue: string;
  phase: string;
  evidence: string;
}

interface DiagnosisItem {
  title: string;
  body: string;
  zones: string;
}

interface ValidationTarget {
  area: string;
  targets: string[];
}

interface DataSource {
  icon: typeof Gauge;
  label: string;
  detail: string;
}

const BEFORE = {
  lap: '1:59.238',
  loss: 'T15 Bucine · late throttle on exit',
};

const AFTER = {
  lap: '1:57.842',
  gain: '-1.396',
  note: 'Throttle 0.3s earlier with lower lean on exit',
};

const KPIS: MetricCard[] = [
  { label: 'Best lap', value: '1:57.842', detail: 'Best of stint', color: 'var(--green)' },
  { label: 'Average lap', value: '1:58.386', detail: 'stint average', color: 'var(--text)' },
  { label: 'Consistency', value: '86%', detail: 'Target: >90%', color: 'var(--yellow)' },
  { label: 'Potential gain', value: '-1.284s', detail: 'Still available vs ideal lap', color: 'var(--green)' },
  { label: 'Risk index', value: 'Medium', detail: '58 / 100', color: 'var(--yellow)' },
  { label: 'Rear grip drop', value: '12%', detail: 'Most visible on exit phases', color: 'var(--accent)' },
  { label: 'Data confidence', value: '94%', detail: 'validated race telemetry feed', color: 'var(--blue)' },
];

const TIME_LOSS: LossItem[] = [
  { phase: 'Corner exit', loss: '+0.842s', issue: 'Throttle pickup and rear slip', color: 'var(--accent)' },
  { phase: 'Braking phase', loss: '+0.316s', issue: 'Late brake release into San Donato / Correntaio', color: 'var(--yellow)' },
  { phase: 'Racing line', loss: '+0.168s', issue: 'Wide entry into Bucine', color: 'var(--blue)' },
  { phase: 'Tyre degradation', loss: '+0.112s', issue: 'Rear soft thermal drop', color: 'var(--orange)' },
];

const CRITICAL_CORNERS: CriticalCorner[] = [
  {
    corner: 'T15 · Bucine',
    loss: '+0.284s',
    issue: 'Late throttle + rear slip',
    phase: 'Exit',
    evidence: 'Throttle 0.40s late · rear grip 78% · max lean 57Â°',
  },
  {
    corner: 'T1 · San Donato',
    loss: '+0.216s',
    issue: 'Braking 9 m late',
    phase: 'Entry',
    evidence: 'Front chatter 18 Hz · brake release too late',
  },
  {
    corner: 'T12 · Correntaio',
    loss: '+0.142s',
    issue: 'Wide entry and slow rotation',
    phase: 'Apex / exit',
    evidence: 'Line deviation +0.6 m · exit speed -7 km/h',
  },
];

const NEXT_STINT_PLAN = [
  { title: 'T15 Bucine', body: 'Open throttle 0.3s earlier, but only after reducing lean below 54—“55Â°.' },
  { title: 'Rear grip protection', body: 'Keep max lean below 55Â° on slow-corner exits and avoid sharp throttle pickup.' },
  { title: 'T1 San Donato', body: 'Brake 9 m earlier and release pressure more progressively to reduce front chatter.' },
  { title: 'Rear tyre validation', body: 'Check hot rear pressure immediately after the stint and compare against target range.' },
];

const RIDER_DIAGNOSIS: DiagnosisItem[] = [
  {
    title: 'Throttle timing',
    body: 'Throttle opening is consistently 0.2—“0.4s late on exit phases.',
    zones: 'Affected zones: T15 Bucine, T12 Correntaio, T7 Savelli.',
  },
  {
    title: 'Lean management',
    body: 'Over-leaning above 56Â° is increasing rear edge temperature.',
    zones: 'Affected zones: T8/T9 Arrabbiata 1/2 and T15 Bucine.',
  },
  {
    title: 'Braking phase',
    body: 'Braking too deep into T1 San Donato compromises rotation and exit speed.',
    zones: 'Main evidence: late release and front chatter spike.',
  },
  {
    title: 'Line discipline',
    body: 'Wide entry into T12 Correntaio creates delayed throttle pickup.',
    zones: 'Target correction: reduce entry width by 0.4 m.',
  },
];

const SETUP_SUGGESTIONS = [
  {
    title: 'Electronics',
    body: 'Raise TC +1 in Sector 3 only if rear slip persists at T15 Bucine. Do not apply globally unless drive loss remains acceptable.',
  },
  {
    title: 'Rear suspension',
    body: 'Slow rear rebound by +2 clicks to calm rear return on exit.',
  },
  {
    title: 'Engine brake',
    body: 'Reduce engine brake by -1 only if entry instability continues at T1 San Donato and T12 Correntaio.',
  },
  {
    title: 'Pressure',
    body: 'Validate rear hot pressure immediately after the stint.',
  },
];

const VALIDATION_TARGETS: ValidationTarget[] = [
  { area: 'T15 Bucine', targets: ['Throttle pickup: 0.3s earlier', 'Lean at pickup: <54Â°', 'Rear slip: <10%', 'Exit speed: +6 km/h'] },
  { area: 'T1 San Donato', targets: ['Brake point: 9 m earlier', 'Chatter: <12 Hz', 'Line deviation: <0.3 m'] },
  { area: 'T12 Correntaio', targets: ['Entry width: -0.4 m', 'Exit speed: +4 km/h'] },
  { area: 'Tyres', targets: ['Rear grip drop: <8%', 'Rear pressure: within target hot range'] },
];

const DATA_SOURCES: DataSource[] = [
  { icon: Gauge, label: 'GPS', detail: '10 Hz · validated race feed' },
  { icon: Shield, label: 'IMU', detail: 'lean · acceleration · gyro' },
  { icon: Cpu, label: 'ECU', detail: 'RPM · throttle · gear · brake demand' },
  { icon: Thermometer, label: 'Tyre model', detail: 'temperature · pressure · grip estimate' },
  { icon: FileSpreadsheet, label: 'CSV import', detail: '2D / AiM datalogger export' },
  { icon: Video, label: 'Video', detail: 'optional · not synced' },
];

const ACTIONS = [
  { label: 'Generate PDF', icon: Download },
  { label: 'Send to rider', icon: Send },
  { label: 'Send to garage', icon: FileText },
  { label: 'Export telemetry markers', icon: Gauge },
  { label: 'Create next-stint checklist', icon: ClipboardList },
  { label: 'Compare with previous stint', icon: ArrowRight },
];

function Pill({ children, color }: { children: ReactNode; color: string }) {
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 800, color, padding: '3px 8px', borderRadius: 999, background: `color-mix(in srgb, ${color} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 32%, transparent)` }}>
      {children}
    </span>
  );
}

function StatTile({ label, value, detail, color }: MetricCard) {
  return (
    <div className="stat-tile">
      <div className="stat-tile__label">{label}</div>
      <span className="stat-tile__value" style={{ fontSize: 21, color }}>{value}</span>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.35, marginTop: 4 }}>{detail}</div>
    </div>
  );
}

function NumberedAction({ index, title, body }: { index: number; title: string; body: string }) {
  return (
    <div style={{ display: 'flex', gap: 11, padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <span style={{ flex: 'none', width: 24, height: 24, borderRadius: '50%', background: 'var(--blue-dim)', color: 'var(--blue)', display: 'grid', placeItems: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 900 }}>{index}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 3 }}>{title}</div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{body}</div>
      </div>
    </div>
  );
}

export function SessionReportPage() {
  const session = useSessionContext();
  const { toast } = useToast();

  function handleAction(label: string) {
    if (label === 'Generate PDF') {
      globalThis.print();
      return;
    }
    toast({ type: 'success', title: label, message: 'Session Report · Stint 03 action queued for the race team.' });
  }

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Session Report</h1>
          <p className="page-subtitle">{session.ctx.circuitName} GP · {session.ctx.setup.stint ?? 'Stint 03'} · {session.ctx.setup.rider ?? 'RubÃ©n JuÃ¡rez'} · {session.ctx.setup.bike ?? 'Yamaha R1'}</p>
        </div>
        <div className="flex items-center gap-2" style={{ flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span className="badge badge-blue">Post-stint</span>
          <span className="badge badge-green">Data confidence 94%</span>
          <button className="btn btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => handleAction('Generate PDF')}><Download size={13} /> Export PDF</button>
          <button className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => handleAction('Send to rider')}><Send size={13} /> Send to rider</button>
        </div>
      </div>

      <div className="card mb-4" style={{
 }}>
        <div className="card-body">
          <div className="grid-4">
            <div><div className="card-label">Conditions</div><div style={{ fontSize: 13, fontWeight: 800 }}>Dry · Air 24Â°C · Track 38Â°C · Wind 8 km/h</div></div>
            <div><div className="card-label">Circuit</div><div style={{ fontSize: 13, fontWeight: 800 }}>{MUGELLO_CIRCUIT.shortName} · {MUGELLO_CIRCUIT.lengthKm} km · {MUGELLO_CIRCUIT.turns} turns</div></div>
            <div><div className="card-label">Report mode</div><div style={{ fontSize: 13, fontWeight: 800 }}>Post-stint · rider + engineering summary</div></div>
            <div><div className="card-label">Generated</div><div style={{ fontSize: 13, fontWeight: 800 }}>Pit wall · 14:32:18</div></div>
          </div>
        </div>
      </div>

      <div className="card mb-4" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.10), rgba(59,130,246,0.05))' }}>
        <div className="card-header">
          <span className="card-title flex items-center gap-2"><Target size={14} style={{ color: 'var(--green)' }} /> Executive Summary</span>
          <span className="badge badge-green">Strong improvement · {AFTER.gain}s</span>
        </div>
        <div className="card-body">
          <div className="grid-4">
            <div><div className="card-label">Stint result</div><div style={{ fontSize: 15, fontWeight: 900, color: 'var(--green)' }}>Strong improvement: {AFTER.gain}s</div></div>
            <div><div className="card-label">Main gain</div><div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>Earlier throttle pickup and lower lean on corner exits.</div></div>
            <div><div className="card-label">Main remaining loss</div><div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>T15 Bucine exit and T1 San Donato braking.</div></div>
            <div><div className="card-label">Next focus</div><div style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>Drive out of Bucine, brake stability into San Donato and rear pressure validation.</div></div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title flex items-center gap-2"><FileText size={14} style={{ color: 'var(--green)' }} /> Stint Outcome · Before â†’ After</span>
          <span className="badge badge-green">{AFTER.gain}s improvement</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginBottom: 18 }}>
            <div style={{ flex: 1, minWidth: 190 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>BEFORE</div>
              <div style={{ fontSize: 34, fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>{BEFORE.lap}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Main loss: {BEFORE.loss}</div>
            </div>
            <ArrowRight size={28} style={{ color: 'var(--green)', flex: 'none' }} />
            <div style={{ flex: 1, minWidth: 190 }}>
              <div style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>AFTER</div>
              <div style={{ fontSize: 34, fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>{AFTER.lap}</div>
              <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Fix applied: {AFTER.note}</div>
            </div>
            <div style={{ textAlign: 'center', flex: 'none', paddingLeft: 8 }}>
              <div style={{ fontSize: 44, fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--green)', lineHeight: 1 }}>{AFTER.gain}<span style={{ fontSize: 18 }}>s</span></div>
              <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>IMPROVEMENT</div>
            </div>
          </div>
          <div className="grid-3">
            <StatTile label="Corner exits" value="-0.842s" detail="earlier pickup + lower lean" color="var(--green)" />
            <StatTile label="Braking stability" value="-0.316s" detail="cleaner release phase" color="var(--green)" />
            <StatTile label="Line consistency" value="-0.168s" detail="less width variation" color="var(--green)" />
          </div>
        </div>
      </div>

      <div className="grid-5 mb-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        {KPIS.map(kpi => <StatTile key={kpi.label} {...kpi} />)}
      </div>

      <div className="grid-2 mb-4" style={{ gap: 16, alignItems: 'start' }}>
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><BarChartIcon /> Time Loss Breakdown</span>
            <span className="badge badge-yellow">+1.438s explainable</span>
          </div>
          <div className="card-body">
            {TIME_LOSS.map(item => (
              <div key={item.phase} style={{ display: 'grid', gridTemplateColumns: '120px 76px 1fr', gap: 12, alignItems: 'center', padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)' }}>{item.phase}</div>
                <Pill color={item.color}>{item.loss}</Pill>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{item.issue}</div>
              </div>
            ))}
            <div style={{ marginTop: 12, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>
              <strong style={{ color: 'var(--text)' }}>Modelled potential gain:</strong> -1.284s once the highest-confidence exit and braking corrections are validated.
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><Flag size={14} style={{ color: 'var(--blue)' }} /> Next Stint Plan</span>
            <span className="badge badge-blue">focus · 4 actions</span>
          </div>
          <div className="card-body">
            {NEXT_STINT_PLAN.map((item, index) => <NumberedAction key={item.title} index={index + 1} title={item.title} body={item.body} />)}
            <div style={{ marginTop: 12, padding: '9px 11px', borderRadius: 8, border: '1px solid rgba(59,130,246,0.18)', background: 'rgba(59,130,246,0.07)', fontSize: 12, color: 'var(--text-muted)' }}>
              <strong style={{ color: 'var(--blue)' }}>Validation lap:</strong> use laps 2—“4 of the next stint for a clean comparison.
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title flex items-center gap-2"><Flag size={14} style={{ color: 'var(--accent)' }} /> Critical Corners</span>
          <span className="badge badge-red">3 found · Mugello map</span>
        </div>
        <div className="card-body">
          <div className="grid-3">
            {CRITICAL_CORNERS.map(corner => (
              <div key={corner.corner} style={{ padding: 13, border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <div style={{ fontSize: 15, fontWeight: 900, color: 'var(--text)' }}>{corner.corner}</div>
                  <Pill color="var(--accent)">{corner.loss}</Pill>
                </div>
                <div style={{ fontSize: 12, color: 'var(--text)', fontWeight: 800, marginBottom: 5 }}>{corner.issue}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>Main phase: {corner.phase}</div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.45 }}>Evidence: {corner.evidence}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2 mb-4" style={{ gap: 16, alignItems: 'start' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header"><span className="card-title flex items-center gap-2"><Thermometer size={14} style={{ color: 'var(--accent)' }} /> Tyre & Grip Report</span></div>
            <div className="card-body">
              <div className="grid-3" style={{ marginBottom: 14 }}>
                <StatTile label="Rear grip drop" value="12%" detail="exit-phase dominant" color="var(--accent)" />
                <StatTile label="Compound" value="Rear Soft / SC1" detail="race simulation tyre" color="var(--yellow)" />
                <StatTile label="Cliff lap" value="L16" detail="estimated thermal cliff" color="var(--orange)" />
                <StatTile label="Rear peak temp" value="118Â°C" detail="thermal load peak" color="var(--accent)" />
                <StatTile label="Thermal zones" value="T8/T9 · T15" detail="Arrabbiata + Bucine" color="var(--blue)" />
                <StatTile label="Grip behaviour" value=">40% throttle" detail="loss during pickup" color="var(--text)" />
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                <strong style={{ color: 'var(--text)' }}>Recommendation:</strong> avoid TC reduction until rear temperature is below threshold. Re-check hot pressure after next stint.
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title flex items-center gap-2"><Shield size={14} style={{ color: 'var(--yellow)' }} /> Risk & Safety Report</span></div>
            <div className="card-body">
              <div className="grid-3" style={{ marginBottom: 14 }}>
                <StatTile label="Risk index" value="Medium" detail="58 / 100" color="var(--yellow)" />
                <StatTile label="Near-misses" value="0 critical" detail="1 medium rear step-out" color="var(--green)" />
                <StatTile label="Primary risk" value="Rear slip" detail="while lean remains high" color="var(--accent)" />
              </div>
              <div style={{ padding: '10px 12px', border: '1px solid rgba(245,158,11,0.20)', background: 'rgba(245,158,11,0.07)', borderRadius: 8, fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.55 }}>
                <strong style={{ color: 'var(--yellow)' }}>Safety recommendation:</strong> do not combine earlier throttle with TC reduction. Prioritize smoother pickup before reducing electronic support.
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Data Sources</span><span className="badge badge-green">Connected · 94%</span></div>
            <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 9 }}>
              {DATA_SOURCES.map(source => {
                const Icon = source.icon;
                return (
                  <div key={source.label} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '9px 11px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)' }}>
                    <Icon size={14} style={{ color: 'var(--blue)' }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 800 }}>{source.label}</div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{source.detail}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="card">
            <div className="card-header"><span className="card-title flex items-center gap-2"><AlertTriangle size={14} style={{ color: 'var(--yellow)' }} /> Rider Input Diagnosis</span></div>
            <div className="card-body">
              {RIDER_DIAGNOSIS.map(item => (
                <div key={item.title} style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--text)', marginBottom: 4 }}>{item.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.body}</div>
                  <div style={{ fontSize: 11, color: 'var(--blue)', marginTop: 4 }}>{item.zones}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title flex items-center gap-2"><Lightbulb size={14} style={{ color: 'var(--green)' }} /> Setup Suggestions</span></div>
            <div className="card-body">
              {SETUP_SUGGESTIONS.map(item => (
                <div key={item.title} style={{ display: 'flex', gap: 9, padding: '9px 0', borderBottom: '1px solid var(--border)' }}>
                  <Check size={14} style={{ color: 'var(--green)', flex: 'none', marginTop: 2 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--text)', marginBottom: 3 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5 }}>{item.body}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ borderColor: 'color-mix(in srgb, var(--blue) 35%, transparent)' }}>
            <div className="card-header"><span className="card-title">Session Reporter AI · Notes</span><span className="badge badge-blue">AI</span></div>
            <div className="card-body" style={{ fontSize: 13, lineHeight: 1.65, color: 'var(--text-muted)' }}>
              Solid, repeatable pace with a clear improvement theme: drive off the final sector and slow-corner exits.
              <br /><br />
              The deficit is concentrated in throttle timing and rear-grip management, especially at <strong style={{ color: 'var(--text)' }}>T15 Bucine</strong> and <strong style={{ color: 'var(--text)' }}>T12 Correntaio</strong>. Braking into <strong style={{ color: 'var(--text)' }}>T1 San Donato</strong> also needs cleaning up, but the main lap-time opportunity comes from improving exit speed without increasing rear-slip risk.
              <br /><br />
              The next stint should not chase more lean angle. The priority is earlier pickup with less lean, smoother throttle application and validation of rear hot pressure.
            </div>
          </div>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title flex items-center gap-2"><ClipboardList size={14} style={{ color: 'var(--blue)' }} /> Next-Stint Validation Targets</span>
          <span className="badge badge-blue">measurable targets</span>
        </div>
        <div className="card-body">
          <div className="grid-4">
            {VALIDATION_TARGETS.map(group => (
              <div key={group.area} style={{ padding: 12, border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', background: 'rgba(255,255,255,0.03)' }}>
                <div style={{ fontSize: 13, fontWeight: 900, color: 'var(--text)', marginBottom: 8 }}>{group.area}</div>
                {group.targets.map(target => <div key={target} style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>—¢ {target}</div>)}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <span className="card-title flex items-center gap-2"><Zap size={14} style={{ color: 'var(--yellow)' }} /> Actions</span>
          <span className="badge badge-muted">report workflow</span>
        </div>
        <div className="card-body" style={{ display: 'flex', gap: 9, flexWrap: 'wrap' }}>
          {ACTIONS.map(action => {
            const Icon = action.icon;
            return (
              <button key={action.label} type="button" className="btn btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 7 }} onClick={() => handleAction(action.label)}>
                <Icon size={13} /> {action.label}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function BarChartIcon() {
  return <FileSpreadsheet size={14} style={{ color: 'var(--yellow)' }} />;
}
