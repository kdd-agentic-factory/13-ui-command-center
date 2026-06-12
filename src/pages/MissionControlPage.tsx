/**
 * MissionControlPage — Digital Pit-Wall Mission Control (v3).
 *
 * One decision per zone, strong hierarchy, no crowding:
 *   1. Hero: what this is + 3 CTAs.            4. Primary action cards.
 *   2. System status (right rail).             5. Recent workspaces.
 *   3. START WORKFLOW as four step cards.      6. Oracle brief + data quality.
 *
 * Backdrop: faint Mugello silhouette (the same deterministic geometry the
 * circuit cards use) instead of abstract curves — circuit map, not decoration.
 */
import {
  Radar, MapPin, History, PlayCircle, Plus, ChevronRight, Bot,
  Activity, Database, Gauge, Wifi, Rocket, Lock,
} from 'lucide-react';
import { getCircuitLibrary, STATUS_META } from '../domain/circuits';
import { miniTrackPath } from '../components/MiniTrackMap';

interface Props {
  onSelectCircuit: () => void;
  onCreateCircuit: () => void;
  onLoadLatest: () => void;
  onDemo: () => void;
}

const MONO = 'JetBrains Mono, monospace';
const DISPLAY = 'var(--font-display)';

const CARD: React.CSSProperties = {
  background: 'rgba(255,255,255,0.035)',
  border: '1px solid rgba(255,255,255,0.09)',
  borderRadius: 14,
};

const LABEL: React.CSSProperties = {
  fontFamily: MONO, fontSize: 10, letterSpacing: '0.14em',
  color: 'var(--text-muted)', textTransform: 'uppercase',
};

// ── Pieces ────────────────────────────────────────────────────────────────────

function SecondaryButton({ children, onClick, accent }: {
  children: React.ReactNode; onClick: () => void; accent?: string;
}) {
  const c = accent ?? 'var(--text)';
  return (
    <button onClick={onClick} style={{
      padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12.5, fontWeight: 600,
      background: accent ? `color-mix(in srgb, ${accent} 12%, transparent)` : 'rgba(255,255,255,0.04)',
      border: `1px solid ${accent ?? 'var(--border)'}`, color: c,
    }}>
      {children}
    </button>
  );
}

function StepCard({ n, icon: Icon, title, desc, state, stateColor }: {
  n: string; icon: typeof MapPin; title: string; desc: string; state: string; stateColor: string;
}) {
  return (
    <div className="hover-lift" style={{ ...CARD, padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <span style={{ fontFamily: DISPLAY, fontSize: 26, fontWeight: 700, color: 'rgba(255,255,255,0.14)', lineHeight: 1 }}>{n}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <Icon size={13} style={{ color: '#00B7FF', flexShrink: 0 }} />
          <span style={{ fontFamily: DISPLAY, fontSize: 14.5, fontWeight: 700, letterSpacing: '0.05em', color: 'var(--text)' }}>{title}</span>
        </div>
        <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 3, lineHeight: 1.45 }}>{desc}</div>
        <span style={{
          display: 'inline-block', marginTop: 7, fontFamily: MONO, fontSize: 9,
          padding: '2px 8px', borderRadius: 999, letterSpacing: '0.08em',
          border: `1px solid ${stateColor}`, color: stateColor,
        }}>{state}</span>
      </div>
    </div>
  );
}

