import { useMemo, useState } from 'react';
import { CheckCircle, AlertTriangle, XCircle, Wrench, CalendarCheck,
         Cloud, CloudOff, Trash2, RefreshCw, BarChart2, Layers } from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import { PartGeneratorPanel } from '../components/PartGeneratorPanel';
import { PartViewer3D } from '../components/babylon/PartViewer3D';
import { usePartStorage } from '../hooks/usePartStorage';

// FEA peak stress (MPa) → fraction of a representative yield for the overlay.
const FEA_YIELD_REF = 200;

function partMaterialColor(component: string): string {
  const c = component.toLowerCase();
  if (c.includes('carbon') || c.includes('cfrp')) return '#38BDF8';
  if (c.includes('ti') || c.includes('titan')) return '#A78BFA';
  if (c.includes('alu') || c.includes('al-')) return '#93C5FD';
  return '#38BDF8';
}

// ── Material colours ──────────────────────────────────────────────────────────

const MAT_COLOR: Record<string, string> = {
  carbon:    '#38BDF8',
  aluminium: '#93C5FD',
  titanium:  '#A78BFA',
};

// ── Material engineering properties ──────────────────────────────────────────

const MATERIAL_PROPS = [
  { mat: 'CFRP (T800)',    color: '#38BDF8', density: 1.6,  yieldMPa: 600,  utsMPa: 1000, eMPa: 70,  fatigueMPa: 400, tempMax: 180 },
  { mat: 'Al 7075-T6',    color: '#93C5FD', density: 2.81, yieldMPa: 503,  utsMPa: 572,  eMPa: 72,  fatigueMPa: 159, tempMax: 160 },
  { mat: 'Ti-6Al-4V',     color: '#A78BFA', density: 4.43, yieldMPa: 830,  utsMPa: 950,  eMPa: 114, fatigueMPa: 510, tempMax: 315 },
];

// ── Part definitions ──────────────────────────────────────────────────────────

interface Part {
  name: string;
  component: string;
  system: 'Suspension' | 'Brakes' | 'Chassis' | 'Drivetrain' | 'Aero' | 'Engine';
  km: number;
  maxKm: number;
  status: 'ok' | 'warn' | 'crit';
  mass: number;
  fea: number | null;
  note: string;
}

const INITIAL_PARTS: Part[] = [
  { name: 'Front Fork Assembly',  component: 'Öhlins TTX25',     system: 'Suspension', km: 1240, maxKm: 2000,  status: 'ok',   mass: 4.2,  fea: null, note: '62% life remaining' },
  { name: 'Rear Shock',           component: 'Öhlins TTX36',     system: 'Suspension', km: 1240, maxKm: 1800,  status: 'warn', mass: 2.8,  fea: null, note: 'Schedule service next round' },
  { name: 'Carbon Front Rim',     component: 'Marchesini Ultra', system: 'Chassis',    km: 580,  maxKm: 3000,  status: 'ok',   mass: 1.4,  fea: 107,  note: 'SIMP-optimized · –18% mass' },
  { name: 'Carbon Rear Rim',      component: 'Marchesini Ultra', system: 'Chassis',    km: 580,  maxKm: 3000,  status: 'ok',   mass: 2.1,  fea: 142,  note: 'SIMP-optimized · –15% mass' },
  { name: 'Brake Discs (Front)',  component: 'Brembo GP-Style',  system: 'Brakes',     km: 980,  maxKm: 1200,  status: 'warn', mass: 0.9,  fea: null, note: 'High wear — monitor' },
  { name: 'Brake Pads (Front)',   component: 'Brembo RC19',      system: 'Brakes',     km: 980,  maxKm: 1000,  status: 'crit', mass: 0.15, fea: null, note: 'Replace before next session' },
  { name: 'Swingarm',             component: 'Alu-Ti Hybrid',    system: 'Chassis',    km: 8400, maxKm: 20000, status: 'ok',   mass: 3.8,  fea: 89,   note: 'Topology optimized · –22% mass' },
  { name: 'Front Upper Fairing',  component: 'Carbon Prototype', system: 'Aero',       km: 2100, maxKm: 10000, status: 'ok',   mass: 1.2,  fea: 62,   note: 'Aero variant B3 active' },
  { name: 'Engine #4',            component: 'Prototype V4',     system: 'Engine',     km: 2580, maxKm: 3500,  status: 'ok',   mass: 62.0, fea: null, note: 'Within rev limit · Map 6' },
];

