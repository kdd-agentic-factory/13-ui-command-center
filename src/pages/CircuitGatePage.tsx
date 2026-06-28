/**
 * CircuitGatePage Ã¢â‚¬â€ CIRCUIT INTELLIGENCE GATE.
 *
 * Mandatory technical entry to the platform (Landing Ã¢â€ â€™ Gate Ã¢â€ â€™ Dashboard).
 * The dashboard does not open until the session knows which circuit it is on
 * and what real data exists for it:
 *   - searchable circuit library with lifecycle states
 *     (READY / PARTIAL / SIMULATED / NEEDS_REVIEW / INVALID)
 *   - validation checklist (geometry, length, corners, sectors, elevation,
 *     GPS, telemetry, digital twin, agent context)
 *   - dashboard mode derived from circuit state (full/limited/simulation/blocked)
 *   - creation flow for missing circuits: basic data Ã¢â€ â€™ upload formats Ã¢â€ â€™ AI
 *     reconstruction agents Ã¢â€ â€™ initial simulation Ã¢â€ â€™ SIMULATED status
 */
import { useMemo, useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Search, CheckCircle2, XCircle, ChevronRight, Plus, Bot, Gauge,
  Mountain, Route, Radar, ShieldAlert, Wrench, Upload, Eye, FlaskConical,
  Loader2, ArrowLeft, Flag,
} from 'lucide-react';
import { GateProgress } from '../components/GateProgress';
import { useToast } from '../components/ToastProvider';
import { MiniTrackMap } from '../components/MiniTrackMap';
import {
  CircuitRecord, CircuitStatus, getCircuitLibrary, addCircuit, syncCircuitLibrary,
  buildValidationChecklist, dashboardMode, MODE_META, STATUS_META,
  RECONSTRUCTION_AGENTS, buildInitialSimulation, InitialSimulation,
} from '../domain/circuits';

interface Props {
  onOpenDashboard: (circuit: CircuitRecord) => void;
  /** Back to Mission Control (rendered only when provided). */
  onBack?: () => void;
  /** Open directly in the create-circuit wizard. */
  startCreating?: boolean;
}

const MONO = 'JetBrains Mono, monospace';

// Ã¢â€â‚¬Ã¢â€â‚¬ Small bits Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

function StatusBadge({ status }: { status: CircuitStatus }) {
  const meta = STATUS_META[status];
  return (
    <span className={`badge ${meta.badge}`} style={{ fontSize: 10, fontFamily: MONO, letterSpacing: '0.08em' }}>
      {status.replace('_', ' ')}
    </span>
  );
}