function ActionCard({ icon: Icon, title, body, cta, onClick, accent }: {
  icon: typeof MapPin; title: string; body: string; cta: string;
  onClick: () => void; accent: string;
}) {
  return (
    <div className="hover-lift" style={{ ...CARD, padding: 18, display: 'flex', flexDirection: 'column', gap: 9 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={15} style={{ color: accent }} />
        <span style={{ fontFamily: DISPLAY, fontSize: 15, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text)' }}>{title}</span>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.55, flex: 1 }}>{body}</div>
      <button onClick={onClick} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '9px 0', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700,
        background: `color-mix(in srgb, ${accent} 13%, transparent)`,
        border: `1px solid ${accent}`, color: accent,
      }}>
        {cta} <ChevronRight size={13} />
      </button>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function MissionControlPage({ onSelectCircuit, onCreateCircuit, onLoadLatest, onDemo }: Props) {
  const library = getCircuitLibrary();

  return (
    <div className="cockpit-bg" style={{ position: 'fixed', inset: 0, overflowY: 'auto', zIndex: 50 }}>
      {/* Backdrop: faint Mugello silhouette + risk dots */}
      <svg style={{ position: 'fixed', right: '-6%', top: '4%', width: '54%', height: '86%', opacity: 0.07, pointerEvents: 'none' }}
        viewBox="0 0 64 64" preserveAspectRatio="xMidYMid meet" aria-hidden>
        <path d={miniTrackPath('mugello')} fill="none" stroke="#00B7FF" strokeWidth="1.1"
          strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="46" cy="18" r="1.4" fill="#E10600" />
        <circle cx="18" cy="44" r="1.4" fill="#FF6A00" />
      </svg>

      <div style={{ position: 'relative', maxWidth: 1180, margin: '0 auto', padding: '38px 24px 60px' }}>

        {/* ═══ 1 · Hero + system status ═══════════════════════════════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 270px', gap: 20, alignItems: 'start', marginBottom: 26 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Radar size={20} style={{ color: 'var(--accent)' }} />
              <span style={{ ...LABEL, color: '#00B7FF' }}>Digital Pit-Wall Mission Control</span>
            </div>
            <h1 className="display-xxl" style={{ color: 'var(--text)', margin: '8px 0 0' }}>
              KDD MOTO INTELLIGENCE
            </h1>
            <p style={{ fontSize: 13.5, color: 'var(--text-muted)', margin: '12px 0 0', maxWidth: 540, lineHeight: 1.6 }}>
              Tu box digital inteligente para analizar circuitos, tandas, telemetría, setup, neumáticos,
              riesgo y rendimiento del piloto. Antes de analizar una vuelta, KDD entiende el circuito,
              el modo de trabajo y los datos disponibles.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
              <button className="btn-primary" onClick={onSelectCircuit}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', fontSize: 13.5, fontWeight: 700 }}>
                <Rocket size={15} /> Iniciar misión
              </button>
              <SecondaryButton onClick={onDemo} accent="#8B5CF6">Ver demo</SecondaryButton>
              <SecondaryButton onClick={onCreateCircuit}>Crear circuito</SecondaryButton>
            </div>
          </div>

          {/* System status rail */}
          <div style={{ ...CARD, padding: '14px 16px' }} data-testid="system-status">
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: '#00E676', boxShadow: '0 0 7px #00E676' }} />
              <span className="live-sweep" style={{ fontFamily: MONO, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.12em', color: '#00E676', padding: '1px 6px', borderRadius: 4 }}>SYSTEM READY</span>
            </div>
            {[
              ['Circuit DB', `${library.length} tracks`],
              ['Latest session', 'Mugello · Stint 03'],
              ['Data sources', 'GPS · IMU · ECU · CSV'],
              ['Oracle Pit Wall', 'Ready'],
              ['Digital Twin', 'Ready'],
              ['Data quality', '94%'],
              ['Last sync', 'Today · 14:32'],
            ].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 10.5, padding: '2.5px 0' }}>
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontFamily: MONO, color: 'var(--text)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ═══ 2 · START WORKFLOW: four step cards ═════════════════════════ */}
        <div style={{ ...LABEL, marginBottom: 8 }}>
          <Gauge size={11} style={{ verticalAlign: -2, marginRight: 6, color: 'var(--accent)' }} />
          START YOUR SESSION
        </div>
        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
          <StepCard n="01" icon={MapPin} title="CIRCUIT"
            desc="Selecciona un circuito validado o crea uno nuevo." state="NOT SELECTED" stateColor="#FFD600" />
          <StepCard n="02" icon={Gauge} title="MODE"
            desc="Carrera, test, entrenos, tanda, replay, demo o simulación." state="PENDING" stateColor="var(--text-muted)" />
          <StepCard n="03" icon={Wifi} title="DATA"
            desc="GPS, IMU, ECU, logger, CSV, vídeo o datos simulados." state="PENDING" stateColor="var(--text-muted)" />
          <StepCard n="04" icon={Lock} title="LAUNCH"
            desc="Abre un dashboard adaptado al contexto de la sesión." state="LOCKED" stateColor="var(--text-muted)" />
        </div>

        {/* ═══ 3 · Primary action cards ═══════════════════════════════════ */}
        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
          <ActionCard icon={MapPin} accent="#00B7FF" title="CIRCUIT INTELLIGENCE"
            body="Carga un circuito validado: trazado, curvas, sectores, elevación, mapa 3D y contexto de simulación."
            cta="Seleccionar circuito" onClick={onSelectCircuit} />
          <ActionCard icon={History} accent="#00E676" title="LATEST SESSION"
            body="Retoma Mugello · Stint 03 (Yamaha R1 · best 1:57.842 · gain −1.284s) en modo replay con telemetría y reporte."
            cta="Cargar última sesión" onClick={onLoadLatest} />
          <ActionCard icon={Plus} accent="#FFD600" title="CREATE NEW CIRCUIT"
            body="Sube GPX, KML, GeoJSON, CSV o vídeo onboard. Los agentes reconstruyen el trazado y generan la simulación inicial."
            cta="Crear circuito" onClick={onCreateCircuit} />
          <ActionCard icon={PlayCircle} accent="#8B5CF6" title="GUIDED DEMO"
            body="Sesión reproducible de ejemplo: telemetría, 3D, curvas críticas, twin y oráculo. DEMO DATA · sample."
            cta="Abrir demo guiada" onClick={onDemo} />
        </div>

        {/* ═══ 4 · Lower bento ═════════════════════════════════════════════ */}
        <div className="stagger" style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr 1fr', gap: 12 }}>

          {/* Recent workspaces */}
          <div style={{ ...CARD, padding: 16 }}>
            <div style={{ ...LABEL, marginBottom: 10 }}>
              <History size={11} style={{ verticalAlign: -2, marginRight: 6 }} />RECENT WORKSPACES
            </div>
            {[
              ['Mugello · GP Race Simulation', 'Last opened today · ready', '#00E676'],
              ['Mugello · Yamaha R1 · Stint 03', 'Report generated · best 1:57.842', '#00B7FF'],
              ['Jarama · Setup Test', 'Needs telemetry sync', '#FFD600'],
              ['Custom Track 01', 'SIMULATED · needs validation', '#8B5CF6'],
            ].map(([title, sub, c]) => (
              <div key={title as string} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</div>
                  <div style={{ fontSize: 10, fontFamily: MONO, color: c as string }}>{sub}</div>
                </div>
                <button onClick={onSelectCircuit} style={{ fontSize: 9.5, fontFamily: MONO, padding: '3px 9px', borderRadius: 5, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text)' }}>Open</button>
                <button onClick={onLoadLatest} style={{ fontSize: 9.5, fontFamily: MONO, padding: '3px 9px', borderRadius: 5, cursor: 'pointer', background: 'rgba(0,183,255,0.08)', border: '1px solid #00B7FF', color: '#00B7FF' }}>Continue</button>
              </div>
            ))}
          </div>

          {/* Oracle quick brief */}
          <div style={{ ...CARD, padding: 16, borderColor: 'rgba(139,92,246,0.35)' }}>
            <div style={{ ...LABEL, color: '#8B5CF6', marginBottom: 10 }}>
              <Bot size={11} style={{ verticalAlign: -2, marginRight: 6 }} />ORACLE QUICK BRIEF
            </div>
            <div style={{ fontSize: 10.5, fontFamily: MONO, color: 'var(--text-muted)' }}>Latest insight · Mugello · Stint 03</div>
            <div style={{ fontSize: 12.5, color: 'var(--text)', margin: '7px 0', lineHeight: 1.55 }}>
              <strong>T15 Bucine exit</strong> — open throttle 0.3s earlier after lean &lt;54°.
              Validate rear hot pressure after next stint.
            </div>
            <div style={{ display: 'flex', gap: 12, fontSize: 10.5, fontFamily: MONO, flexWrap: 'wrap' }}>
              <span style={{ color: '#00E676' }}>gain −0.42s/lap</span>
              <span style={{ color: '#FFD600' }}>risk medium</span>
              <span style={{ color: '#8B5CF6' }}>confidence 88%</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button onClick={onLoadLatest} style={{ fontSize: 10, fontFamily: MONO, padding: '5px 11px', borderRadius: 6, cursor: 'pointer', background: 'rgba(139,92,246,0.12)', border: '1px solid #8B5CF6', color: '#8B5CF6' }}>Ask Oracle</button>
              <button onClick={onLoadLatest} style={{ fontSize: 10, fontFamily: MONO, padding: '5px 11px', borderRadius: 6, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text)' }}>Open Session Report</button>
            </div>
          </div>

          {/* Data quality center */}
          <div style={{ ...CARD, padding: 16 }}>
            <div style={{ ...LABEL, marginBottom: 10 }}>
              <Database size={11} style={{ verticalAlign: -2, marginRight: 6 }} />DATA QUALITY CENTER
            </div>
            {library.slice(0, 5).map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5.5px 0' }}>
                <span style={{ fontSize: 11.5, color: 'var(--text)', flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.name}</span>
                <div style={{ width: 64, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)', flexShrink: 0 }}>
                  <div style={{ height: '100%', borderRadius: 99, width: `${c.agentConfidence * 100}%`, background: STATUS_META[c.status].color }} />
                </div>
                <span style={{ fontSize: 10, fontFamily: MONO, color: STATUS_META[c.status].color, width: 34, textAlign: 'right', flexShrink: 0 }}>
                  {Math.round(c.agentConfidence * 100)}%
                </span>
              </div>
            ))}
            <div style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 8 }}>
              <Activity size={9} style={{ verticalAlign: -1, marginRight: 4 }} />confidence = geometry · elevation · telemetry
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
