import { FileText, Download, Send, ArrowRight, AlertTriangle, Check, Flag, Circle, Satellite, Cpu, Gauge, FileSpreadsheet, Lightbulb } from 'lucide-react';
import { useToast } from '../components/ToastProvider';

/**
 * Session Report — Post-Stint Review / "Box mode" (engineer feedback #17/#18/#21).
 * The tangible output of a stint: the before→after lap-time story, the headline
 * KPIs, critical corners, tyre degradation, rider mistakes, setup suggestions and
 * the Session Reporter AI notes — exportable to PDF / sent to the coach. Also
 * shows which data sources fed the analysis (#16).
 */

const BEFORE = { lap: '1:45.238', loss: 'Turn 6 · late throttle on exit' };
const AFTER = { lap: '1:43.912', gain: '−1.326', note: 'throttle 0.3 s earlier, lower lean' };

const KPIS = [
  { label: 'Best lap', value: '1:43.912', color: 'var(--green)' },
  { label: 'Consistency', value: '86%', color: 'var(--text)' },
  { label: 'Potential gain', value: '−1.284s', color: 'var(--green)' },
  { label: 'Risk index', value: 'Medium', color: 'var(--yellow)' },
  { label: 'Rear grip drop', value: '12%', color: 'var(--accent)' },
];

const CRITICAL_CORNERS = [
  { t: 'T7 · Portago', loss: '+0.284', issue: 'Late throttle + rear slip' },
  { t: 'T3 · Tunel', loss: '+0.216', issue: 'Braking 9 m late' },
  { t: 'T9 · Nieto', loss: '+0.142', issue: 'Wide entry' },
];

const MISTAKES = [
  'Throttle opening consistently 0.2–0.4 s late out of slow corners',
  'Over-leaning in T6 (56°) — burning rear edge grip',
  'Braking too deep into T3, compromising the following exit',
];

const SETUP_SUGGESTIONS = [
  'Raise traction control +1 in sector 2',
  'Slow rear rebound 2 clicks to settle slow-corner exits',
  'Reduce engine brake in turns 4–6',
];

const COACH_NOTES = 'Solid, repeatable pace with a clear, single theme to attack: drive off the slow corners. The deficit is almost entirely throttle timing in T5–T7, not outright lean or braking. Working the rear-grip setup and a touch more patience on the brake into T3 should recover most of the 1.28 s — without raising crash risk.';

const DATA_SOURCES = [
  { icon: Satellite, label: 'GPS', detail: '10 Hz · 2027 open feed' },
  { icon: Gauge, label: 'IMU', detail: 'lean / accel / gyro' },
  { icon: Cpu, label: 'ECU', detail: 'rpm · throttle · gear' },
  { icon: FileSpreadsheet, label: 'CSV', detail: '2D datalogger export' },
];

function Pill({ children, color }: { children: React.ReactNode; color: string }) {
  return (
    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color, padding: '2px 8px', borderRadius: 999, background: `color-mix(in srgb, ${color} 14%, transparent)`, border: `1px solid color-mix(in srgb, ${color} 32%, transparent)` }}>
      {children}
    </span>
  );
}

