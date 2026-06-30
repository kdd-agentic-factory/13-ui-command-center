/**
 * SimLabPage – Sim-to-Real Racing Lab.
 *
 * Rehearse a stint before going out: a scenario with predicted outcome, the
 * expected telemetry signature, a simulated session planner + virtual test day,
 * setup A/B, tyre, fatigue and risk sims, a risk-aware simulated ghost, and the
 * predicted-vs-actual validation after the real stint.
 */
import { FlaskRound, ArrowRight, Sparkles, CheckCircle2, XCircle } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildSimLab } from '../domain/simLab';

const MONO = 'JetBrains Mono, monospace';

export function SimLabPage() {
  const garage = useGarage();
  const { ctx } = useSessionContext();
  const session = ctx.setup.stint ?? ctx.setup.session ?? 'Stint 03';
  const s = buildSimLab(garage.profile.rider.name, `${garage.profile.bike.brand} ${garage.profile.bike.model}`, ctx.circuitName, session, garage.telemetryLimited);

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><FlaskRound size={18} /> Sim-to-Real Racing Lab</h1>
          <p className="page-subtitle">Test virtually · validate on track · learn automatically – {s.combo}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Predicted lap · conf {s.confidence}%</div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: MONO, color: 'var(--cyan)' }}>{s.predictedLap}</div>
        </div>
      </div>

      <div className="card mb-4" style={{ padding: '10px 14px' }}>
        <span style={{ fontSize: 12.5, color: 'var(--text)' }}><b>Objective:</b> {s.objective}</span>
        <span style={{ color: 'var(--text-muted)' }}> · Recommended real test: </span><span style={{ color: 'var(--green)', fontWeight: 700 }}>{s.recommendedTest}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* Scenario + signature */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Simulation scenario · conf {s.scenario.confidence}%</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.7 }}>
            Setup: <span style={{ color: 'var(--text)' }}>{s.scenario.setup}</span><br />
            Tyres: <span style={{ color: 'var(--text)' }}>{s.scenario.tyres}</span> · Track {s.scenario.trackTempC}°C · {s.scenario.stintLaps} laps<br />
            Rider focus: <span style={{ color: 'var(--cyan)' }}>{s.scenario.riderFocus}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginTop: 10, fontSize: 11.5 }}>
            <div><span style={{ color: 'var(--text-muted)' }}>Rear slip: </span><span style={{ color: 'var(--green)' }}>{s.scenario.predictedRearSlip}</span></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Exit: </span><span style={{ color: 'var(--green)' }}>{s.scenario.exitSpeedDelta}</span></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Lap: </span><span style={{ color: 'var(--green)', fontFamily: MONO }}>{s.scenario.lapGain}</span></div>
            <div><span style={{ color: 'var(--text-muted)' }}>Risk: </span><span style={{ color: 'var(--green)', fontFamily: MONO }}>{s.scenario.riskDelta}</span></div>
          </div>
          <div style={{ fontFamily: MONO, fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase', margin: '12px 0 6px' }}>Expected telemetry signature · what to look for</div>
          {s.signature.map(r => (
            <div key={r.channel} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 3 }}>
              <span style={{ flex: 1, color: 'var(--text)' }}>{r.channel}</span>
              <span style={{ fontFamily: MONO, color: 'var(--text-muted)' }}>{r.before}</span>
              <span style={{ color: 'var(--text-muted)' }}>→</span>
              <span style={{ fontFamily: MONO, color: 'var(--cyan)' }}>{r.after}</span>
            </div>
          ))}
        </div>

        {/* Sim vs real */}
        <div className="card" style={{ padding: 16,
 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', flex: 1 }}>Sim-to-real validation</span>
            <span style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--green)' }}>{s.validationStatus} · error {s.modelError}</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr 1fr auto', gap: '5px 10px', fontSize: 11.5 }}>
            {['Metric', 'Predicted', 'Actual', ''].map(h => <span key={h} style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{h}</span>)}
            {s.simVsReal.map(r => (
              <span key={r.metric} style={{ display: 'contents' }}>
                <span style={{ color: 'var(--text)' }}>{r.metric}</span>
                <span style={{ fontFamily: MONO, color: 'var(--text-muted)' }}>{r.predicted}</span>
                <span style={{ fontFamily: MONO, color: 'var(--green)' }}>{r.actual}</span>
                {r.ok ? <CheckCircle2 size={13} style={{ color: 'var(--green)' }} /> : <XCircle size={13} style={{ color: 'var(--accent)' }} />}
              </span>
            ))}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>After the real stint, KDD compares prediction vs actual and updates the Digital Twin.</div>
        </div>
      </div>

      {/* Session planner + virtual test day */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Simulated session planner</div>
          {s.planner.map(o => (
            <div key={o.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, padding: 8, borderRadius: 7, border: `1px solid ${o.recommended ? 'rgba(0,230,118,0.4)' : 'var(--border)'}`, background: o.recommended ? 'rgba(0,230,118,0.05)' : 'transparent' }}>
              <span style={{ fontSize: 11, fontFamily: MONO, color: o.recommended ? 'var(--green)' : 'var(--text-muted)', width: 14 }}>{o.id}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)' }}>{o.name}{o.recommended && <span style={{ fontSize: 9, color: 'var(--green)', marginLeft: 6 }}>RECOMMENDED</span>}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{o.note}</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10.5, fontFamily: MONO, color: 'var(--green)' }}>{o.expectedGain}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{o.risk}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Virtual test day</div>
          {s.virtualDay.map(r => (
            <div key={r.n} style={{ display: 'flex', gap: 10, marginBottom: 7 }}>
              <span style={{ fontSize: 10, fontFamily: MONO, color: 'var(--cyan)', width: 42, flexShrink: 0 }}>Run {r.n}</span>
              <div style={{ flex: 1 }}>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: 'var(--text)' }}>{r.name}</span>
                <span style={{ fontSize: 10.5, color: 'var(--text-muted)', marginLeft: 6 }}>{r.objective}</span>
              </div>
              <span style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--text-muted)' }}>{r.risk}</span>
            </div>
          ))}
        </div>
      </div>

      {/* setup A/B + tyre + fatigue + risk */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Setup A/B simulation</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>A: {s.setupAB.a} · B: <span style={{ color: 'var(--text)' }}>{s.setupAB.b}</span></div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, margin: '6px 0' }}>
            {s.setupAB.diff.map(d => <span key={d} style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--green)', border: '1px solid rgba(0,230,118,0.3)', borderRadius: 4, padding: '1px 6px' }}>{d}</span>)}
          </div>
          <div style={{ fontSize: 11, color: 'var(--cyan)' }}>{s.setupAB.recommendation}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 3 }}>Do not change: {s.setupAB.doNotChange.join(', ')}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Tyre simulation</div>
          {s.tyres.map(t => (
            <div key={t.compound} style={{ fontSize: 11, marginBottom: 4 }}>
              <span style={{ fontWeight: 700, color: 'var(--text)' }}>{t.compound}</span>
              <span style={{ color: 'var(--text-muted)' }}> · window {t.window} · cliff {t.cliff} · {t.bestFor}</span>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Rider fatigue simulation · {s.fatigue.stintLaps} laps</div>
          {s.fatigue.effects.map(e => <div key={e} style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>· {e}</div>)}
          <div style={{ fontSize: 11, color: 'var(--green)', marginTop: 4 }}>{s.fatigue.adjustment}</div>
        </div>
        <div className="card" style={{ padding: 16,
 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Risk simulation</div>
          <div style={{ fontSize: 11 }}>Fastest: <span style={{ fontFamily: MONO, color: 'var(--green)' }}>{s.risk.fastestGain}</span> <span style={{ color: 'var(--accent)' }}>{s.risk.fastestRisk}</span></div>
          <div style={{ fontSize: 11 }}>Safer: <span style={{ fontFamily: MONO, color: 'var(--green)' }}>{s.risk.saferGain}</span> <span style={{ color: 'var(--green)' }}>{s.risk.saferRisk}</span></div>
          <div style={{ fontSize: 11, color: 'var(--cyan)', marginTop: 4 }}>{s.risk.recommendation}</div>
        </div>
      </div>

      {/* simulated ghost + oracle */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16,
 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 6 }}>Simulated ghost lap</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.ghost.type}</div>
          <div style={{ fontSize: 18, fontWeight: 800, fontFamily: MONO, color: 'var(--violet)', margin: '4px 0' }}>{s.ghost.predictedLap}</div>
          <div style={{ fontSize: 11, color: 'var(--text)' }}>{s.ghost.target}</div>
          <div style={{ fontSize: 11, color: 'var(--cyan)', marginTop: 3 }}>{s.ghost.instruction}</div>
        </div>
        <div className="card" style={{ padding: 16, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
            <Sparkles size={14} style={{ color: 'var(--violet)' }} />
            <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--violet)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Oracle simulation verdict</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.55 }}>{s.oracleVerdict}</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, fontSize: 11.5 }}>
            <ArrowRight size={13} style={{ color: 'var(--cyan)' }} />
            <span style={{ color: 'var(--text-muted)' }}>Hand off to Orchestrator as mission: </span><span style={{ color: 'var(--cyan)' }}>{s.missionName}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SimLabPage;