interface DesignVariant {
  part: string;
  variant: string;
  mass: number;
  stress: number;
  yieldMPa: number;
  status: 'Archive' | 'Active' | 'Testing';
}

const DESIGN_VARIANTS: DesignVariant[] = [
  { part: 'Carbon Front Rim', variant: 'V3 Baseline',   mass: 1.68, stress: 118, yieldMPa: 600, status: 'Archive' },
  { part: 'Carbon Front Rim', variant: 'V4 SIMP-INT4',  mass: 1.40, stress: 107, yieldMPa: 600, status: 'Active'  },
  { part: 'Carbon Front Rim', variant: 'V5 Prototype',  mass: 1.31, stress: 122, yieldMPa: 600, status: 'Testing' },
  { part: 'Swingarm',         variant: 'Al Baseline',   mass: 4.90, stress: 145, yieldMPa: 503, status: 'Archive' },
  { part: 'Swingarm',         variant: 'Al-Ti V2',      mass: 4.20, stress: 132, yieldMPa: 620, status: 'Archive' },
  { part: 'Swingarm',         variant: 'Al-Ti V3+SIMP', mass: 3.80, stress: 89,  yieldMPa: 780, status: 'Active'  },
];

const SYSTEM_COLORS: Record<string, string> = {
  Suspension: '#3B82F6',
  Brakes:     '#E03737',
  Chassis:    '#22C55E',
  Drivetrain: '#F59E0B',
  Aero:       '#A78BFA',
  Engine:     '#FB923C',
};

// ── Sub-components ────────────────────────────────────────────────────────────

function StatusIcon({ status }: { status: string }) {
  if (status === 'ok')        return <CheckCircle   size={16} style={{ color: 'var(--green)' }} />;
  if (status === 'warn')      return <AlertTriangle size={16} style={{ color: 'var(--yellow)' }} />;
  if (status === 'scheduled') return <CalendarCheck size={16} style={{ color: 'var(--blue)' }} />;
  return <XCircle size={16} style={{ color: 'var(--accent)' }} />;
}