export function SessionReportPage() {
  const { toast } = useToast();
  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Session Report</h1>
          <p className="page-subtitle">Jarama · Track Day · Stint 03 · Rubén Juárez · Yamaha R1 · Dry 24°C</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => window.print()}><Download size={13} /> Export PDF</button>
          <button className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
            onClick={() => toast({ type: 'success', title: 'Report sent to coach', message: 'Stint 03 report shared with your coach.' })}><Send size={13} /> Send to coach</button>
        </div>
      </div>

      {/* Before → After hero */}
      <div className="card mb-4" style={{ background: 'linear-gradient(135deg, rgba(34,197,94,0.10), rgba(255,255,255,0.02))' }}>
        <div className="card-header">
          <span className="card-title flex items-center gap-2"><FileText size={14} style={{ color: 'var(--green)' }} /> Stint outcome · before → after</span>
          <span className="badge badge-green">{AFTER.gain}s</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap', marginTop: 8 }}>
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>BEFORE</div>
            <div style={{ fontSize: 34, fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>{BEFORE.lap}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Main loss: {BEFORE.loss}</div>
          </div>
          <ArrowRight size={28} style={{ color: 'var(--green)', flex: 'none' }} />
          <div style={{ flex: 1, minWidth: 180 }}>
            <div style={{ fontSize: 10, letterSpacing: '0.12em', color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>AFTER</div>
            <div style={{ fontSize: 34, fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>{AFTER.lap}</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Fix: {AFTER.note}</div>
          </div>
          <div style={{ textAlign: 'center', flex: 'none', paddingLeft: 8 }}>
            <div style={{ fontSize: 44, fontWeight: 900, fontFamily: 'var(--font-mono)', color: 'var(--green)', lineHeight: 1 }}>{AFTER.gain}<span style={{ fontSize: 18 }}>s</span></div>
            <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>IMPROVEMENT</div>
          </div>
        </div>
      </div>

      {/* Headline KPIs */}
      <div className="grid-5 mb-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 }}>
        {KPIS.map(k => (
          <div key={k.label} className="stat-tile">
            <div className="stat-tile__label">{k.label}</div>
            <span className="stat-tile__value" style={{ fontSize: 22, color: k.color }}>{k.value}</span>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ gap: 16, alignItems: 'start' }}>
        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Critical corners */}
          <div className="card">
            <div className="card-header"><span className="card-title flex items-center gap-2"><Flag size={14} style={{ color: 'var(--accent)' }} /> Critical corners</span><span className="badge badge-red">3 found</span></div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
              {CRITICAL_CORNERS.map(c => (
                <div key={c.t} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12, minWidth: 96 }}>{c.t}</span>
                  <Pill color="var(--accent)">{c.loss}s</Pill>
                  <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{c.issue}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tyre degradation */}
          <div className="card">
            <div className="card-header"><span className="card-title flex items-center gap-2"><Circle size={14} style={{ color: 'var(--accent)' }} /> Tyre degradation</span></div>
            <div className="grid-3" style={{ marginTop: 6 }}>
              <div className="stat-tile"><div className="stat-tile__label">Rear grip drop</div><span className="stat-tile__value" style={{ fontSize: 18, color: 'var(--accent)' }}>12%</span></div>
              <div className="stat-tile"><div className="stat-tile__label">Cliff lap</div><span className="stat-tile__value" style={{ fontSize: 18 }}>~16</span></div>
              <div className="stat-tile"><div className="stat-tile__label">Compound</div><span className="stat-tile__value" style={{ fontSize: 18 }}>SC1</span></div>
            </div>
          </div>

          {/* Data sources */}
          <div className="card">
            <div className="card-header"><span className="card-title">Data sources</span><span className="badge badge-green">● connected</span></div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 8 }}>
              {DATA_SOURCES.map(d => {
                const I = d.icon;
                return (
                  <div key={d.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '7px 11px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <I size={14} style={{ color: 'var(--blue)' }} />
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700 }}>{d.label}</div>
                      <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{d.detail}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Rider mistakes */}
          <div className="card">
            <div className="card-header"><span className="card-title flex items-center gap-2"><AlertTriangle size={14} style={{ color: 'var(--yellow)' }} /> Rider mistakes</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '6px 0 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {MISTAKES.map(m => (
                <li key={m} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text-dim)' }}>
                  <AlertTriangle size={13} style={{ color: 'var(--yellow)', flex: 'none', marginTop: 2 }} /> {m}
                </li>
              ))}
            </ul>
          </div>

          {/* Setup suggestions */}
          <div className="card">
            <div className="card-header"><span className="card-title flex items-center gap-2"><Lightbulb size={14} style={{ color: 'var(--green)' }} /> Setup suggestions</span></div>
            <ul style={{ listStyle: 'none', padding: 0, margin: '6px 0 0', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {SETUP_SUGGESTIONS.map(s => (
                <li key={s} style={{ display: 'flex', gap: 8, fontSize: 13, color: 'var(--text)' }}>
                  <Check size={14} style={{ color: 'var(--green)', flex: 'none', marginTop: 2 }} /> {s}
                </li>
              ))}
            </ul>
          </div>

          {/* AI coach notes */}
          <div className="card" style={{ borderColor: 'color-mix(in srgb, var(--blue) 35%, transparent)' }}>
            <div className="card-header"><span className="card-title">Session Reporter AI · notes</span><span className="badge badge-blue">AI</span></div>
            <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-dim)', margin: '6px 0 0' }}>{COACH_NOTES}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
