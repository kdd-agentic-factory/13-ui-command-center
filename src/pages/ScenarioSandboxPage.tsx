/**
 * ScenarioSandboxPage ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â interactive what-if on the digital twin.
 *
 * Left: levers (setup, technique, conditions, stint plan). Right: live outputs
 * ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â projected lap time + delta, crash-risk, tyre life and an Oracle verdict ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â
 * recomputed deterministically on every change. "What happens if IÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦?" before
 * committing it to the bike.
 */
import { useState } from 'react';
import { FlaskConical, RotateCcw, Bot, GitBranch, Wifi, WifiOff, Loader2 } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { Levers, DEFAULT_LEVERS, evaluateScenario, fmtLap, validateWithTwin, TwinValidation } from '../domain/scenarioSandbox';
import { runWhatIf } from '../services/api';

const MONO = 'JetBrains Mono, monospace';

interface LeverDef { key: keyof Levers; label: string; min: number; max: number; step: number; unit: string; fmt?: (v: number) => string }
const LEVERS: LeverDef[] = [
  { key: 'earlierThrottle', label: 'Throttle earlier on exit', min: 0, max: 0.5, step: 0.05, unit: 's', fmt: v => v.toFixed(2) },
  { key: 'rearRebound', label: 'Rear rebound', min: -2, max: 4, step: 1, unit: 'clk', fmt: v => (v > 0 ? `+${v}` : `${v}`) },
  { key: 'tc', label: 'Traction control', min: -2, max: 3, step: 1, unit: 'step', fmt: v => (v > 0 ? `+${v}` : `${v}`) },
  { key: 'trackTempDelta', label: 'Track temp', min: -10, max: 10, step: 1, unit: 'ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°C', fmt: v => (v > 0 ? `+${v}` : `${v}`) },
  { key: 'rearStintLaps', label: 'Rear soft laps used', min: 0, max: 22, step: 1, unit: 'laps' },
  { key: 'rainRisk', label: 'Rain risk', min: 0, max: 100, step: 5, unit: '%' },
];

function riskLevelColor(level?: string): string {
  const l = (level ?? '').toLowerCase();
  if (l === 'high' || l === 'critical') return 'var(--accent)';
  if (l === 'medium') return 'var(--yellow)';
  return 'var(--green)';
}

function TwinMetric({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div>
      <div style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{label}</div>
      <div style={{ fontSize: 15, fontFamily: MONO, fontWeight: 700, color }}>{value}</div>
    </div>
  );
}

