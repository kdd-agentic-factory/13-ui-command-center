/**
 * ScenarioSandboxPage — interactive what-if on the digital twin.
 *
 * Left: levers (setup, technique, conditions, stint plan). Right: live outputs
 * — projected lap time + delta, crash-risk, tyre life and an Oracle verdict —
 * recomputed deterministically on every change. "What happens if I…?" before
 * committing it to the bike.
 */
import { useState } from 'react';
import { FlaskConical, RotateCcw, Bot } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { Levers, DEFAULT_LEVERS, evaluateScenario, fmtLap } from '../domain/scenarioSandbox';

const MONO = 'JetBrains Mono, monospace';

interface LeverDef { key: keyof Levers; label: string; min: number; max: number; step: number; unit: string; fmt?: (v: number) => string }
const LEVERS: LeverDef[] = [
  { key: 'earlierThrottle', label: 'Throttle earlier on exit', min: 0, max: 0.5, step: 0.05, unit: 's', fmt: v => v.toFixed(2) },
  { key: 'rearRebound', label: 'Rear rebound', min: -2, max: 4, step: 1, unit: 'clk', fmt: v => (v > 0 ? `+${v}` : `${v}`) },
  { key: 'tc', label: 'Traction control', min: -2, max: 3, step: 1, unit: 'step', fmt: v => (v > 0 ? `+${v}` : `${v}`) },
  { key: 'trackTempDelta', label: 'Track temp', min: -10, max: 10, step: 1, unit: '°C', fmt: v => (v > 0 ? `+${v}` : `${v}`) },
  { key: 'rearStintLaps', label: 'Rear soft laps used', min: 0, max: 22, step: 1, unit: 'laps' },
  { key: 'rainRisk', label: 'Rain risk', min: 0, max: 100, step: 5, unit: '%' },
];

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
  const [levers, setLevers] = useState<Levers>({ ...DEFAULT_LEVERS });
  const out = evaluateScenario(levers);

  const toneColor = out.verdictTone === 'good' ? 'var(--green)' : out.verdictTone === 'bad' ? 'var(--accent)' : 'var(--yellow)';
  const riskColor = out.risk >= 78 ? 'var(--accent)' : out.risk >= 65 ? 'var(--yellow)' : 'var(--green)';

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><FlaskConical size={18} /> Scenario Sandbox</h1>
          <p className="page-subtitle">{garage.profile.bike.brand} {garage.profile.bike.model} · interactive what-if on the digital twin</p>
        </div>
        <button onClick={() => setLevers({ ...DEFAULT_LEVERS })}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, cursor: 'pointer', fontSize: 11.5, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text)' }}>
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
        {/* Levers */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>What if…</div>
          {LEVERS.map(l => (
            <div key={l.key} style={{ marginBottom: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text)' }}>{l.label}</span>
                <span style={{ fontFamily: MONO, fontSize: 12, fontWeight: 700, color: 'var(--cyan)' }}>
                  {(l.fmt ? l.fmt(levers[l.key]) : levers[l.key])} {l.unit}
                </span>
              </div>
              <input type="range" min={l.min} max={l.max} step={l.step} value={levers[l.key]}
                onChange={e => setLevers(prev => ({ ...prev, [l.key]: parseFloat(e.target.value) }))}
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

          <div className="card" style={{ padding: 16, borderLeft: `3px solid ${toneColor}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
              <Bot size={14} style={{ color: '#8B5CF6' }} />
              <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.05em', color: '#8B5CF6' }}>ORACLE VERDICT</span>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text)', lineHeight: 1.6 }}>{out.verdict}</div>
          </div>

          <div style={{ fontSize: 10.5, color: 'var(--text-muted)', lineHeight: 1.5 }}>
            Deterministic twin model — same levers, same outcome. A scenario here is a hypothesis; validate it on track before committing to the bike (Setup Lab).
          </div>
        </div>
      </div>
    </div>
  );
}
