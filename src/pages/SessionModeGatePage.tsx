/**
 * SessionModeGatePage — SESSION MODE GATE.
 *
 * Second mandatory gate (Landing → Circuit Gate → Session Mode Gate →
 * Dashboard). Knowing the circuit is not enough: this screen captures WHAT we
 * are doing with it — Race / Test / Practice / Track Day / Replay / Demo /
 * Pre-GP / Simulation — collects the mode-specific Session Setup, and emits
 * the global Context Object every dashboard module shares.
 */
import { useMemo, useState } from 'react';
import {
  Flag, Wrench, Timer, Bike, Film, PlayCircle, CalendarDays, FlaskConical,
  ChevronRight, ArrowLeft, CheckCircle2, Database, AlertTriangle,
} from 'lucide-react';
import { GateProgress } from '../components/GateProgress';
import type { CircuitRecord } from '../domain/circuits';
import { STATUS_META } from '../domain/circuits';
import {
  SessionMode, MODE_DEFS, modeDef, setupFieldsForMode, SetupField,
  buildSessionContext, SessionContext, DEMO_PACKAGES,
} from '../domain/sessionContext';
import { MUGELLO_CIRCUIT } from '../domain/sessionTruth';

interface Props {
  circuit: CircuitRecord;
  onBack: () => void;
  onOpen: (ctx: SessionContext) => void;
}

const MONO = 'JetBrains Mono, monospace';

const MODE_ICONS: Record<SessionMode, typeof Flag> = {
  race: Flag, test: Wrench, practice: Timer, trackday: Bike,
  replay: Film, demo: PlayCircle, 'pre-gp': CalendarDays, simulation: FlaskConical,
};