// Lifecycle heatmap — visual grid of all parts by remaining life
function LifecycleHeatmap({ parts, scheduled }: { parts: Part[]; scheduled: Set<string> }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
      {parts.map(p => {
        const lifePct = Math.round((p.km / p.maxKm) * 100);
        const isScheduled = scheduled.has(p.name);
        const color = isScheduled ? '#3B82F6'
          : lifePct > 90 ? '#E03737'
          : lifePct > 70 ? '#F59E0B'
          : lifePct > 40 ? '#3B82F6'
          : '#22C55E';
        return (
          <div key={p.name} style={{
            padding: '8px 10px',
            background: `${color}12`,
            border: `1px solid ${color}35`,
            borderRadius: 6,
            cursor: 'default',
          }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color,
              fontFamily: 'JetBrains Mono,monospace',
            }}>
              {isScheduled ? '✓' : `${lifePct}%`}
            </div>
            <div style={{
              fontSize: 9, color: 'var(--text-muted)', marginTop: 2,
              lineHeight: 1.3,
            }}>
              {p.name.length > 18 ? p.name.slice(0, 16) + '…' : p.name}
            </div>
            <div style={{ marginTop: 4, height: 3, borderRadius: 2,
              background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ width: `${lifePct}%`, height: '100%', background: color, borderRadius: 2 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Mass evolution chart — per part, bars for each design variant
function MassEvolutionChart({ variants }: { variants: DesignVariant[] }) {
  const parts = [...new Set(variants.map(v => v.part))];
  const maxMass = Math.max(...variants.map(v => v.mass));

  return (
    <div>
      {parts.map(part => {
        const pvs   = variants.filter(v => v.part === part);
        const base  = pvs[0]?.mass ?? 1;
        return (
          <div key={part} style={{ marginBottom: 18 }}>
            <div style={{
              fontSize: 11, fontWeight: 700, color: 'var(--text)',
              marginBottom: 8, letterSpacing: '0.02em',
            }}>
              {part}
            </div>
            {pvs.map(v => {
              const pct     = (v.mass / maxMass) * 100;
              const saving  = ((base - v.mass) / base * 100).toFixed(1);
              const isActive  = v.status === 'Active';
              const isTesting = v.status === 'Testing';
              const barColor  = isActive
                ? 'var(--green)'
                : isTesting
                  ? 'var(--blue)'
                  : 'rgba(255,255,255,0.15)';
              return (
                <div key={v.variant} style={{ marginBottom: 7 }}>
                  <div style={{
                    display: 'flex', justifyContent: 'space-between',
                    marginBottom: 3,
                  }}>
                    <span style={{
                      fontSize: 11,
                      color: isActive ? 'var(--green)' : isTesting ? 'var(--blue)' : 'var(--text-muted)',
                      fontWeight: isActive ? 700 : 400,
                    }}>
                      {v.variant}
                      {isActive && (
                        <span style={{
                          marginLeft: 6, fontSize: 9,
                          color: 'var(--green)',
                          fontFamily: 'JetBrains Mono,monospace',
                        }}>
                          ✓ ACTIVE
                        </span>
                      )}
                    </span>
                    <span style={{
                      fontSize: 10, fontFamily: 'JetBrains Mono,monospace',
                      color: isActive ? 'var(--green)' : isTesting ? 'var(--blue)' : 'var(--text-muted)',
                    }}>
                      {v.mass} kg{parseFloat(saving) > 0 ? ` (–${saving}%)` : ''}
                    </span>
                  </div>
                  <div style={{
                    height: 7, borderRadius: 3,
                    background: 'rgba(255,255,255,0.04)', overflow: 'hidden',
                  }}>
                    <div style={{
                      width: `${pct}%`, height: '100%',
                      background: barColor, borderRadius: 3,
                      transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
      <div style={{
        marginTop: 4, fontSize: 10, color: 'var(--text-muted)',
        fontFamily: 'JetBrains Mono,monospace',
      }}>
        Total SIMP mass saving vs baseline: –{(
          (DESIGN_VARIANTS.filter(v => v.status === 'Active')
            .reduce((a, v) => {
              const baseline = DESIGN_VARIANTS.find(b =>
                b.part === v.part && b.status === 'Archive' &&
                b.variant.includes('Baseline'));
              return a + (baseline ? baseline.mass - v.mass : 0);
            }, 0)
          ).toFixed(2)
        )} kg
      </div>
    </div>
  );
}

// FEA stress analysis — stress bars with safety factor vs material yield
function FEAStressPanel({ variants }: { variants: DesignVariant[] }) {
  const MAX_DISP = 700; // MPa display range

  return (
    <div>
      {variants.map(v => {
        const sf        = (v.yieldMPa / v.stress).toFixed(2);
        const sfNum     = parseFloat(sf);
        const isActive  = v.status === 'Active';
        const isTesting = v.status === 'Testing';
        const sfColor   = sfNum >= 2.5 ? 'var(--green)' : sfNum >= 2.0 ? 'var(--yellow)' : 'var(--accent)';
        const stressPct = Math.min(100, (v.stress    / MAX_DISP) * 100);
        const yieldPct  = Math.min(100, (v.yieldMPa / MAX_DISP) * 100);

        return (
          <div key={`${v.part}-${v.variant}`} style={{
            marginBottom: 14,
            opacity: v.status === 'Archive' ? 0.55 : 1,
            transition: 'opacity 0.2s',
          }}>
            <div style={{
              display: 'flex', justifyContent: 'space-between', marginBottom: 4,
            }}>
              <span style={{
                fontSize: 11,
                fontWeight: isActive ? 700 : 400,
                color: isActive ? 'var(--text)' : isTesting ? 'var(--blue)' : 'var(--text-muted)',
              }}>
                {v.variant} — {v.part}
              </span>
              <span style={{
                fontSize: 11, fontFamily: 'JetBrains Mono,monospace',
                fontWeight: 700, color: sfColor,
              }}>
                SF {sf}
              </span>
            </div>
            {/* Stress bar with yield marker */}
            <div style={{
              position: 'relative', height: 8,
              background: 'rgba(255,255,255,0.04)', borderRadius: 4, overflow: 'visible',
            }}>
              <div style={{
                width: `${stressPct}%`, height: '100%',
                background: sfNum >= 2.0 ? 'var(--green)' : sfNum >= 1.5 ? 'var(--yellow)' : 'var(--accent)',
                borderRadius: 4, transition: 'width 0.5s',
              }} />
              {/* Yield strength marker */}
              <div style={{
                position: 'absolute', left: `${yieldPct}%`, top: -3,
                width: 2, height: 14,
                background: 'rgba(255,255,255,0.5)',
                borderRadius: 1,
              }} />
            </div>
            <div style={{
              display: 'flex', justifyContent: 'space-between', marginTop: 3,
            }}>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
                {v.stress} MPa peak
              </span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'JetBrains Mono,monospace' }}>
                ⌶ {v.yieldMPa} MPa yield
              </span>
            </div>
          </div>
        );
      })}
      <div style={{
        marginTop: 8, padding: '8px 10px',
        background: 'rgba(34,197,94,0.06)',
        border: '1px solid rgba(34,197,94,0.2)',
        borderRadius: 6,
        fontSize: 10, color: 'var(--text-muted)',
        fontFamily: 'JetBrains Mono,monospace',
      }}>
        White marker = material yield strength · SF ≥ 2.5 = design safe
      </div>
    </div>
  );
}

// System mass breakdown — horizontal bar chart by system
function SystemMassChart({ parts }: { parts: Part[] }) {
  const systems = [...new Set(parts.map(p => p.system))];
  const massBySystem = systems.map(sys => ({
    system: sys,
    mass: parts.filter(p => p.system === sys).reduce((a, p) => a + p.mass, 0),
    color: SYSTEM_COLORS[sys] ?? '#888',
  })).sort((a, b) => b.mass - a.mass);
  const total = massBySystem.reduce((a, s) => a + s.mass, 0);

  return (
    <div>
      {massBySystem.map(s => (
        <div key={s.system} style={{ marginBottom: 8 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', marginBottom: 3,
          }}>
            <span style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.system}</span>
            <span style={{
              fontSize: 10, fontFamily: 'JetBrains Mono,monospace',
              color: 'var(--text-muted)',
            }}>
              {s.mass.toFixed(1)} kg ({((s.mass / total) * 100).toFixed(0)}%)
            </span>
          </div>
          <div style={{
            height: 6, borderRadius: 3,
            background: 'rgba(255,255,255,0.04)', overflow: 'hidden',
          }}>
            <div style={{
              width: `${(s.mass / total) * 100}%`, height: '100%',
              background: s.color, borderRadius: 3,
              transition: 'width 0.5s cubic-bezier(0.16,1,0.3,1)',
            }} />
          </div>
        </div>
      ))}
      <div style={{
        marginTop: 10, display: 'flex', justifyContent: 'space-between',
        padding: '8px 0', borderTop: '1px solid var(--border)',
      }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>Total</span>
        <span className="text-mono" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
          {total.toFixed(1)} kg
        </span>
      </div>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function PartDesignPage() {
  const { toast } = useToast();
  const [parts, setParts]                       = useState<Part[]>(INITIAL_PARTS);
  const [scheduledServices, setScheduledServices] = useState<Set<string>>(new Set());
  const [previewPartName, setPreviewPartName]   = useState<string>('Carbon Front Rim');
  const { savedParts, loading: cloudLoading, refresh: cloudRefresh, remove: cloudRemove } = usePartStorage();

  const critParts  = useMemo(() => parts.filter(p => p.status === 'crit' && !scheduledServices.has(p.name)).length, [parts, scheduledServices]);
  const warnParts  = useMemo(() => parts.filter(p => p.status === 'warn' && !scheduledServices.has(p.name)).length, [parts, scheduledServices]);
  const okParts    = useMemo(() => parts.filter(p => p.status === 'ok').length + scheduledServices.size, [parts, scheduledServices]);
  const totalMass  = useMemo(() => parts.reduce((a, p) => a + p.mass, 0), [parts]);

  // Mass saving vs baseline (from SIMP-optimized active variants)
  const massSavingKg = useMemo(() => {
    return DESIGN_VARIANTS.filter(v => v.status === 'Active').reduce((acc, v) => {
      const baseline = DESIGN_VARIANTS.find(b => b.part === v.part && b.status === 'Archive' && b.variant.includes('Baseline'));
      return acc + (baseline ? baseline.mass - v.mass : 0);
    }, 0);
  }, []);

  function addGeneratedPart(name: string, material: string, mass: number, stress: number) {
    const maxKm = material === 'carbon' ? 8000 : material === 'titanium' ? 15000 : 5000;
    setParts(prev => [
      ...prev,
      {
        name,
        component: `AI-Gen · ${material.charAt(0).toUpperCase() + material.slice(1)}`,
        system: 'Chassis',
        km: 0, maxKm,
        status: 'ok',
        mass, fea: stress,
        note: `Generated by AI Part Generator · σ${stress} MPa`,
      },
    ]);
  }

  function scheduleService(part: Part) {
    setScheduledServices(prev => { const n = new Set(prev); n.add(part.name); return n; });
    setParts(prev => prev.map(p =>
      p.name === part.name && p.status === 'crit'
        ? { ...p, status: 'warn', note: `Service scheduled · ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` }
        : p
    ));
    toast({ type: 'success', title: `Service scheduled: ${part.name}`,
      message: `${part.component} — replacement before next session confirmed.` });
  }

  function getDisplayStatus(part: Part): string {
    return scheduledServices.has(part.name) ? 'scheduled' : part.status;
  }

  return (
    <div className="page">

      {/* ── AI Part Generator ─────────────────────────────────────────────── */}
      <PartGeneratorPanel onAddPart={addGeneratedPart} />

      {/* ── 3D Pre-Fabrication Preview (Spec §8.3) ────────────────────────── */}
      {(() => {
        const preview = parts.find(p => p.name === previewPartName) ?? parts[0];
        if (!preview) return null;
        const stressLevel = Math.min(1, (preview.fea ?? 90) / FEA_YIELD_REF);
        return (
          <div className="panel mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="panel__title">
                <Layers size={15} /> 3D Pre-Fabrication Preview
              </div>
              <select
                className="chip-btn"
                value={previewPartName}
                onChange={e => setPreviewPartName(e.target.value)}
                aria-label="Select part to preview"
              >
                {parts.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
              </select>
            </div>
            <PartViewer3D
              partName={preview.name}
              materialColor={partMaterialColor(preview.component)}
              stressLevel={stressLevel}
              toleranceMm={0.05}
              height={300}
            />
          </div>
        );
      })()}

      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Part Design</h1>
          <p className="page-subtitle">Component lifecycle · FEA results · SIMP optimization · Design variants</p>
        </div>
        <div className="flex items-center gap-2">
          {critParts > 0 && <span className="badge badge-red">{critParts} Critical</span>}
          {warnParts > 0 && <span className="badge badge-yellow">{warnParts} Warning</span>}
          {scheduledServices.size > 0 && <span className="badge badge-blue">{scheduledServices.size} Scheduled</span>}
          <span className="badge badge-green">{okParts} Nominal</span>
        </div>
      </div>

      {/* ── KPI tiles ─────────────────────────────────────────────────────── */}
      <div className="grid-4 mb-4">
        <div className="stat-tile accent-border">
          <div className="stat-tile__label">Critical Parts</div>
          <div className="stat-tile__value" style={{ color: critParts > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
            {critParts}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            {critParts === 0 ? 'All acknowledged' : 'Requires attention'}
          </div>
        </div>
        <div className="stat-tile yellow-border">
          <div className="stat-tile__label">Warning Parts</div>
          <div className="stat-tile__value" style={{ color: 'var(--yellow)' }}>{warnParts}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Monitor closely</div>
        </div>
        <div className="stat-tile blue-border">
          <div className="stat-tile__label">Total Component Mass</div>
          <div className="stat-tile__value text-mono">
            {totalMass.toFixed(1)}<span className="stat-tile__unit">kg</span>
          </div>
          <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 4 }}>
            –{massSavingKg.toFixed(1)} kg vs baseline (SIMP)
          </div>
        </div>
        <div className="stat-tile green-border">
          <div className="stat-tile__label">SIMP Variants Active</div>
          <div className="stat-tile__value" style={{ color: 'var(--green)' }}>
            {DESIGN_VARIANTS.filter(v => v.status === 'Active').length}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
            of {[...new Set(DESIGN_VARIANTS.map(v => v.part))].length} parts optimized
          </div>
        </div>
      </div>

      {/* ── Lifecycle heatmap + System mass breakdown ────────────────────── */}
      <div className="grid-2 mb-4">
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2">
              <Layers size={13} />Component Health Overview
            </span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>% life used</span>
          </div>
          <div className="card-body">
            <LifecycleHeatmap parts={parts} scheduled={scheduledServices} />
            <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
              {[
                { label: '> 90%',  color: '#E03737', desc: 'Critical' },
                { label: '70–90%', color: '#F59E0B', desc: 'Warning'  },
                { label: '40–70%', color: '#3B82F6', desc: 'Monitor'  },
                { label: '< 40%',  color: '#22C55E', desc: 'Nominal'  },
              ].map(l => (
                <span key={l.label} style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: 10, color: 'var(--text-muted)',
                }}>
                  <span style={{
                    width: 8, height: 8, borderRadius: 2,
                    background: l.color, display: 'inline-block',
                  }} />
                  {l.label} {l.desc}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2">
              <BarChart2 size={13} />Mass Budget by System
            </span>
            <span className="text-mono" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {totalMass.toFixed(1)} kg total
            </span>
          </div>
          <div className="card-body">
            <SystemMassChart parts={parts} />
          </div>
        </div>
      </div>

      {/* ── Component lifecycle table ─────────────────────────────────────── */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title flex items-center gap-2">
            <Wrench size={14} />Component Lifecycle
          </span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>
            {parts.length} components monitored
          </span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th><th>Part</th><th>System</th><th>Component</th>
              <th>km Used</th><th>Life %</th><th>Mass (kg)</th>
              <th>FEA MPa</th><th>Notes</th><th style={{ width: 120 }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {parts.map(p => {
              const lifePct       = Math.round((p.km / p.maxKm) * 100);
              const displayStatus = getDisplayStatus(p);
              const isScheduled   = scheduledServices.has(p.name);
              return (
                <tr key={p.name} style={
                  p.status === 'crit' && !isScheduled
                    ? { background: 'rgba(224,55,55,0.06)' }
                    : isScheduled
                      ? { background: 'rgba(59,130,246,0.06)' }
                      : {}
                }>
                  <td><StatusIcon status={displayStatus} /></td>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>
                    <span style={{
                      fontSize: 10, fontFamily: 'JetBrains Mono,monospace',
                      color: SYSTEM_COLORS[p.system] ?? 'var(--text-muted)',
                      fontWeight: 600,
                    }}>
                      {p.system}
                    </span>
                  </td>
                  <td className="text-dim" style={{ fontSize: 12 }}>{p.component}</td>
                  <td className="mono">{p.km.toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div className="bar-track" style={{ width: 52 }}>
                        <div className="bar-fill" style={{
                          width: `${lifePct}%`,
                          background: isScheduled ? 'var(--blue)'
                            : lifePct > 85 ? 'var(--accent)'
                            : lifePct > 65 ? 'var(--yellow)'
                            : 'var(--green)',
                        }} />
                      </div>
                      <span className="mono" style={{ fontSize: 11 }}>{lifePct}%</span>
                    </div>
                  </td>
                  <td className="mono">{p.mass}</td>
                  <td className="mono">{p.fea ?? '—'}</td>
                  <td style={{
                    fontSize: 12,
                    color: isScheduled ? 'var(--blue)'
                      : p.status === 'crit' ? 'var(--accent)'
                      : p.status === 'warn' ? 'var(--yellow)'
                      : 'var(--text-muted)',
                  }}>
                    {p.note}
                  </td>
                  <td>
                    {(p.status === 'crit' || p.status === 'warn') && !isScheduled ? (
                      <button
                        className="btn btn-ghost btn-sm flex items-center gap-1"
                        style={{
                          fontSize: 11, padding: '4px 8px',
                          color: p.status === 'crit' ? 'var(--accent)' : 'var(--yellow)',
                          borderColor: p.status === 'crit' ? 'rgba(224,55,55,0.3)' : 'rgba(245,158,11,0.3)',
                        }}
                        onClick={() => scheduleService(p)}
                      >
                        <CalendarCheck size={12} />Schedule
                      </button>
                    ) : isScheduled ? (
                      <span style={{ fontSize: 11, color: 'var(--blue)', fontWeight: 600 }}>✓ Scheduled</span>
                    ) : (
                      <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Mass evolution + FEA analysis ────────────────────────────────── */}
      <div className="grid-2 mb-4">
        <div className="card">
          <div className="card-header">
            <span className="card-title">SIMP Mass Evolution</span>
            <span className="badge badge-green">–{massSavingKg.toFixed(2)} kg total</span>
          </div>
          <div className="card-body">
            <MassEvolutionChart variants={DESIGN_VARIANTS} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <span className="card-title">FEA Stress Analysis</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
              Von Mises · Safety factor
            </span>
          </div>
          <div className="card-body">
            <FEAStressPanel variants={DESIGN_VARIANTS} />
          </div>
        </div>
      </div>

      {/* ── Material properties matrix ────────────────────────────────────── */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Material Properties Matrix</span>
          <span className="badge badge-muted">Engineering reference</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Material</th><th>ρ (g/cm³)</th>
              <th>σ yield (MPa)</th><th>UTS (MPa)</th>
              <th>E (GPa)</th><th>Fatigue (MPa)</th>
              <th>T max (°C)</th><th>Applications</th>
            </tr>
          </thead>
          <tbody>
            {MATERIAL_PROPS.map(m => (
              <tr key={m.mat}>
                <td>
                  <span style={{
                    fontWeight: 700, color: m.color,
                    fontFamily: 'JetBrains Mono,monospace', fontSize: 12,
                  }}>
                    {m.mat}
                  </span>
                </td>
                <td className="mono">{m.density}</td>
                <td className="mono" style={{ color: 'var(--green)' }}>{m.yieldMPa}</td>
                <td className="mono">{m.utsMPa}</td>
                <td className="mono">{m.eMPa}</td>
                <td className="mono" style={{ color: 'var(--yellow)' }}>{m.fatigueMPa}</td>
                <td className="mono">{m.tempMax}°</td>
                <td style={{ fontSize: 11, color: 'var(--text-muted)' }}>
                  {m.mat === 'CFRP (T800)' ? 'Rims · Fairings · Brakes'
                    : m.mat === 'Al 7075-T6' ? 'Swingarm · Chassis brackets'
                    : 'Fasteners · Hybrid joints'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Design variants comparison ────────────────────────────────────── */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Design Variant Comparison — SIMP Optimization Results</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Part</th><th>Variant</th><th>Mass (kg)</th>
              <th>Peak Stress</th><th>Yield</th><th>Safety Factor</th><th>Status</th>
            </tr>
          </thead>
          <tbody>
            {DESIGN_VARIANTS.map((v, i) => {
              const sf    = (v.yieldMPa / v.stress).toFixed(2);
              const sfNum = parseFloat(sf);
              return (
                <tr key={i} style={v.status === 'Active' ? { background: 'rgba(34,197,94,0.06)' } : {}}>
                  <td style={{ fontWeight: 600 }}>{v.part}</td>
                  <td>{v.variant}</td>
                  <td className="mono">{v.mass}</td>
                  <td className="mono" style={{ color: v.stress > 140 ? 'var(--yellow)' : 'var(--text)' }}>
                    {v.stress} MPa
                  </td>
                  <td className="mono" style={{ color: 'var(--text-muted)' }}>
                    {v.yieldMPa} MPa
                  </td>
                  <td className="mono" style={{ color: sfNum >= 2.5 ? 'var(--green)' : sfNum >= 2.0 ? 'var(--yellow)' : 'var(--accent)', fontWeight: 700 }}>
                    {sf}
                  </td>
                  <td>
                    <span className={`badge ${v.status === 'Active' ? 'badge-green' : v.status === 'Testing' ? 'badge-blue' : 'badge-muted'}`}>
                      {v.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Cloud Inventory ───────────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Cloud size={14} style={{ color: '#38BDF8' }} />
            <span className="card-title">Cloud Inventory</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
              InsForge · PostgreSQL + Storage
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
              {savedParts.length} part{savedParts.length !== 1 ? 's' : ''}
            </span>
            <button
              onClick={() => cloudRefresh()}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '4px 10px',
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 5, cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: 11, fontFamily: 'JetBrains Mono,monospace',
              }}
            >
              <RefreshCw size={11} style={{ animation: cloudLoading ? 'spin 1s linear infinite' : 'none' }} />
              Sync
            </button>
          </div>
        </div>

        {cloudLoading && savedParts.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center',
            color: 'var(--text-muted)', fontSize: 12, fontFamily: 'JetBrains Mono,monospace' }}>
            <Wrench size={14} style={{ marginRight: 6, opacity: 0.4 }} />
            Syncing with InsForge...
          </div>
        ) : savedParts.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center',
            color: 'var(--text-muted)', fontSize: 12, fontFamily: 'JetBrains Mono,monospace' }}>
            <CloudOff size={14} style={{ marginRight: 6, opacity: 0.4 }} />
            No AI-generated parts saved yet. Use the generator above and click "Save to InsForge".
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Part ID</th><th>Material</th><th>Dimensions</th>
                <th>Mass</th><th>Peak σ</th><th>SF</th>
                <th>Drag Cd</th><th>Prompt</th><th>Saved</th><th>Sync</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {savedParts.map(p => (
                <tr key={p.part_id}>
                  <td className="mono" style={{ fontSize: 10, color: 'var(--text-muted)' }}>
                    {p.part_id.slice(-10)}
                  </td>
                  <td>
                    <span style={{
                      fontSize: 11, fontWeight: 700,
                      color: MAT_COLOR[p.material] ?? 'var(--text)',
                      fontFamily: 'JetBrains Mono,monospace',
                    }}>
                      {p.material.charAt(0).toUpperCase() + p.material.slice(1)}
                    </span>
                  </td>
                  <td className="mono" style={{ fontSize: 11 }}>{p.dim_x}×{p.dim_y}×{p.dim_z}mm</td>
                  <td className="mono" style={{ color: MAT_COLOR[p.material] }}>{p.mass_kg} kg</td>
                  <td className="mono" style={{ color: p.peak_stress > 250 ? 'var(--yellow)' : 'var(--text)' }}>
                    {p.peak_stress} MPa
                  </td>
                  <td className="mono" style={{ color: p.safety_factor >= 2.0 ? 'var(--green)' : 'var(--yellow)', fontWeight: 700 }}>
                    {p.safety_factor.toFixed(2)}
                  </td>
                  <td className="mono" style={{ fontSize: 11 }}>{p.drag_coeff}</td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 160,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.prompt || '—'}
                  </td>
                  <td style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
                    {p.created_at
                      ? new Date(p.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                      : '—'}
                  </td>
                  <td>
                    {p.synced_to_cloud
                      ? <span style={{ fontSize: 10, color: '#22C55E', fontFamily: 'JetBrains Mono,monospace' }}>☁ Cloud</span>
                      : <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>💾 Local</span>
                    }
                  </td>
                  <td>
                    <button
                      onClick={() => {
                        cloudRemove(p.part_id);
                        toast({ type: 'info', title: 'Removed from local list', message: p.name });
                      }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
