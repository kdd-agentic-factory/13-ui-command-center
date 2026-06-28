/**
 * HumanPerformancePage – Human Performance Intelligence.
 *
 * Rider state score, fatigue→error correlation, cognitive-load map, confidence
 * index, stint readiness, human performance events, human-aware crash risk,
 * before/after and a wellness layer. Honest: biometrics are wearable/manual and
 * estimated – the value is the correlation to the telemetry model.
 */
import { HeartPulse, Brain, Gauge, AlertTriangle, Sparkles, Activity } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildHumanPerformance, scoreColor, loadColor, toneColor } from '../domain/humanPerformance';

const MONO = 'JetBrains Mono, monospace';

export function HumanPerformancePage() {
  const garage = useGarage();
  const { ctx } = useSessionContext();
  const session = ctx.setup.stint ?? ctx.setup.session ?? 'Stint 03';
  const h = buildHumanPerformance(garage.profile.rider.name, `${garage.profile.bike.brand} ${garage.profile.bike.model}`, ctx.circuitName, session);
  const fw = { stable: 'var(--green)', peak: 'var(--cyan)', rising: 'var(--accent)' } as const;

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><HeartPulse size={18} /> Human Performance Intelligence</h1>
          <p className="page-subtitle">Rider state · fatigue · focus · confidence · cognitive load · human-aware risk – {h.combo}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rider state · conf {h.confidencePct}%</div>
          <div style={{ fontSize: 28, fontWeight: 800, fontFamily: MONO, color: scoreColor(h.stateScore) }}>{h.stateScore}<span style={{ fontSize: 12, color: 'var(--text-muted)' }}>/100</span></div>
        </div>
      </div>

      {/* honesty banner */}
      <div className="card mb-4" style={{ padding: '8px 12px', background: 'var(--yellow-dim)', border: '1px solid var(--yellow-border)', fontSize: 10.5, color: 'var(--text)' }}>
        <Activity size={11} style={{ verticalAlign: -1, marginRight: 5, color: 'var(--yellow)' }} />{h.dataSource}
      </div>

      {/* status + vitals */}
      <div className="card mb-4" style={{ padding: 14 }}>
        <div style={{ fontSize: 12.5, color: 'var(--text)' }}><b>Status:</b> {h.status} · <span style={{ color: 'var(--accent)' }}>{h.mainLimiter}</span></div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, marginTop: 10 }}>
          {h.vitals.map(v => (
            <div key={v.label}>
              <div style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{v.label}</div>
              <div style={{ fontSize: 12.5, fontWeight: 700, color: toneColor(v.tone) }}>{v.value}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* fatigue → error */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <Gauge size={14} style={{ color: 'var(--accent)' }} />
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Fatigue → error correlation</span>
          </div>
          {h.fatigue.map(f => (
            <div key={f.laps} style={{ display: 'flex', gap: 10, marginBottom: 8 }}>
              <span style={{ width: 10, height: 10, borderRadius: 999, background: fw[f.state], marginTop: 3, flexShrink: 0 }} />
              <div><span style={{ fontSize: 11, fontWeight: 700, color: fw[f.state] }}>{f.laps}</span><span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 8 }}>{f.note}</span></div>
            </div>
          ))}
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '8px 0 4px' }}>Evidence</div>
          {h.evidence.map(e => <div key={e} style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>· {e}</div>)}
        </div>

        {/* cognitive load map */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <Brain size={14} style={{ color: 'var(--violet)' }} />
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cognitive load map</span>
          </div>
          {h.cognitive.map(c => (
            <div key={c.corner} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{c.corner}</span>
                <span style={{ fontSize: 9, fontFamily: MONO, color: loadColor(c.load), border: `1px solid ${loadColor(c.load)}`, borderRadius: 4, padding: '0 6px' }}>{c.load}</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{c.reason} <span style={{ color: 'var(--text)' }}>→ {c.response}</span></div>
            </div>
          ))}
        </div>
      </div>

      {/* confidence + readiness + human-aware risk */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Rider confidence index</div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: MONO, color: scoreColor(h.confidence.overall) }}>{h.confidence.overall}<span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/100</span></div>
          <div style={{ fontSize: 10.5, color: 'var(--green)', marginTop: 6 }}>High: {h.confidence.high.join(', ')}</div>
          <div style={{ fontSize: 10.5, color: 'var(--accent)' }}>Low: {h.confidence.low.join(', ')}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>{h.confidence.evidence.join(' · ')}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Stint readiness</div>
          <div style={{ display: 'flex', gap: 14 }}>
            <span style={{ fontSize: 11 }}>physical <b style={{ color: scoreColor(h.readiness.physical) }}>{h.readiness.physical}%</b></span>
            <span style={{ fontSize: 11 }}>focus <b style={{ color: scoreColor(h.readiness.focus) }}>{h.readiness.focus}%</b></span>
          </div>
          <div style={{ fontSize: 11, color: 'var(--text)', marginTop: 6 }}>Recommended: <b style={{ color: 'var(--green)' }}>{h.readiness.recommendedStint}</b> · push: {h.readiness.pushLaps}</div>
          <div style={{ fontSize: 11, color: 'var(--accent)' }}>Avoid: {h.readiness.avoid}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{h.readiness.reason}</div>
        </div>
        <div className="card" style={{ padding: 16,
 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Human-aware crash risk</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, fontSize: 11, fontFamily: MONO }}>
            <span style={{ color: 'var(--text-muted)' }}>{h.risk.base}</span>
            <span style={{ color: 'var(--accent)' }}>+{h.risk.fatigueAdj} fatigue</span>
            <span style={{ color: 'var(--accent)' }}>+{h.risk.stressAdj} stress</span>
          </div>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: MONO, color: 'var(--accent)', marginTop: 4 }}>{h.risk.final}<span style={{ fontSize: 11, color: 'var(--text-muted)' }}>/100</span></div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{h.risk.reason}</div>
        </div>
      </div>

      {/* human events + before/after + wellness */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <AlertTriangle size={13} style={{ color: 'var(--yellow)' }} />
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Human performance events</span>
          </div>
          {h.events.map(e => (
            <div key={e.type} style={{ marginBottom: 9, paddingBottom: 9, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{e.type}</span>
                <span style={{ fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)' }}>{e.location}</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', margin: '2px 0' }}>{e.evidence.join(' · ')}</div>
              <div style={{ fontSize: 11 }}><span style={{ color: 'var(--accent)' }}>{e.impact}</span> · <span style={{ color: 'var(--cyan)' }}>{e.recommendation}</span></div>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Before / after · human</div>
            {h.beforeAfter.map(r => (
              <div key={r.metric} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 4 }}>
                <span style={{ flex: 1, color: 'var(--text)' }}>{r.metric}</span>
                <span style={{ fontFamily: MONO, color: 'var(--text-muted)' }}>{r.before}</span>
                <span style={{ color: 'var(--text-muted)' }}>→</span>
                <span style={{ fontFamily: MONO, color: 'var(--green)' }}>{r.after}</span>
              </div>
            ))}
          </div>
          <div className="card" style={{ padding: 16,
 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Rider wellness</div>
            <div style={{ fontSize: 11, fontFamily: MONO, color: 'var(--text-muted)', marginBottom: 6 }}>air {h.wellness.airTempC}°C · track {h.wellness.trackTempC}°C · load {h.wellness.riderLoad}</div>
            {h.wellness.warnings.map(w => <div key={w} style={{ fontSize: 11, color: 'var(--text)' }}>· {w}</div>)}
          </div>
        </div>
      </div>

      {/* oracle human verdict */}
      <div className="card" style={{ padding: 16, marginTop: 14, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
          <Sparkles size={14} style={{ color: 'var(--violet)' }} />
          <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--violet)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Oracle human verdict</span>
        </div>
        <div style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.55 }}>{h.oracleVerdict}</div>
        <div style={{ fontSize: 11.5, color: 'var(--green)', marginTop: 6 }}>{h.recommendation}</div>
      </div>
    </div>
  );
}