export function SessionModeGatePage({ circuit, onBack, onOpen }: Props) {
  // Circuits built by AI start in simulation mode by suggestion.
  const [mode, setMode] = useState<SessionMode>(circuit.status === 'SIMULATED' ? 'simulation' : 'race');
  const [demoId, setDemoId] = useState<string>(DEMO_PACKAGES[0].id);

  const def = modeDef(mode);
  const raceLaps = circuit.id === MUGELLO_CIRCUIT.id ? MUGELLO_CIRCUIT.raceLaps : Math.round(40 * 2.5 / circuit.lengthKm);
  const baseFields = useMemo(() => setupFieldsForMode(mode, circuit.name, raceLaps), [mode, circuit.name, raceLaps]);
  const [values, setValues] = useState<Record<string, string>>({});

  // Reset captured values when the mode changes (fields differ per mode).
  function pickMode(m: SessionMode) {
    setMode(m);
    setValues({});
  }

  function fieldValue(f: SetupField): string {
    return values[`${mode}:${f.key}`] ?? f.value;
  }

  function openDashboard() {
    const setup: Record<string, string> = {};
    if (mode === 'demo') {
      const pkg = DEMO_PACKAGES.find(p => p.id === demoId)!;
      setup.demoId = pkg.id;       // binds the reproducible session spec
      setup.demoPackage = pkg.title;
      setup.dataType = pkg.dataType;
    } else {
      for (const f of baseFields) setup[f.key] = fieldValue(f);
    }
    onOpen(buildSessionContext(circuit.id, circuit.name, mode, setup));
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
    borderRadius: 6, padding: '7px 10px', color: 'var(--text)', fontSize: 12, fontFamily: MONO,
  };

  return (
    <div style={{ position: 'fixed', inset: 0, overflowY: 'auto', background: 'var(--bg, #0B0D12)', zIndex: 50 }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px 60px' }}>
        <GateProgress step={1} />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 20 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, marginTop: 6 }}>
            <ArrowLeft size={13} /> Circuit
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '0.04em', color: 'var(--text)', margin: 0 }}>
              SESSION MODE GATE
            </h1>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
              Define cómo vas a trabajar con el circuito seleccionado — the dashboard adapts to the chosen mode.
            </div>
          </div>
          {/* Selected circuit recap */}
          <div style={{ textAlign: 'right', fontSize: 11, fontFamily: MONO }}>
            <div style={{ color: 'var(--text)', fontWeight: 700 }}>{circuit.name} {circuit.layout} Layout</div>
            <div style={{ color: STATUS_META[circuit.status].color }}>{circuit.status} · confidence {Math.round(circuit.agentConfidence * 100)}%</div>
            <div style={{ color: 'var(--text-muted)' }}>{circuit.lengthKm.toFixed(3)} km · {circuit.turns} turns</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '380px 1fr', gap: 18, alignItems: 'start' }}>

          {/* ── Mode cards ── */}
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
              What are you doing?
            </div>
            {MODE_DEFS.map(m => {
              const Icon = MODE_ICONS[m.id];
              const on = m.id === mode;
              return (
                <button key={m.id} onClick={() => pickMode(m.id)}
                  style={{
                    display: 'flex', gap: 10, alignItems: 'flex-start', textAlign: 'left', cursor: 'pointer',
                    padding: '10px 12px', borderRadius: 10,
                    background: on ? 'rgba(224,55,55,0.07)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${on ? 'rgba(224,55,55,0.4)' : 'var(--border)'}`,
                  }}>
                  <Icon size={15} style={{ color: on ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0, marginTop: 1 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.05em', color: 'var(--text)' }}>{m.label}</span>
                      <span className="badge" style={{ fontSize: 9, fontFamily: MONO, color: m.badgeColor, border: `1px solid ${m.badgeColor}`, background: 'transparent' }}>{m.badge}</span>
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text)', marginTop: 2 }}>{m.tagline}</div>
                    <div style={{ fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 1 }}>{m.detail}</div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Session Setup panel ── */}
          <div>
            <div className="card" style={{ padding: 18, marginBottom: 14 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <span className="card-title" style={{ margin: 0 }}>{def.label} — SESSION SETUP</span>
                <span className="badge" style={{ fontSize: 9.5, fontFamily: MONO, color: def.badgeColor, border: `1px solid ${def.badgeColor}`, background: 'transparent' }}>{def.badge}</span>
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 14 }}>
                Mode requirements: {def.requirements.join(' · ')}
              </div>

              {/* Demo: package selector */}
              {mode === 'demo' ? (
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                    Latest circuit sessions · {circuit.name}
                  </div>
                  {DEMO_PACKAGES.map((p, i) => {
                    const on = p.id === demoId;
                    return (
                      <button key={p.id} onClick={() => setDemoId(p.id)}
                        style={{
                          display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                          padding: '10px 12px', borderRadius: 8, marginBottom: 6,
                          background: on ? 'rgba(167,139,250,0.08)' : 'rgba(255,255,255,0.02)',
                          border: `1px solid ${on ? '#A78BFA' : 'var(--border)'}`,
                        }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>
                          Session {String(i + 1).padStart(2, '0')} · {p.title}
                        </div>
                        <div style={{ fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)', margin: '3px 0' }}>
                          <Database size={9} style={{ verticalAlign: -1, marginRight: 4 }} />{p.dataType} · Modules: {p.modules.join(' · ')}
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {p.highlights.map(h => (
                            <span key={h} style={{ fontSize: 9.5, fontFamily: MONO, color: '#A78BFA', border: '1px solid rgba(167,139,250,0.3)', borderRadius: 5, padding: '2px 7px' }}>{h}</span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                  <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 8, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.3)', fontSize: 11, color: 'var(--text)' }}>
                    <AlertTriangle size={11} style={{ verticalAlign: -2, marginRight: 6, color: '#A78BFA' }} />
                    <strong>DEMO DATA</strong> — not live; synthetic / historical sample. All values are illustrative. Every widget will carry the DEMO label and no real engineer-approval actions are available.
                  </div>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {baseFields.map(f => (
                    <div key={f.key} style={{ gridColumn: f.options ? 'auto' : 'span 2' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{f.label}</div>
                      {f.options ? (
                        <select style={inputStyle} value={fieldValue(f)}
                          onChange={e => setValues(v => ({ ...v, [`${mode}:${f.key}`]: e.target.value }))}>
                          {f.options.map(o => <option key={o}>{o}</option>)}
                        </select>
                      ) : (
                        <input style={inputStyle} value={fieldValue(f)} placeholder={f.placeholder}
                          onChange={e => setValues(v => ({ ...v, [`${mode}:${f.key}`]: e.target.value }))} />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Simulation-mode confidence warning */}
              {mode === 'simulation' && (
                <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.3)', fontSize: 11, color: 'var(--text)' }}>
                  <AlertTriangle size={11} style={{ verticalAlign: -2, marginRight: 6, color: '#A78BFA' }} />
                  Simulation confidence <strong style={{ fontFamily: MONO }}>{Math.round(circuit.agentConfidence * 100)}%</strong> — predictions will be labelled AI-estimated. Run a validation stint before using advanced predictions.
                </div>
              )}

              <button className="btn-primary" onClick={openDashboard}
                style={{ marginTop: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
                <ChevronRight size={14} /> {def.openLabel}
              </button>
            </div>

            {/* Context Object preview — the single source of truth all pages share */}
            <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: 14 }}>
              <span><CheckCircle2 size={10} style={{ verticalAlign: -1, marginRight: 4 }} />context object</span>
              <span>selectedCircuit = {circuit.id}</span>
              <span>sessionMode = {mode}</span>
              <span>dataMode = {def.dataMode}</span>
              <span>dashboardProfile = {def.dashboardProfile}</span>
              <span>pitStrategy = {def.pitStrategyEnabled ? 'enabled' : 'disabled'}</span>
              <span>demoMode = {String(def.demoMode)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