function Metric({ label, value, sub, color }: { label: string; value: string; sub?: string; color: string }) {
  return (
    <div style={{ flex: 1, minWidth: 120 }}>
      <div style={{ fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</div>
      <div style={{ fontSize: 26, fontFamily: MONO, fontWeight: 800, color }}>{value}</div>
      {sub && <div style={{ fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)' }}>{sub}</div>}
    </div>
  );
}

export function ScenarioSandboxPage() {
  const garage = useGarage();
  const { ctx } = useSessionContext();
  const [levers, setLevers] = useState<Levers>({ ...DEFAULT_LEVERS });
  const out = evaluateScenario(levers);

  // Real Digital Twin validation (on-demand; cleared when levers change).
  const [twin, setTwin] = useState<TwinValidation | null>(null);
  const [validating, setValidating] = useState(false);
  const setLever = (k: keyof Levers, v: number) => { setLevers(prev => ({ ...prev, [k]: v })); setTwin(null); };
  const runTwin = async () => {
    setValidating(true);
    const r = await validateWithTwin(levers, { circuitId: ctx.selectedCircuit, sessionId: ctx.setup.session }, { runWhatIf });
    setTwin(r); setValidating(false);
  };

  const toneColor = out.verdictTone === 'good' ? 'var(--green)' : out.verdictTone === 'bad' ? 'var(--accent)' : 'var(--yellow)';
  const riskColor = out.risk >= 78 ? 'var(--accent)' : out.risk >= 65 ? 'var(--yellow)' : 'var(--green)';

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><FlaskConical size={18} /> Scenario Sandbox</h1>
          <p className="page-subtitle">{garage.profile.bike.brand} {garage.profile.bike.model} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· interactive what-if on the digital twin</p>
        </div>
        <button onClick={() => { setLevers({ ...DEFAULT_LEVERS }); setTwin(null); }}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11.5, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* Levers */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>What ifÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦</div>
          {LEVERS.map(l => (
            <div key={l.key} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text)' }}>{l.label}</span>
                <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: 'var(--cyan)' }}>
                  {(l.fmt ? l.fmt(levers[l.key]) : levers[l.key])} {l.unit}
                </span>
              </div>
              <input type="range" min={l.min} max={l.max} step={l.step} value={levers[l.key]}
                onChange={e => setLever(l.key, parseFloat(e.target.value))}
                style={{ width: '100%', accentColor: 'var(--cyan)' }} />
            </div>
          ))}
        </div>

        {/* Outputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Projected outcome</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Metric label="Lap time" value={fmtLap(out.lapTimeS)}
                sub={`${out.lapTimeDelta <= 0 ? '' : '+'}${out.lapTimeDelta.toFixed(3)} s vs baseline`}
                color={out.lapTimeDelta < 0 ? 'var(--green)' : out.lapTimeDelta > 0 ? 'var(--accent)' : 'var(--text)'} />
              <Metric label="Crash-risk" value={`${out.risk}`} sub="/ 100" color={riskColor} />
              <Metric label="Tyre life" value={`${out.tyreLifeLaps}`} sub="laps to cliff" color={out.tyreLifeLaps <= 1 ? 'var(--accent)' : out.tyreLifeLaps <= 4 ? 'var(--yellow)' : 'var(--green)'} />
            </div>
          </div>

          <div className="card" style={{ padding: 16,
 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
              <Bot size={14} style={{ color: 'var(--violet)' }} />
              <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.05em', color: 'var(--violet)' }}>ORACLE VERDICT</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{out.verdict}</div>
          </div>

          {/* Real Digital Twin validation (17-digital-twin-simulation-lab) */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <GitBranch size={14} style={{ color: 'var(--cyan)' }} />
              <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', flex: 1 }}>Digital Twin validation</span>
              <button onClick={runTwin} disabled={validating}
                style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: MONO, color: 'var(--bg-base)', background: 'var(--cyan)', border: 'none', borderRadius: 'var(--radius)', padding: '6px 11px', cursor: validating ? 'default' : 'pointer', opacity: validating ? 0.6 : 1 }}>
                {validating ? <Loader2 size={12} className="spin" /> : <GitBranch size={12} />} {validating ? 'ValidatingÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦' : 'Validate with Digital Twin'}
              </button>
            </div>

            {!twin && !validating && (
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                Run the current levers through the real twin (17-digital-twin) for a second opinion before committing.
              </div>
            )}

            {twin && !twin.available && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11.5, color: 'var(--text-muted)' }}>
                <WifiOff size={13} /> Digital Twin has no baseline for <b style={{ color: 'var(--text)' }}>&nbsp;{ctx.circuitName}</b>&nbsp;or is asleep ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â local model stands.
              </div>
            )}

            {twin && twin.available && (
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 9.5, fontFamily: MONO, color: 'var(--green)', border: '1px solid rgba(0,230,118,0.4)', borderRadius: 5, padding: '2px 7px' }}>
                    <Wifi size={11} /> LIVE TWIN
                  </span>
                  <span style={{ fontSize: 10, fontFamily: MONO, color: riskLevelColor(twin.riskLevel) }}>risk: {twin.riskLevel?.toUpperCase()}</span>
                  {twin.approvalRequired && <span style={{ fontSize: 10, fontFamily: MONO, color: 'var(--yellow)' }}>ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· approval required</span>}
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 8 }}>
                  <TwinMetric label="Lap ÃƒÆ’Ã…Â½ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â" value={`${(twin.lapDeltaS ?? 0) <= 0 ? '' : '+'}${(twin.lapDeltaS ?? 0).toFixed(3)} s`} color={(twin.lapDeltaS ?? 0) < 0 ? 'var(--green)' : (twin.lapDeltaS ?? 0) > 0 ? 'var(--accent)' : 'var(--text)'} />
                  <TwinMetric label="Stability ÃƒÆ’Ã…Â½ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â" value={(twin.stabilityDelta ?? 0).toFixed(3)} color={(twin.stabilityDelta ?? 0) >= 0 ? 'var(--green)' : 'var(--accent)'} />
                  <TwinMetric label="Rear temp ÃƒÆ’Ã…Â½ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â" value={`${(twin.rearTempDeltaC ?? 0).toFixed(2)} ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â°C`} color="var(--text)" />
                </div>
                {twin.explanation && <div style={{ fontSize: 11.5, color: 'var(--text)', lineHeight: 1.5 }}>{twin.explanation}</div>}
                {twin.limitations && twin.limitations.length > 0 && (
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
                    {twin.limitations.map(l => <div key={l}>ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â· {l}</div>)}
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Instant local model ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â same levers, same outcome ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â for exploration; the Digital Twin button runs the real simulation lab for a verifiable second opinion. A scenario here is a hypothesis; validate it on track before committing to the bike (Setup Lab).
          </div>
        </div>
      </div>
    </div>
  );
}
