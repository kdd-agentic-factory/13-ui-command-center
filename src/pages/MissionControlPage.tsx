/**
 * MissionControlPage — the cockpit entry of KDD Moto Intelligence.
 *
 * Not a landing, not a dashboard: the digital pit-wall's boot screen. It tells
 * the user in one glance what the product is, what state the system is in,
 * and walks them into the workflow:
 *
 *   Circuit → Mode → Data → Launch
 *
 * Bento layout, dark cockpit, glass cards used sparingly: visuals impress,
 * decisions stay obvious (4 primary actions).
 */
import {
  Radar, MapPin, History, PlayCircle, Plus, ChevronRight, Bot,
  Activity, Database, Gauge,
} from 'lucide-react';
import { getCircuitLibrary, STATUS_META } from '../domain/circuits';

interface Props {
  onSelectCircuit: () => void;
  onCreateCircuit: () => void;
  onLoadLatest: () => void;
  onDemo: () => void;
}

const MONO = 'JetBrains Mono, monospace';

const GLASS: React.CSSProperties = {
  background: 'rgba(255,255,255,0.04)',
  border: '1px solid rgba(255,255,255,0.10)',
  borderRadius: 14,
  backdropFilter: 'blur(6px)',
};

function ActionCard({ icon: Icon, title, body, cta, onClick, accent }: {
  icon: typeof MapPin; title: string; body: string; cta: string;
  onClick: () => void; accent: string;
}) {
  return (
    <div style={{ ...GLASS, padding: 18, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={15} style={{ color: accent }} />
        <span style={{ fontSize: 12, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text)' }}>{title}</span>
      </div>
      <div style={{ fontSize: 11.5, color: 'var(--text-muted)', lineHeight: 1.5, flex: 1 }}>{body}</div>
      <button onClick={onClick} style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
        padding: '8px 0', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 700,
        background: `color-mix(in srgb, ${accent} 14%, transparent)`,
        border: `1px solid ${accent}`, color: accent,
      }}>
        {cta} <ChevronRight size={13} />
      </button>
    </div>
  );
}

export function MissionControlPage({ onSelectCircuit, onCreateCircuit, onLoadLatest, onDemo }: Props) {
  const library = getCircuitLibrary();

  return (
    <div style={{ position: 'fixed', inset: 0, overflowY: 'auto', background: '#050608', zIndex: 50 }}>
      {/* Telemetry-line backdrop */}
      <svg style={{ position: 'fixed', inset: 0, width: '100%', height: '100%', opacity: 0.12, pointerEvents: 'none' }} preserveAspectRatio="none" viewBox="0 0 1200 600">
        {[0, 1, 2].map(i => (
          <path key={i} fill="none" stroke={['#00B7FF', '#E10600', '#00E676'][i]} strokeWidth="1.2"
            d={`M0 ${320 + i * 60} C 200 ${180 + i * 40}, 380 ${430 - i * 50}, 600 ${300 + i * 30} S 1000 ${200 + i * 60}, 1200 ${330 - i * 40}`} />
        ))}
      </svg>

      <div style={{ position: 'relative', maxWidth: 1180, margin: '0 auto', padding: '36px 24px 60px' }}>

        {/* ── Header: product + system status ─────────────────────────────── */}
        <div style={{ display: 'flex', gap: 24, alignItems: 'flex-start', marginBottom: 22 }}>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Radar size={22} style={{ color: 'var(--accent)' }} />
              <h1 style={{ fontSize: 26, fontWeight: 900, letterSpacing: '0.06em', color: 'var(--text)', margin: 0 }}>
                KDD MOTO INTELLIGENCE
              </h1>
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 6, maxWidth: 560, lineHeight: 1.55 }}>
              Tu box digital inteligente para analizar circuitos, tandas, telemetría, setup, neumáticos,
              riesgo y rendimiento del piloto. Selecciona un circuito, define el modo de trabajo y deja
              que el Oráculo de Box prepare el contexto técnico.
            </div>
            <div style={{ fontSize: 10.5, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 8 }}>
              Circuit intelligence · Live telemetry · Digital twin · Rider coach · Oracle pit-wall
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button className="btn-primary" onClick={onSelectCircuit} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px', fontSize: 13 }}>
                <ChevronRight size={14} /> Iniciar misión
              </button>
              <button onClick={onDemo} style={{ padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12, background: 'rgba(139,92,246,0.12)', border: '1px solid #8B5CF6', color: '#8B5CF6' }}>
                Ver demo
              </button>
              <button onClick={onCreateCircuit} style={{ padding: '9px 16px', borderRadius: 8, cursor: 'pointer', fontSize: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text)' }}>
                Crear circuito
              </button>
            </div>
          </div>

          {/* System status */}
          <div style={{ ...GLASS, padding: '12px 16px', minWidth: 250 }} data-testid="system-status">
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: 'var(--green)', boxShadow: '0 0 6px var(--green)' }} />
              <span style={{ fontSize: 10.5, fontFamily: MONO, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--green)' }}>SYSTEM READY</span>
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
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 10.5, padding: '2px 0' }}>
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span style={{ fontFamily: MONO, color: 'var(--text)' }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Workflow strip ───────────────────────────────────────────────── */}
        <div style={{ ...GLASS, padding: '12px 18px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 14 }}>
          <Gauge size={14} style={{ color: 'var(--accent)' }} />
          <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', color: 'var(--text)' }}>START YOUR SESSION</span>
          <span style={{ fontSize: 11.5, fontFamily: MONO, color: 'var(--text-muted)' }}>
            1 Select or create circuit · 2 Choose session mode · 3 Load telemetry or simulation · 4 Open the digital pit-wall
          </span>
          <span style={{ marginLeft: 'auto', display: 'flex', gap: 10, fontSize: 10, fontFamily: MONO }}>
            {[['Circuit', 'Not selected'], ['Mode', 'Pending'], ['Data', 'Pending'], ['Dashboard', 'Locked']].map(([k, v]) => (
              <span key={k}><span style={{ color: '#00B7FF' }}>{k}</span> <span style={{ color: 'var(--text-muted)' }}>{v}</span>{k !== 'Dashboard' && <span style={{ color: 'var(--text-muted)' }}> →</span>}</span>
            ))}
          </span>
        </div>

        {/* ── Primary action cards (bento) ─────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 18 }}>
          <ActionCard icon={MapPin} accent="#00B7FF" title="CIRCUIT INTELLIGENCE"
            body="Selecciona un circuito validado. El sistema carga trazado, curvas, sectores, elevación, mapa 3D y contexto de simulación."
            cta="Seleccionar circuito" onClick={onSelectCircuit} />
          <ActionCard icon={History} accent="#00E676" title="LATEST SESSION"
            body="Retoma Mugello · Stint 03 (Yamaha R1 · best 1:43.912 · potential gain −1.284s) en modo replay con telemetría y reporte."
            cta="Cargar última sesión" onClick={onLoadLatest} />
          <ActionCard icon={Plus} accent="#FFD600" title="CREATE NEW CIRCUIT"
            body="Sube GPX, KML, GeoJSON, CSV o vídeo onboard. Los agentes reconstruyen trazado, curvas, sectores, elevación y simulación inicial."
            cta="Crear circuito" onClick={onCreateCircuit} />
          <ActionCard icon={PlayCircle} accent="#8B5CF6" title="GUIDED DEMO"
            body="Explora la plataforma con sesiones reproducibles del circuito: telemetría, 3D, curvas, neumáticos, twin y oráculo. DEMO DATA · sample."
            cta="Abrir demo guiada" onClick={onDemo} />
        </div>

        {/* ── Lower bento: workspaces + oracle + data quality ──────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 12 }}>

          {/* Recent workspaces */}
          <div style={{ ...GLASS, padding: 16 }}>
            <div style={{ fontSize: 10, fontFamily: MONO, letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 10 }}>
              <History size={11} style={{ verticalAlign: -2, marginRight: 5 }} />RECENT WORKSPACES
            </div>
            {[
              ['Mugello · GP Race Simulation', 'Last opened today · ready', 'var(--green)'],
              ['Mugello · Yamaha R1 · Stint 03', 'Report generated · best 1:43.912', '#00B7FF'],
              ['Jarama · Setup Test', 'Needs telemetry sync', 'var(--yellow)'],
              ['Custom Track 01', 'SIMULATED · needs validation', '#8B5CF6'],
            ].map(([title, sub, c]) => (
              <div key={title as string} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{title}</div>
                  <div style={{ fontSize: 10, fontFamily: MONO, color: c as string }}>{sub}</div>
                </div>
                <button onClick={onSelectCircuit} style={{ fontSize: 9.5, fontFamily: MONO, padding: '3px 8px', borderRadius: 5, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text)' }}>Open</button>
                <button onClick={onLoadLatest} style={{ fontSize: 9.5, fontFamily: MONO, padding: '3px 8px', borderRadius: 5, cursor: 'pointer', background: 'rgba(0,183,255,0.08)', border: '1px solid #00B7FF', color: '#00B7FF' }}>Continue</button>
              </div>
            ))}
          </div>

          {/* Oracle quick brief */}
          <div style={{ ...GLASS, padding: 16, borderColor: 'rgba(139,92,246,0.35)' }}>
            <div style={{ fontSize: 10, fontFamily: MONO, letterSpacing: '0.12em', color: '#8B5CF6', marginBottom: 10 }}>
              <Bot size={11} style={{ verticalAlign: -2, marginRight: 5 }} />ORACLE QUICK BRIEF
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Latest insight · Mugello · Stint 03</div>
            <div style={{ fontSize: 12.5, color: 'var(--text)', margin: '6px 0', lineHeight: 1.5 }}>
              <strong>T15 Bucine exit</strong> — open throttle 0.3s earlier after lean &lt;54°.
              Validate rear hot pressure after next stint.
            </div>
            <div style={{ display: 'flex', gap: 14, fontSize: 10.5, fontFamily: MONO }}>
              <span style={{ color: 'var(--green)' }}>gain −0.42s/lap</span>
              <span style={{ color: 'var(--yellow)' }}>risk medium</span>
              <span style={{ color: '#8B5CF6' }}>confidence 88%</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button onClick={onLoadLatest} style={{ fontSize: 10, fontFamily: MONO, padding: '5px 10px', borderRadius: 6, cursor: 'pointer', background: 'rgba(139,92,246,0.12)', border: '1px solid #8B5CF6', color: '#8B5CF6' }}>Ask Oracle</button>
              <button onClick={onLoadLatest} style={{ fontSize: 10, fontFamily: MONO, padding: '5px 10px', borderRadius: 6, cursor: 'pointer', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)', color: 'var(--text)' }}>Open Session Report</button>
            </div>
          </div>

          {/* Data quality center */}
          <div style={{ ...GLASS, padding: 16 }}>
            <div style={{ fontSize: 10, fontFamily: MONO, letterSpacing: '0.12em', color: 'var(--text-muted)', marginBottom: 10 }}>
              <Database size={11} style={{ verticalAlign: -2, marginRight: 5 }} />DATA QUALITY CENTER
            </div>
            {library.slice(0, 5).map(c => (
              <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0' }}>
                <span style={{ fontSize: 11.5, color: 'var(--text)', flex: 1 }}>{c.name}</span>
                <div style={{ width: 70, height: 4, borderRadius: 99, background: 'rgba(255,255,255,0.07)' }}>
                  <div style={{ height: '100%', borderRadius: 99, width: `${c.agentConfidence * 100}%`, background: STATUS_META[c.status].color }} />
                </div>
                <span style={{ fontSize: 10, fontFamily: MONO, color: STATUS_META[c.status].color, width: 34, textAlign: 'right' }}>
                  {Math.round(c.agentConfidence * 100)}%
                </span>
              </div>
            ))}
            <div style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 6 }}>
              <Activity size={9} style={{ verticalAlign: -1, marginRight: 4 }} />confidence = geometry · elevation · telemetry coverage
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