function CheckRow({ label, ok, desc }: { label: string; ok: boolean; desc: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      {ok
        ? <CheckCircle2 size={13} style={{ color: 'var(--green)', flexShrink: 0 }} />
        : <XCircle size={13} style={{ color: 'var(--accent)', flexShrink: 0 }} />}
      <span style={{ fontSize: 11.5, color: 'var(--text)', flex: 1 }}>{label}</span>
      <span style={{ fontSize: 10.5, fontFamily: MONO, color: ok ? 'var(--text-muted)' : 'var(--accent)' }}>{desc}</span>
    </div>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Creation wizard Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

const UPLOAD_FORMATS = ['GPX', 'KML', 'GeoJSON', 'CSV GPS trace', 'Telemetry CSV', 'AiM export', '2D datalogger export', 'Manual SVG', 'Onboard video'];
const EXTRA_UPLOADS = ['Elevation profile', 'Sector definitions', 'Corner list', 'Racing line', 'Reference lap', 'Surface notes'];

interface AgentRun {
  name: string;
  state: 'pending' | 'running' | 'done';
  finding: string;
}

function CreateCircuitWizard({ initialName, onCancel, onCreated }: {
  initialName: string;
  onCancel: () => void;
  onCreated: (c: CircuitRecord, sim: InitialSimulation) => void;
}) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [name, setName] = useState(initialName);
  const [country, setCountry] = useState('');
  const [layout, setLayout] = useState('GP');
  const [direction, setDirection] = useState<'clockwise' | 'counter-clockwise'>('clockwise');
  const [lengthKm, setLengthKm] = useState('3.550');
  const [formats, setFormats] = useState<Set<string>>(new Set(['GPX']));
  const [agents, setAgents] = useState<AgentRun[]>([]);
  const [sim, setSim] = useState<InitialSimulation | null>(null);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => () => { timers.current.forEach(clearTimeout); }, []);

  const parsedLength = Math.min(9.9, Math.max(1.2, parseFloat(lengthKm.replace(',', '.')) || 3.55));
  const estTurns = Math.max(8, Math.round(parsedLength * 3.9));

  function runReconstruction() {
    setStep(3);
    const runs: AgentRun[] = RECONSTRUCTION_AGENTS.map(a => ({ name: a.name, state: 'pending', finding: '' }));
    setAgents(runs);
    RECONSTRUCTION_AGENTS.forEach((a, i) => {
      timers.current.push(setTimeout(() => {
        setAgents(prev => prev.map((r, j) => j === i ? { ...r, state: 'running' } : r));
      }, i * 420));
      timers.current.push(setTimeout(() => {
        setAgents(prev => prev.map((r, j) => j === i ? { ...r, state: 'done', finding: a.finding(name, parsedLength, estTurns) } : r));
        if (i === RECONSTRUCTION_AGENTS.length - 1) setSim(buildInitialSimulation(parsedLength));
      }, i * 420 + 380));
    });
  }

  function finishCreate() {
    const record: CircuitRecord = {
      id: `custom-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      name, country: country || 'Ã¢â‚¬â€', layout,
      lengthKm: parsedLength, turns: estTurns, direction, sectors: 3,
      mainStraightKm: null, geometryLoaded: true, elevationModel: 'estimated',
      cornerSetLoaded: estTurns, sectorMapLoaded: true, meshLoaded: false,
      gpsAlignment: 'ready', telemetrySessions: [], digitalTwinReady: true,
      agentContextReady: true, agentConfidence: 0.82, status: 'SIMULATED',
      statusSummary: `GPS trace loaded Ã‚Â· AI-generated corners Ã‚Â· ${parsedLength.toFixed(3)} km`,
      keyZones: [
        { corner: 'T1', note: 'heavy braking (AI-detected)' },
        { corner: `T${Math.round(estTurns / 2)}`, note: 'long right-hander (AI-detected)' },
        { corner: `T${estTurns}`, note: 'exit onto main straight (AI-detected)' },
      ],
      source: 'ai-reconstruction', lastValidated: new Date().toISOString().slice(0, 10),
    };
    addCircuit(record);
    onCreated(record, sim ?? buildInitialSimulation(parsedLength));
  }

  const allDone = agents.length > 0 && agents.every(a => a.state === 'done');

  const inputStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
    borderRadius: 'var(--radius)', padding: '7px 10px', color: 'var(--text)', fontSize: 12.5, fontFamily: MONO,
  };

  return (
    <div className="card" style={{ padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
          <ArrowLeft size={13} /> Back
        </button>
        <span className="card-title" style={{ margin: 0 }}>CREATE NEW CIRCUIT</span>
        <span style={{ fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)' }}>step {step}/3</span>
      </div>

      {step === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Circuit name</div>
            <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="Albacete Circuit" />
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Country</div>
            <input style={inputStyle} value={country} onChange={e => setCountry(e.target.value)} placeholder="Spain" />
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Layout</div>
            <select style={inputStyle} value={layout} onChange={e => setLayout(e.target.value)}>
              <option>GP</option><option>National</option><option>Custom</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Direction</div>
            <select style={inputStyle} value={direction} onChange={e => setDirection(e.target.value as typeof direction)}>
              <option value="clockwise">Clockwise</option>
              <option value="counter-clockwise">Counter-clockwise</option>
            </select>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Approx. length (km)</div>
            <input style={inputStyle} value={lengthKm} onChange={e => setLengthKm(e.target.value)} placeholder="3.550" />
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end' }}>
            <button className="btn-primary" disabled={!name.trim()} onClick={() => setStep(2)}
              style={{ opacity: name.trim() ? 1 : 0.4, display: 'flex', alignItems: 'center', gap: 6 }}>
              Continue <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <Upload size={11} style={{ verticalAlign: -2, marginRight: 4 }} /> Upload track data Ã¢â‚¬â€ accepted formats
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
            {UPLOAD_FORMATS.map(f => {
              const on = formats.has(f);
              return (
                <button key={f} onClick={() => setFormats(prev => { const n = new Set(prev); if (n.has(f)) n.delete(f); else n.add(f); return n; })}
                  style={{
                    padding: '5px 10px', borderRadius: 'var(--radius)', fontSize: 11, fontFamily: MONO, cursor: 'pointer',
                    background: on ? 'rgba(59,130,246,0.15)' : 'rgba(255,255,255,0.04)',
                    border: `1px solid ${on ? 'var(--blue)' : 'var(--border)'}`,
                    color: on ? 'var(--blue)' : 'var(--text-muted)',
                  }}>
                  {f}
                </button>
              );
            })}
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Optional extras</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 16 }}>
            {EXTRA_UPLOADS.map(f => (
              <span key={f} style={{ padding: '4px 9px', borderRadius: 'var(--radius)', fontSize: 10.5, fontFamily: MONO, background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)', color: 'var(--text-muted)' }}>{f}</span>
            ))}
          </div>
          <div style={{ padding: 10, borderRadius: 8, background: 'rgba(167,139,250,0.06)', border: '1px solid rgba(167,139,250,0.25)', marginBottom: 14, fontSize: 11.5, color: 'var(--text)' }}>
            <Bot size={12} style={{ verticalAlign: -2, marginRight: 6, color: 'var(--violet)' }} />
            Incomplete data? <strong>AI reconstruction</strong> rebuilds geometry, corners, sectors and elevation from the GPS trace plus public circuit knowledge.
          </div>
          <button className="btn-primary" onClick={runReconstruction} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Bot size={14} /> Run AI Circuit Reconstruction
          </button>
        </div>
      )}

      {step === 3 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>AI Circuit Reconstruction Ã¢â‚¬â€ agents</div>
            {agents.map(a => (
              <div key={a.name} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '5px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {a.state === 'done'
                  ? <CheckCircle2 size={13} style={{ color: 'var(--green)', flexShrink: 0, marginTop: 2 }} />
                  : a.state === 'running'
                    ? <Loader2 size={13} className="spin" style={{ color: 'var(--blue)', flexShrink: 0, marginTop: 2 }} />
                    : <span style={{ width: 13, height: 13, borderRadius: 999, border: '1px solid var(--border)', flexShrink: 0, marginTop: 2 }} />}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11.5, color: 'var(--text)' }}>{a.name}</div>
                  {a.finding && <div style={{ fontSize: 10.5, fontFamily: MONO, color: 'var(--text-muted)' }}>{a.finding}</div>}
                </div>
              </div>
            ))}
            {allDone && (
              <div style={{ marginTop: 10, fontSize: 11, fontFamily: MONO }}>
                <span style={{ color: 'var(--text-muted)' }}>Confidence </span>
                <span style={{ color: 'var(--violet)', fontWeight: 700 }}>82%</span>
                <span style={{ color: 'var(--text-muted)' }}> Ã‚Â· Status </span>
                <span style={{ color: 'var(--violet)', fontWeight: 700 }}>SIMULATED Ã¢â‚¬â€ requires engineer review</span>
              </div>
            )}
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              <FlaskConical size={11} style={{ verticalAlign: -2, marginRight: 4 }} /> Initial circuit simulation
            </div>
            {!sim && <div style={{ fontSize: 11.5, color: 'var(--text-muted)' }}>Generated when the Digital Twin Agent finishesÃ¢â‚¬Â¦</div>}
            {sim && (
              <div style={{ fontSize: 11.5 }}>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Estimated lap time window</span>
                  <div style={{ fontFamily: MONO, fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>{sim.lapWindow}</div>
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Main performance zones</span>
                  {sim.performanceZones.map(z => <div key={z} style={{ fontFamily: MONO, fontSize: 11, color: 'var(--green)' }}>Ã‚Â· {z}</div>)}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Risk zones</span>
                  {sim.riskZones.map(z => <div key={z} style={{ fontFamily: MONO, fontSize: 11, color: 'var(--accent)' }}>Ã‚Â· {z}</div>)}
                </div>
                <div style={{ marginBottom: 8 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Suggested baseline setup</span>
                  {sim.baselineSetup.map(z => <div key={z} style={{ fontFamily: MONO, fontSize: 11, color: 'var(--text)' }}>Ã‚Â· {z}</div>)}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Recommended first stint</span>
                  <div style={{ fontFamily: MONO, fontSize: 11, color: 'var(--yellow)' }}>{sim.recommendedStint}</div>
                </div>
                <button className="btn-primary" onClick={finishCreate} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Flag size={14} /> Save circuit Ã‚Â· SIMULATED
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// Ã¢â€â‚¬Ã¢â€â‚¬ Main gate Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬Ã¢â€â‚¬

export function CircuitGatePage({ onOpenDashboard, onBack, startCreating }: Props) {
  const { t } = useTranslation();
  const { toast } = useToast();
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState<string>('mugello');
  const [creating, setCreating] = useState(startCreating ?? false);
  const [showPreview, setShowPreview] = useState(false);
  const [, force] = useState(0);

  // Refresh the library from the InsForge circuits table (silent seed fallback).
  useEffect(() => {
    let alive = true;
    void syncCircuitLibrary().then(() => { if (alive) force(x => x + 1); });
    return () => { alive = false; };
  }, []);

  const library = getCircuitLibrary();
  const results = useMemo(
    () => library.filter(c => c.name.toLowerCase().includes(query.trim().toLowerCase())),
    [library, query],
  );
  const selected = library.find(c => c.id === selectedId) ?? null;
  const checks = selected ? buildValidationChecklist(selected) : [];
  const allOk = checks.every(c => c.ok);
  const mode = selected ? dashboardMode(selected.status) : 'blocked';
  const modeMeta = MODE_META[mode];

  return (
    <div className="cockpit-bg" style={{ position: 'fixed', inset: 0, overflowY: 'auto', zIndex: 50 }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px 60px' }} className="gate-enter">

        <GateProgress step={0} />
        {/* Header */}
        <div style={{ marginBottom: 22 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {onBack && (
              <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
                <ArrowLeft size={13} /> Mission Control
              </button>
            )}
            <Radar size={20} style={{ color: 'var(--accent)' }} />
            <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '0.04em', color: 'var(--text)', margin: 0 }}>
              CIRCUIT INTELLIGENCE GATE
            </h1>
          </div>
          <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginTop: 4 }}>
            {t('gates.circuitSubtitle', 'Select, validate or create the circuit before opening the digital pit-box Ã¢â‚¬â€ the dashboard will not open until the session knows which track it is on.')}
          </div>
        </div>

        {creating ? (
          <CreateCircuitWizard
            initialName={query.trim()}
            onCancel={() => setCreating(false)}
            onCreated={(c) => { setCreating(false); setSelectedId(c.id); setQuery(''); force(x => x + 1); }}
          />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 18, alignItems: 'start' }}>

            {/* Ã¢â€â‚¬Ã¢â€â‚¬ Library column Ã¢â€â‚¬Ã¢â€â‚¬ */}
            <div className="card" style={{ padding: 14 }}>
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <Search size={13} style={{ position: 'absolute', left: 10, top: 9, color: 'var(--text-muted)' }} />
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder={t('gates.searchCircuit', 'Search circuit…')}
                  style={{
                    width: '100%', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                    borderRadius: 8, padding: '7px 10px 7px 30px', color: 'var(--text)', fontSize: 12.5,
                  }}
                />
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                Circuit library Ã‚Â· {results.length}
              </div>

              {results.map(c => (
                <button key={c.id} onClick={() => { setSelectedId(c.id); setShowPreview(false); }}
                  style={{
                    display: 'block', width: '100%', textAlign: 'left', cursor: 'pointer',
                    background: c.id === selectedId ? 'rgba(224,55,55,0.07)' : 'transparent',
                    border: `1px solid ${c.id === selectedId ? 'rgba(224,55,55,0.35)' : 'transparent'}`,
                    borderRadius: 8, padding: '8px 10px', marginBottom: 4,
                  }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <MiniTrackMap id={c.id} color={STATUS_META[c.status].color} size={26} active={c.id === selectedId} />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{c.name}</span>
                    <StatusBadge status={c.status} />
                  </div>
                  <div style={{ fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 3, paddingLeft: 20 }}>{c.statusSummary}</div>
                </button>
              ))}

              {results.length === 0 && (
                <div style={{ padding: '14px 8px', textAlign: 'center' }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>Circuit not found</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', margin: '6px 0 10px' }}>
                    No circuit named Ã¢â‚¬Å“{query.trim()}Ã¢â‚¬Â exists in your database.
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', textAlign: 'left', marginBottom: 10 }}>
                    Creation options: GPS/GPX trace Ã‚Â· telemetry CSV Ã‚Â· KML/GeoJSON Ã‚Â· draw manually Ã‚Â· AI reconstruction
                  </div>
                </div>
              )}

              <button onClick={() => setCreating(true)}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, width: '100%',
                  marginTop: 8, padding: '8px 0', borderRadius: 8, cursor: 'pointer', fontSize: 12,
                  background: 'rgba(255,255,255,0.04)', border: '1px dashed var(--border)', color: 'var(--text)',
                }}>
                <Plus size={14} /> Create new circuit
              </button>
            </div>

            {/* Ã¢â€â‚¬Ã¢â€â‚¬ Selected circuit column Ã¢â€â‚¬Ã¢â€â‚¬ */}
            {selected && (
              <div>
                <div className="card" style={{ padding: 18, marginBottom: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                    <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', margin: 0 }}>
                      {selected.name} <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: 13 }}>{selected.layout} Layout</span>
                    </h2>
                    <StatusBadge status={selected.status} />
                    <span style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{STATUS_META[selected.status].desc}</span>
                  </div>

                  {/* Specs grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 10, margin: '14px 0' }}>
                    {[
                      ['Length', `${selected.lengthKm.toFixed(3)} km`],
                      ['Turns', String(selected.turns)],
                      ['Direction', selected.direction === 'clockwise' ? 'CW' : 'CCW'],
                      ['Sectors', String(selected.sectors)],
                      ['Elevation', selected.elevationModel],
                      ['Confidence', `${Math.round(selected.agentConfidence * 100)}%`],
                    ].map(([k, v]) => (
                      <div key={k}>
                        <div style={{ fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{k}</div>
                        <div style={{ fontSize: 14, fontFamily: MONO, fontWeight: 700, color: 'var(--text)' }}>{v}</div>
                      </div>
                    ))}
                  </div>

                  {/* Confidence bar */}
                  <div style={{ height: 5, borderRadius: 99, background: 'rgba(255,255,255,0.06)', marginBottom: 16 }}>
                    <div style={{
                      height: '100%', borderRadius: 99, width: `${selected.agentConfidence * 100}%`,
                      background: selected.agentConfidence > 0.9 ? 'var(--green)' : selected.agentConfidence > 0.75 ? 'var(--yellow)' : 'var(--accent)',
                    }} />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
                    {/* Validation checklist */}
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                        Circuit validation check
                      </div>
                      {checks.map(c => <CheckRow key={c.label} {...c} />)}
                      <div style={{ marginTop: 10, fontSize: 11.5, fontFamily: MONO, color: allOk ? 'var(--green)' : 'var(--yellow)' }}>
                        {allOk
                          ? 'Circuit ready for analysis Ã¢â‚¬â€ you can now open the dashboard.'
                          : mode === 'blocked'
                            ? 'Dashboard blocked until circuit validation is complete.'
                            : `Validation incomplete Ã¢â‚¬â€ dashboard opens in ${modeMeta.label}.`}
                      </div>
                    </div>

                    {/* Circuit intelligence */}
                    <div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 6 }}>
                        Circuit intelligence
                      </div>
                      {selected.mainStraightKm && (
                        <div style={{ fontSize: 11.5, marginBottom: 8 }}>
                          <span style={{ color: 'var(--text-muted)' }}>Main straight </span>
                          <span style={{ fontFamily: MONO, color: 'var(--text)', fontWeight: 700 }}>{selected.mainStraightKm} km</span>
                        </div>
                      )}
                      {selected.keyZones.length > 0 ? selected.keyZones.map(z => (
                        <div key={z.corner} style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                          <Route size={12} style={{ color: 'var(--blue)', flexShrink: 0, marginTop: 2 }} />
                          <span style={{ fontSize: 11.5, fontFamily: MONO, color: 'var(--text)', minWidth: 130 }}>{z.corner}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{z.note}</span>
                        </div>
                      )) : (
                        <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                          No key zones loaded Ã¢â‚¬â€ run a validation stint or AI reconstruction to populate corner intelligence.
                        </div>
                      )}
                      <div style={{ marginTop: 10, fontSize: 10.5, fontFamily: MONO, color: 'var(--text-muted)' }}>
                        Source: {selected.source} Ã‚Â· Last validated {selected.lastValidated}
                        {selected.telemetrySessions.length > 0 && <> Ã‚Â· Telemetry: {selected.telemetrySessions.join(' Ã‚Â· ')}</>}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Preview */}
                {showPreview && (
                  <div className="card" style={{ padding: 16, marginBottom: 14 }}>
                    <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10 }}>
                      <Mountain size={11} style={{ verticalAlign: -2, marginRight: 4 }} /> Circuit preview Ã¢â‚¬â€ elevation & gradient profile
                    </div>
                    <svg viewBox="0 0 600 90" style={{ width: '100%', height: 90 }} preserveAspectRatio="none">
                      {Array.from({ length: 60 }, (_, i) => {
                        const u = i / 59;
                        const h = 18 + 50 * Math.abs(Math.sin(u * Math.PI * 2.2 + 0.4) * 0.7 + Math.sin(u * Math.PI * 5.3) * 0.3);
                        const grad = Math.cos(u * Math.PI * 2.2 + 0.4);
                        return <rect key={i} x={i * 10} y={88 - h} width={8} height={h} rx={1.5}
                          fill={grad > 0.25 ? 'rgba(34,197,94,0.55)' : grad < -0.25 ? 'rgba(224,55,55,0.55)' : 'rgba(255,255,255,0.18)'} />;
                      })}
                    </svg>
                    <div style={{ display: 'flex', gap: 14, fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 6 }}>
                      <span>0 km</span>
                      <span style={{ flex: 1, textAlign: 'center' }}>
                        {selected.keyZones.map(z => z.corner.split(' ')[0]).join(' Ã‚Â· ') || `${selected.turns} AI-detected corners Ã¢â‚¬â€ manual naming recommended`}
                      </span>
                      <span>{selected.lengthKm.toFixed(3)} km</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 10 }}>
                      <span style={{ color: 'var(--green)' }}>Ã¢â€“Â  uphill</span>
                      <span style={{ color: 'var(--accent)' }}>Ã¢â€“Â  downhill</span>
                      <span style={{ color: 'var(--text-muted)' }}>Ã¢â€“Â  flat</span>
                    </div>
                  </div>
                )}

                {/* Mode + actions */}
                <div className="card" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                    <Gauge size={14} style={{ color: modeMeta.color }} />
                    <span style={{ fontSize: 12.5, fontWeight: 700, color: modeMeta.color }}>
                      Dashboard access: {mode === 'full' ? 'FULL' : mode === 'blocked' ? 'BLOCKED' : mode.toUpperCase()}
                    </span>
                    {!allOk && (
                      <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono, monospace', color: 'var(--yellow)' }}>
                        Reason: {checks.find(c => !c.ok)?.label.toLowerCase()} Ã¢â‚¬â€ {checks.find(c => !c.ok)?.desc}
                      </span>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', width: '100%' }}>{modeMeta.note}</span>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    <button className="btn-primary" disabled={mode === 'blocked'}
                      onClick={() => onOpenDashboard(selected)}
                      style={{ opacity: mode === 'blocked' ? 0.4 : 1, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <ChevronRight size={14} />
                      {mode === 'full' ? 'Open Dashboard' : mode === 'limited' ? 'Open Limited Dashboard' : mode === 'simulation' ? 'Open Dashboard in Simulation Mode' : 'Dashboard Blocked'}
                    </button>
                    {[
                      { label: showPreview ? 'Hide Track Preview' : 'Preview Track Map', icon: Eye, fn: () => setShowPreview(p => !p) },
                      { label: 'Run Pre-Session Simulation', icon: FlaskConical, fn: () => setShowPreview(true) },
                      { label: 'Upload New Telemetry', icon: Upload, fn: () => toast({ type: 'info', title: 'Upload queued', message: `Connect Data opens after launch with ${selected.name} locked as the session circuit.` }) },
                      { label: 'Edit Circuit Data', icon: Wrench, fn: () => toast({ type: 'info', title: 'Edit requested', message: `${selected.name} geometry edit queued for engineer review Ã¢â‚¬â€ validation state frozen meanwhile.` }) },
                    ].map(({ label, icon: Icon, fn }) => (
                      <button key={label} onClick={fn}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8,
                          background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)',
                          color: 'var(--text)', fontSize: 11.5, cursor: 'pointer',
                        }}>
                        <Icon size={13} /> {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Single source of truth strip */}
                <div style={{ marginTop: 12, padding: '8px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)', fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)', display: 'flex', flexWrap: 'wrap', gap: 14 }}>
                  <span><ShieldAlert size={10} style={{ verticalAlign: -1, marginRight: 4 }} />session truth</span>
                  <span>selectedCircuit = {selected.name}</span>
                  <span>cornerSet = {selected.cornerSetLoaded}/{selected.turns}</span>
                  <span>sectorMap = {selected.sectorMapLoaded ? `${selected.sectors}/${selected.sectors}` : 'pending'}</span>
                  <span>elevationModel = {selected.elevationModel}</span>
                  <span>agentContext = {selected.agentContextReady ? 'loaded' : 'pending'}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
