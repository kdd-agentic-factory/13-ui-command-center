import { useMemo, useState } from 'react';
import {
  CheckCircle, AlertTriangle, XCircle, Wrench, CalendarCheck,
  Cloud, CloudOff, Trash2, RefreshCw, BarChart2, Layers,
  Shield, Printer, Settings,
  Clock, CheckSquare, FileText, ChevronRight,
} from 'lucide-react';
import { useToast } from '../components/ToastProvider';
import { PartGeneratorPanel } from '../components/PartGeneratorPanel';
import { PartViewer3D } from '../components/babylon/lazy';
import { usePartStorage } from '../hooks/usePartStorage';

/**
 * GARAGE PART FACTORY — Trackside additive manufacturing workflow.
 *
 * Covers the full cycle:
 *   need → AI design → FEA → digital twin → print queue → QC → install
 *
 * Parts classified by installation risk (Class A–D).
 * All Mugello corners referenced are real.
 */

/* ══ Types ════════════════════════════════════════════════════════════════ */

type InstallClass = 'A' | 'B' | 'C' | 'D';
type WorkflowStep = 'requirement' | 'cad' | 'geometry' | 'fea' | 'twin' | 'print' | 'approval' | 'qc' | 'install';

interface WorkflowStatus {
  step: WorkflowStep;
  label: string;
  status: 'complete' | 'running' | 'pending' | 'blocked';
}

interface PrintJob {
  printer: string;
  technology: string;
  status: 'printing' | 'idle' | 'unavailable';
  compatible: boolean;
}

interface ComponentPart {
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

interface DesignVariant {
  part: string;
  variant: string;
  mass: number;
  stress: number;
  yieldMPa: number;
  status: 'Archive' | 'Active' | 'Testing';
}

interface MaterialDef {
  name: string;
  color: string;
  process: string;
  trackside: string;
  use: string;
}

/* ══ Constants ════════════════════════════════════════════════════════════ */

const INSTALL_CLASSES: { class: InstallClass; label: string; description: string; color: string }[] = [
  { class: 'A', label: 'Trackside printable',     description: 'Non-structural covers, ducts, cable guides, sensor brackets, fairing tabs, cooling deflectors.', color: 'var(--green)' },
  { class: 'B', label: 'Conditional use',          description: 'Low-load brackets, camera mounts, aero sensor mounts, temporary fairing supports. Requires engineer approval and QC check.', color: 'var(--yellow)' },
  { class: 'C', label: 'Prototype only',           description: 'Footrest hanger, aero bracket, bearing housing, structural mounts. Fit check only — not for race use.', color: 'var(--orange)' },
  { class: 'D', label: 'Restricted / critical',    description: 'Rims, swingarm, brake components, fork components, engine internals. Not eligible for trackside print-and-install.', color: 'var(--accent)' },
];

const WORKFLOW: WorkflowStatus[] = [
  { step: 'requirement', label: 'Requirement captured', status: 'complete' },
  { step: 'cad',         label: 'CAD generated',        status: 'complete' },
  { step: 'geometry',    label: 'Geometry checked',     status: 'complete' },
  { step: 'fea',          label: 'FEA load cases',       status: 'running' },
  { step: 'twin',         label: 'Digital twin impact',  status: 'pending' },
  { step: 'print',        label: 'Print queue',           status: 'pending' },
  { step: 'approval',     label: 'Engineer approval',    status: 'pending' },
  { step: 'qc',           label: 'QC check',             status: 'pending' },
  { step: 'install',      label: 'Install log',          status: 'pending' },
];

const PRINTERS: PrintJob[] = [
  { printer: 'Garage Printer 01',     technology: 'Bambu X1E · Nylon-CF',      status: 'idle', compatible: true },
  { printer: 'Garage Printer 02',     technology: 'Formlabs Fuse · SLS Nylon', status: 'idle', compatible: true },
  { printer: 'External Supplier',     technology: 'Metal PBF',                  status: 'unavailable', compatible: false },
];

const MATERIALS: MaterialDef[] = [
  { name: 'Nylon-CF',    color: 'var(--cyan)', process: 'FDM / SLS',              trackside: 'Yes',        use: 'brackets, ducts, sensor mounts' },
  { name: 'PA12',        color: 'var(--green)', process: 'SLS',                    trackside: 'Yes',        use: 'fairing tabs, cable guides' },
  { name: 'PETG-CF',     color: 'var(--yellow)', process: 'FDM',                    trackside: 'Yes',        use: 'low-temp temporary parts' },
  { name: 'PEEK-CF',     color: 'var(--orange)', process: 'high-temp FDM',          trackside: 'Conditional', use: 'hot-zone brackets' },
  { name: 'Al 7075-T6',  color: 'var(--blue)', process: 'CNC',                    trackside: 'No',         use: 'structural machined brackets' },
  { name: 'Ti-6Al-4V',   color: 'var(--violet)', process: 'Metal PBF',              trackside: 'External',   use: 'high-load joints' },
  { name: 'CFRP T800',   color: 'var(--blue)', process: 'composite layup',        trackside: 'No',         use: 'rims, fairings, aero panels' },
];

const ENG_MATERIAL_PROPS = [
  { mat: 'CFRP (T800)',    color: 'var(--blue)', density: 1.6,  yieldMPa: 600,  utsMPa: 1000, eMPa: 70,  fatigueMPa: 400, tempMax: 180 },
  { mat: 'Al 7075-T6',    color: 'var(--blue)', density: 2.81, yieldMPa: 503,  utsMPa: 572,  eMPa: 72,  fatigueMPa: 159, tempMax: 160 },
  { mat: 'Ti-6Al-4V',     color: 'var(--violet)', density: 4.43, yieldMPa: 830,  utsMPa: 950,  eMPa: 114, fatigueMPa: 510, tempMax: 315 },
];

const FEA_YIELD_REF = 200;

const CAD_MODELS: { name: string; url: string; stress: number; color: string }[] = [
  { name: 'CHASIS (CAD)',     url: '/models/chasis.stl',     stress: 0.55, color: 'var(--violet)' },
  { name: 'BASCULANTE (CAD)', url: '/models/basculante.stl', stress: 0.60, color: 'var(--blue)' },
];

const INITIAL_PARTS: ComponentPart[] = [
  { name: 'Front Fork Assembly',  component: 'Öhlins TTX25',     system: 'Suspension', km: 1240, maxKm: 2000,  status: 'ok',   mass: 4.2,  fea: null, note: '62% life remaining' },
  { name: 'Rear Shock',           component: 'Öhlins TTX36',     system: 'Suspension', km: 1240, maxKm: 1800,  status: 'warn', mass: 2.8,  fea: null, note: 'Schedule service next round' },
  { name: 'Carbon Front Rim',     component: 'Marchesini Ultra', system: 'Chassis',    km: 580,  maxKm: 3000,  status: 'ok',   mass: 1.4,  fea: 107,  note: 'SIMP-optimized · -18% mass' },
  { name: 'Carbon Rear Rim',      component: 'Marchesini Ultra', system: 'Chassis',    km: 580,  maxKm: 3000,  status: 'ok',   mass: 2.1,  fea: 142,  note: 'SIMP-optimized · -15% mass' },
  { name: 'Brake Discs (Front)',  component: 'Brembo GP-Style',  system: 'Brakes',     km: 980,  maxKm: 1200,  status: 'warn', mass: 0.9,  fea: null, note: 'High wear — monitor' },
  { name: 'Brake Pads (Front)',   component: 'Brembo RC19',      system: 'Brakes',     km: 980,  maxKm: 1000,  status: 'crit', mass: 0.15, fea: null, note: 'Replace before next session' },
  { name: 'Swingarm',             component: 'Alu-Ti Hybrid',    system: 'Chassis',    km: 8400, maxKm: 20000, status: 'ok',   mass: 3.8,  fea: 89,   note: 'Topology optimized · -22% mass' },
  { name: 'Front Upper Fairing',  component: 'Carbon Prototype', system: 'Aero',       km: 2100, maxKm: 10000, status: 'ok',   mass: 1.2,  fea: 62,   note: 'Aero variant B3 active' },
  { name: 'Engine #4',            component: 'Prototype V4',     system: 'Engine',     km: 2580, maxKm: 3500,  status: 'ok',   mass: 62.0, fea: null, note: 'Within rev limit · Map 6' },
];

const DESIGN_VARIANTS: DesignVariant[] = [
  { part: 'Carbon Front Rim', variant: 'V3 Baseline',     mass: 1.68, stress: 118, yieldMPa: 600, status: 'Archive' },
  { part: 'Carbon Front Rim', variant: 'V4 SIMP-INT4',    mass: 1.40, stress: 107, yieldMPa: 600, status: 'Active'  },
  { part: 'Carbon Front Rim', variant: 'V5 Prototype',    mass: 1.31, stress: 122, yieldMPa: 600, status: 'Testing' },
  { part: 'Swingarm',         variant: 'Al Baseline',     mass: 4.90, stress: 145, yieldMPa: 503, status: 'Archive' },
  { part: 'Swingarm',         variant: 'Al-Ti V2',        mass: 4.20, stress: 132, yieldMPa: 620, status: 'Archive' },
  { part: 'Swingarm',         variant: 'Al-Ti V3+SIMP',  mass: 3.80, stress: 89,  yieldMPa: 780, status: 'Active'  },
];

const SYSTEM_COLORS: Record<string, string> = {
  Suspension: 'var(--blue)', Brakes: 'var(--accent)', Chassis: 'var(--green)',
  Drivetrain: 'var(--yellow)', Aero: 'var(--violet)',   Engine: 'var(--orange)',
};

const MAT_COLOR: Record<string, string> = {
  carbon:    'var(--cyan)',
  aluminium: 'var(--blue)',
  titanium:  'var(--violet)',
};

/* ══ Helpers ══════════════════════════════════════════════════════════════ */

function partMaterialColor(component: string): string {
  const c = component.toLowerCase();
  if (c.includes('carbon') || c.includes('cfrp')) return 'var(--cyan)';
  if (c.includes('ti') || c.includes('titan')) return 'var(--violet)';
  if (c.includes('alu') || c.includes('al-')) return 'var(--blue)';
  return 'var(--cyan)';
}

const wfIcon = (status: string) => {
  if (status === 'complete') return <CheckCircle size={13} style={{ color: 'var(--green)' }} />;
  if (status === 'running')  return <div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid var(--yellow)', animation: 'spin 1s linear infinite', borderTopColor: 'transparent' }} />;
  if (status === 'blocked')  return <XCircle size={13} style={{ color: 'var(--accent)' }} />;
  return <div style={{ width: 13, height: 13, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.1)' }} />;
};

function StatusIcon({ status }: { status: string }) {
  if (status === 'ok')        return <CheckCircle   size={16} style={{ color: 'var(--green)' }} />;
  if (status === 'warn')      return <AlertTriangle size={16} style={{ color: 'var(--yellow)' }} />;
  if (status === 'scheduled') return <CalendarCheck size={16} style={{ color: 'var(--blue)' }} />;
  return <XCircle size={16} style={{ color: 'var(--accent)' }} />;
}

/* ══ Sub-components ═══════════════════════════════════════════════════════ */

function WorkflowPipeline({ steps }: { steps: WorkflowStatus[] }) {
  return (
    <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
      {steps.map((s, i) => (
        <div key={s.step} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            padding: '4px 8px', borderRadius: 4, fontSize: 10,
            fontFamily: 'var(--font-mono)',
            background: s.status === 'complete' ? 'rgba(34,197,94,0.08)'
              : s.status === 'running' ? 'rgba(251,191,36,0.08)'
              : s.status === 'blocked' ? 'rgba(224,55,55,0.08)'
              : 'rgba(255,255,255,0.03)',
            border: `1px solid ${
              s.status === 'complete' ? 'rgba(34,197,94,0.25)'
                : s.status === 'running' ? 'rgba(251,191,36,0.25)'
                : s.status === 'blocked' ? 'rgba(224,55,55,0.25)'
                : 'rgba(255,255,255,0.06)'
            }`,
            color: s.status === 'complete' ? 'var(--green)'
              : s.status === 'running' ? 'var(--yellow)'
              : s.status === 'blocked' ? 'var(--accent)'
              : 'var(--text-muted)',
          }}>
            {wfIcon(s.status)}
            {s.label}
          </div>
          {i < steps.length - 1 && (
            <ChevronRight size={10} style={{ color: 'rgba(255,255,255,0.15)', flex: 'none' }} />
          )}
        </div>
      ))}
    </div>
  );
}

function EligibilityGate() {
  return (
    <div className="card" style={{
 }}>
      <div className="card-header" style={{ marginBottom: 6 }}>
        <span className="card-title flex items-center gap-2"><Shield size={14} style={{ color: 'var(--yellow)' }} /> PRINT ELIGIBILITY</span>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
        <div>
          <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Requested part</div>
          <div style={{ color: 'var(--text)', fontWeight: 600 }}>Aero winglet support bracket</div>
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Eligibility</div>
          <div style={{ color: 'var(--yellow)', fontWeight: 600 }}>Conditional</div>
        </div>
        <div>
          <div style={{ color: 'var(--text-muted)', marginBottom: 2 }}>Allowed use</div>
          <div style={{ color: 'var(--green)' }}>Practice / fit check</div>
        </div>
      </div>
      <div style={{ marginTop: 6, fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', padding: '4px 8px', background: 'rgba(255,255,255,0.02)', borderRadius: 4 }}>
        <span style={{ color: 'var(--yellow)' }}>⚠</span> Aero support under load requires FEA validation and signed engineering approval. Race use requires technical compliance.
      </div>
    </div>
  );
}

function LifecycleHeatmap({ parts, scheduled }: { parts: ComponentPart[]; scheduled: Set<string> }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
      {parts.map(p => {
        const lifePct = Math.round((p.km / p.maxKm) * 100);
        const isScheduled = scheduled.has(p.name);
        const color = isScheduled ? 'var(--blue)'
          : lifePct > 90 ? 'var(--accent)'
          : lifePct > 70 ? 'var(--yellow)'
          : lifePct > 40 ? 'var(--blue)'
          : 'var(--green)';
        return (
          <div key={p.name} style={{
            padding: '8px 10px', background: `${color}12`,
            border: `1px solid ${color}35`, borderRadius: 'var(--radius)', cursor: 'default',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color, fontFamily: 'var(--font-mono)' }}>
              {isScheduled ? '✓' : `${lifePct}%`}
            </div>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.3 }}>
              {p.name.length > 18 ? p.name.slice(0, 16) + '…' : p.name}
            </div>
            <div style={{ marginTop: 4, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <div style={{ width: `${lifePct}%`, height: '100%', background: color, borderRadius: 2 }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function SystemMassChart({ parts }: { parts: ComponentPart[] }) {
  const systems = [...new Set(parts.map(p => p.system))];
  const massBySystem = systems.map(sys => ({
    system: sys,
    mass: parts.filter(p => p.system === sys).reduce((a, p) => a + p.mass, 0),
    color: SYSTEM_COLORS[sys] ?? 'var(--text-muted)',
  })).sort((a, b) => b.mass - a.mass);
  const total = massBySystem.reduce((a, s) => a + s.mass, 0);
  return (
    <div>
      {massBySystem.map(s => (
        <div key={s.system} style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
            <span style={{ fontSize: 11, color: s.color, fontWeight: 600 }}>{s.system}</span>
            <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {s.mass.toFixed(1)} kg ({((s.mass / total) * 100).toFixed(0)}%)
            </span>
          </div>
          <div style={{ height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
            <div style={{ width: '100%', height: '100%', background: s.color, borderRadius: 3, transform: `scaleX(${s.mass / total})`, transformOrigin: 'left center', transition: 'transform 0.5s var(--ease-ui)' }} />
          </div>
        </div>
      ))}
      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--border)' }}>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>Total monitored</span>
        <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--text)' }}>{total.toFixed(1)} kg</span>
      </div>
      <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
        This is monitored component mass, not total bike weight.
      </div>
    </div>
  );
}

function FEAStressPanel({ variants }: { variants: DesignVariant[] }) {
  const MAX_DISP = 700;
  return (
    <div>
      {variants.map(v => {
        const sf = (v.yieldMPa / v.stress).toFixed(2);
        const sfNum = parseFloat(sf);
        const isActive = v.status === 'Active';
        const isTesting = v.status === 'Testing';
        const sfColor = sfNum >= 2.5 ? 'var(--green)' : sfNum >= 2.0 ? 'var(--yellow)' : 'var(--accent)';
        const stressPct = Math.min(100, (v.stress / MAX_DISP) * 100);
        const yieldPct = Math.min(100, (v.yieldMPa / MAX_DISP) * 100);
        return (
          <div key={`${v.part}-${v.variant}`} style={{ marginBottom: 14, opacity: v.status === 'Archive' ? 0.55 : 1 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: isActive ? 700 : 400, color: isActive ? 'var(--text)' : isTesting ? 'var(--blue)' : 'var(--text-muted)' }}>
                {v.variant} — {v.part}
              </span>
              <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700, color: sfColor }}>SF {sf}</span>
            </div>
            <div style={{ position: 'relative', height: 8, background: 'rgba(255,255,255,0.04)', borderRadius: 4, overflow: 'visible' }}>
              <div style={{ width: '100%', height: '100%', background: sfNum >= 2.0 ? 'var(--green)' : sfNum >= 1.5 ? 'var(--yellow)' : 'var(--accent)', borderRadius: 4, transform: `scaleX(${stressPct / 100})`, transformOrigin: 'left center', transition: 'transform 0.5s var(--ease-ui)' }} />
              <div style={{ position: 'absolute', left: `${yieldPct}%`, top: -3, width: 2, height: 14, background: 'rgba(255,255,255,0.5)', borderRadius: 1 }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 3 }}>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{v.stress} MPa peak</span>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-mono)' }}>≤ {v.yieldMPa} MPa yield</span>
            </div>
          </div>
        );
      })}
      <div style={{ marginTop: 8, padding: '8px 10px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 'var(--radius)', fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
        White marker = material yield strength · SF ≥ 2.5 = design safe
      </div>
    </div>
  );
}

function MassEvolutionChart({ variants }: { variants: DesignVariant[] }) {
  const parts = [...new Set(variants.map(v => v.part))];
  const maxMass = Math.max(...variants.map(v => v.mass));
  return (
    <div>
      {parts.map(part => {
        const pvs = variants.filter(v => v.part === part);
        const base = pvs[0]?.mass ?? 1;
        return (
          <div key={part} style={{ marginBottom: 18 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', marginBottom: 8, letterSpacing: '0.02em' }}>{part}</div>
            {pvs.map(v => {
              const pct = (v.mass / maxMass) * 100;
              const saving = ((base - v.mass) / base * 100).toFixed(1);
              const isActive = v.status === 'Active';
              const isTesting = v.status === 'Testing';
              const barColor = isActive ? 'var(--green)' : isTesting ? 'var(--blue)' : 'rgba(255,255,255,0.15)';
              return (
                <div key={v.variant} style={{ marginBottom: 7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 11, color: isActive ? 'var(--green)' : isTesting ? 'var(--blue)' : 'var(--text-muted)', fontWeight: isActive ? 700 : 400 }}>
                      {v.variant}
                      {isActive && <span style={{ marginLeft: 6, fontSize: 9, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>✓ ACTIVE</span>}
                    </span>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: isActive ? 'var(--green)' : isTesting ? 'var(--blue)' : 'var(--text-muted)' }}>
                      {v.mass} kg{parseFloat(saving) > 0 ? ` (-${saving}%)` : ''}
                    </span>
                  </div>
                  <div style={{ height: 7, borderRadius: 3, background: 'rgba(255,255,255,0.04)', overflow: 'hidden' }}>
                    <div style={{ width: '100%', height: '100%', background: barColor, borderRadius: 3, transform: `scaleX(${pct / 100})`, transformOrigin: 'left center', transition: 'transform 0.5s var(--ease-ui)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}

/* ══ Main Page ════════════════════════════════════════════════════════════ */

export function PartDesignPage() {
  const { toast } = useToast();
  const [parts, setParts] = useState<ComponentPart[]>(INITIAL_PARTS);
  const [scheduledServices, setScheduledServices] = useState<Set<string>>(new Set());
  const [previewPartName, setPreviewPartName] = useState<string>('Carbon Front Rim');
  const { savedParts, loading: cloudLoading, refresh: cloudRefresh, remove: cloudRemove } = usePartStorage();

  const critParts = useMemo(() => parts.filter(p => p.status === 'crit' && !scheduledServices.has(p.name)).length, [parts, scheduledServices]);
  const warnParts = useMemo(() => parts.filter(p => p.status === 'warn' && !scheduledServices.has(p.name)).length, [parts, scheduledServices]);
  const totalMass = useMemo(() => parts.reduce((a, p) => a + p.mass, 0), [parts]);

  const massSavingKg = useMemo(() => {
    return DESIGN_VARIANTS.filter(v => v.status === 'Active').reduce((acc, v) => {
      const baseline = DESIGN_VARIANTS.find(b => b.part === v.part && b.status === 'Archive' && b.variant.includes('Baseline'));
      return acc + (baseline ? baseline.mass - v.mass : 0);
    }, 0);
  }, []);

  function addGeneratedPart(name: string, material: string, mass: number, stress: number) {
    const maxKm = material === 'carbon' ? 8000 : material === 'titanium' ? 15000 : 5000;
    setParts(prev => [...prev, {
      name, component: `AI-Gen · ${material.charAt(0).toUpperCase() + material.slice(1)}`,
      system: 'Chassis' as const, km: 0, maxKm, status: 'ok' as const, mass, fea: stress,
      note: `Generated by AI Part Generator · σ ${stress} MPa`,
    }]);
  }

  function scheduleService(part: ComponentPart) {
    setScheduledServices(prev => { const n = new Set(prev); n.add(part.name); return n; });
    setParts(prev => prev.map(p =>
      p.name === part.name && p.status === 'crit'
        ? { ...p, status: 'warn' as const, note: `Service scheduled · ${new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}` }
        : p
    ));
    toast({ type: 'success', title: `Service scheduled: ${part.name}`, message: `${part.component} — replacement before next session confirmed.` });
  }

  function getDisplayStatus(part: ComponentPart): string {
    return scheduledServices.has(part.name) ? 'scheduled' : part.status;
  }

  return (
    <div className="page">

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* HEADER */}
      {/* ════════════════════════════════════════════════════════════════ */}

      <div className="card" style={{ marginBottom: 16, padding: '16px 20px' }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 8 }}>
          <div>
            <h1 className="page-title" style={{ fontSize: 20, letterSpacing: '-0.02em' }}>GARAGE PART FACTORY</h1>
            <p className="page-subtitle" style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              AI-generated parts · FEA validation · Print-ready workflow · Trackside manufacturing
            </p>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {critParts > 0 && <span className="badge badge-red">{critParts} Critical</span>}
            {warnParts > 0 && <span className="badge badge-yellow">{warnParts} Warning</span>}
            <span className="badge badge-green">READY</span>
          </div>
        </div>

        {/* Session context */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center',
          padding: '8px 12px', borderRadius: 'var(--radius)',
          border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)',
          fontSize: 11, fontFamily: 'var(--font-mono)',
        }}>
          <span><span style={{ color: 'var(--text-muted)' }}>Circuit</span> <strong>Mugello</strong></span>
          <span style={{ width: 1, height: 14, background: 'var(--border)' }} />
          <span><span style={{ color: 'var(--text-muted)' }}>Session</span> <strong>Stint 03</strong></span>
          <span style={{ width: 1, height: 14, background: 'var(--border)' }} />
          <span><span style={{ color: 'var(--text-muted)' }}>Bike</span> <strong>Yamaha R1 · #47</strong></span>
          <span style={{ width: 1, height: 14, background: 'var(--border)' }} />
          <span><span style={{ color: 'var(--text-muted)' }}>Track</span> <strong style={{ color: 'var(--yellow)' }}>Dry</strong> · <strong>48°C</strong></span>
          <span style={{ marginLeft: 'auto' }}>
            <span style={{ color: 'var(--text-muted)' }}>Workflow</span>{' '}
            <strong style={{ color: 'var(--green)' }}>Design Agent → CAD Generator → FEA Validator → Digital Twin → Print Queue → QC Check → Install Log</strong>
          </span>
        </div>

        {/* Workflow pipeline */}
        <div style={{ marginTop: 10 }}>
          <WorkflowPipeline steps={WORKFLOW} />
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* PART REQUEST + ELIGIBILITY + GENERATOR */}
      {/* ════════════════════════════════════════════════════════════════ */}

      {/* Print Eligibility Gate */}
      <EligibilityGate />

      {/* Part Generator — existing component */}
      <PartGeneratorPanel onAddPart={addGeneratedPart} />

      {/* ══ Installation Class reference ═══════════════════════════════ */}
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="card-header" style={{ marginBottom: 8 }}>
          <span className="card-title flex items-center gap-2"><Shield size={14} style={{ color: 'var(--accent)' }} /> PART INSTALLATION CLASS</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
          {INSTALL_CLASSES.map(ic => (
            <div key={ic.class} style={{
              padding: '8px 10px', borderRadius: 'var(--radius)',
              border: `1px solid ${ic.color}40`,
              background: `${ic.color}08`,
            }}>
              <div style={{ fontSize: 16, fontWeight: 800, color: ic.color, fontFamily: 'var(--font-mono)', marginBottom: 2 }}>
                Class {ic.class}
              </div>
              <div style={{ fontSize: 10, fontWeight: 600, color: ic.color, marginBottom: 3 }}>{ic.label}</div>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', lineHeight: 1.4 }}>{ic.description}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* 3D PRE-FABRICATION PREVIEW + FEA + DIGITAL TWIN */}
      {/* ════════════════════════════════════════════════════════════════ */}

      {/* 3D Preview */}
      {(() => {
        const cad = CAD_MODELS.find(m => m.name === previewPartName);
        const preview = parts.find(p => p.name === previewPartName);
        const name = cad?.name ?? preview?.name ?? parts[0]?.name ?? 'Part';
        const stressLevel = cad ? cad.stress : Math.min(1, ((preview?.fea ?? 90)) / FEA_YIELD_REF);
        const color = cad ? cad.color : partMaterialColor(preview?.component ?? '');
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
                <optgroup label="CAD parts (STL)">
                  {CAD_MODELS.map(m => <option key={m.name} value={m.name}>{m.name}</option>)}
                </optgroup>
                <optgroup label="Components">
                  {parts.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
                </optgroup>
              </select>
            </div>
            <PartViewer3D
              partName={name}
              materialColor={color}
              stressLevel={stressLevel}
              toleranceMm={0.05}
              meshUrl={cad?.url}
              height={300}
            />
          </div>
        );
      })()}

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* FEA + DIGITAL TWIN — side by side */}
      {/* ════════════════════════════════════════════════════════════════ */}

      <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>

        {/* FEA Validation */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: 8 }}>
            <span className="card-title flex items-center gap-2"><BarChart2 size={14} style={{ color: 'var(--green)' }} /> FEA VALIDATION</span>
            <span className="badge badge-green">PASS</span>
          </div>
          <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 6 }}>LOAD CASES</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginBottom: 10, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
            {['LC1 · Downforce 50 kg equivalent', 'LC2 · Vibration 25–80 Hz', 'LC3 · Kerb impact 3g', 'LC4 · Thermal expansion 80°C', 'LC5 · Bolt preload M6'].map(lc => (
              <div key={lc} style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.02)', borderRadius: 4, color: 'var(--text-dim)' }}>
                {lc}
              </div>
            ))}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 8 }}>
            {[
              { label: 'Peak stress', value: '82 MPa', color: 'var(--green)' },
              { label: 'Yield', value: '503 MPa', color: 'var(--text)' },
              { label: 'Safety factor', value: '6.13', color: 'var(--green)' },
              { label: 'Max displacement', value: '0.42 mm', color: 'var(--text-dim)' },
              { label: 'Fatigue risk', value: 'Low', color: 'var(--green)' },
              { label: 'Mounting hole stress', value: 'Acceptable', color: 'var(--text-dim)' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'var(--font-mono)', padding: '2px 4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                <span style={{ color: s.color, fontWeight: 600 }}>{s.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Digital Twin Impact */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: 8 }}>
            <span className="card-title flex items-center gap-2"><Settings size={14} style={{ color: 'var(--blue)' }} /> DIGITAL TWIN IMPACT</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, marginBottom: 8 }}>
            {[
              { label: 'Mass change', value: '+84 g', color: 'var(--yellow)' },
              { label: 'CdA effect', value: '+0.002', color: 'var(--text-dim)' },
              { label: 'Front load', value: '+0.8%', color: 'var(--text-dim)' },
              { label: 'Thermal effect', value: 'Neutral', color: 'var(--green)' },
              { label: 'Vibration risk', value: 'Low–Medium', color: 'var(--yellow)' },
              { label: 'Lap-time impact', value: '±0.006s', color: 'var(--text-dim)' },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: 'var(--font-mono)', padding: '2px 4px' }}>
                <span style={{ color: 'var(--text-muted)' }}>{s.label}</span>
                <span style={{ color: s.color, fontWeight: 600 }}>{s.value}</span>
              </div>
            ))}
          </div>
          <div style={{ padding: '6px 8px', background: 'color-mix(in srgb, var(--blue) 6%, transparent)', borderRadius: 4, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
            <span style={{ color: 'var(--blue)' }}>⚠ Recommendation:</span> Safe for practice validation. Winglet balance check recommended.
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* PRINT QUEUE + SESSION URGENCY */}
      {/* ════════════════════════════════════════════════════════════════ */}

      <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>

        {/* Print Queue */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: 8 }}>
            <span className="card-title flex items-center gap-2"><Printer size={14} style={{ color: 'var(--accent)' }} /> PRINT QUEUE · GARAGE</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {PRINTERS.map(p => (
              <div key={p.printer} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-mono)',
                background: 'rgba(255,255,255,0.02)',
                border: `1px solid ${p.status === 'printing' ? 'color-mix(in srgb, var(--blue) 30%, transparent)' : 'rgba(255,255,255,0.06)'}`,
              }}>
                <div>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>{p.printer}</div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{p.technology}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {p.status === 'printing' && <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--blue)', animation: 'pulse 1.5s infinite' }} />}
                  <span style={{
                    color: p.status === 'printing' ? 'var(--blue)'
                      : p.status === 'idle' ? 'var(--green)'
                      : 'var(--text-muted)',
                  }}>
                    {p.status === 'printing' ? 'Printing'
                      : p.status === 'idle' ? (p.compatible ? 'Ready' : 'Idle')
                      : 'External'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Print Job detail */}
          <div style={{
            marginTop: 8, padding: '8px 10px', borderRadius: 'var(--radius)',
            border: '1px solid var(--border)', background: 'rgba(255,255,255,0.02)',
            fontSize: 11, fontFamily: 'var(--font-mono)',
          }}>
            <div style={{ fontWeight: 600, color: 'var(--accent)', marginBottom: 4 }}>PRINT JOB · MUG-Q3-017</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2px 12px', fontSize: 10, color: 'var(--text-dim)' }}>
              <span>Part: <strong style={{ color: 'var(--text)' }}>Aero winglet bracket</strong></span>
              <span>Material: <strong style={{ color: 'var(--cyan)' }}>Nylon-CF</strong></span>
              <span>Print time: <strong>42 min</strong></span>
              <span>Post-process: <strong>8 min</strong></span>
              <span>QC time: <strong>5 min</strong></span>
              <span>Total: <strong style={{ color: 'var(--green)' }}>55 min</strong></span>
            </div>
          </div>
        </div>

        {/* Session Urgency */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: 8 }}>
            <span className="card-title flex items-center gap-2"><Clock size={14} style={{ color: 'var(--yellow)' }} /> SESSION URGENCY</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { label: 'Needed by', value: 'Stint 04', color: 'var(--text)' },
              { label: 'Time available', value: '67 min', color: 'var(--text)' },
              { label: 'Estimated ready', value: '55 min', color: 'var(--green)' },
              { label: 'Status', value: 'On time', color: 'var(--green)' },
            ].map(s => (
              <div key={s.label} className="stat-tile">
                <div className="stat-tile__label">{s.label}</div>
                <span className="stat-tile__value" style={{ color: s.color, fontSize: 16 }}>{s.value}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Risk</span>
            <span style={{ color: 'var(--yellow)', fontWeight: 600 }}>Medium</span>
          </div>
          <div style={{ marginTop: 4, fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
            Install window: <strong style={{ color: 'var(--green)' }}>Before Stint 04</strong>
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ENGINEER APPROVAL + QC CHECKLIST */}
      {/* ════════════════════════════════════════════════════════════════ */}

      <div className="grid-2" style={{ gap: 16, marginBottom: 16 }}>

        {/* Engineer Approval */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: 8 }}>
            <span className="card-title flex items-center gap-2"><Shield size={14} style={{ color: 'var(--blue)' }} /> ENGINEERING APPROVAL</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {[
              { step: 'Design AI', status: 'Passed', color: 'var(--green)' },
              { step: 'FEA Validator', status: 'Passed', color: 'var(--green)' },
              { step: 'Manufacturing Engineer', status: 'Pending', color: 'var(--yellow)' },
              { step: 'Race Engineer', status: 'Pending', color: 'var(--yellow)' },
              { step: 'Technical Compliance', status: 'Required for race use', color: 'var(--text-muted)' },
              { step: 'Install approval', status: 'Blocked until QC passed', color: 'var(--accent)' },
            ].map(s => (
              <div key={s.step} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '4px 8px', borderRadius: 4, fontSize: 11, fontFamily: 'var(--font-mono)',
                background: 'rgba(255,255,255,0.02)',
              }}>
                <span style={{ color: 'var(--text-dim)' }}>{s.step}</span>
                <span style={{ color: s.color, fontWeight: 600 }}>{s.status}</span>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
            {['Approve for print', 'Approve for fit check only', 'Reject', 'Request redesign'].map(btn => (
              <button key={btn} className="btn btn-ghost btn-sm" style={{ fontSize: 10, padding: '4px 8px' }}
                onClick={() => toast({ type: btn === 'Reject' ? 'warning' : 'success', title: btn, message: 'Approval action recorded.' })}
              >
                {btn}
              </button>
            ))}
          </div>
        </div>

        {/* QC Checklist */}
        <div className="card">
          <div className="card-header" style={{ marginBottom: 8 }}>
            <span className="card-title flex items-center gap-2"><CheckSquare size={14} style={{ color: 'var(--green)' }} /> QC CHECKLIST</span>
          </div>
          {[
            { check: 'Dimensional check', value: 'Pending', color: 'var(--text-muted)' },
            { check: 'Mounting hole distance', value: '72.0 mm ±0.05', color: 'var(--text-muted)' },
            { check: 'Mass check', value: '84 g ±2 g', color: 'var(--text-muted)' },
            { check: 'Layer inspection', value: 'Pending', color: 'var(--text-muted)' },
            { check: 'Surface finish', value: 'Pending', color: 'var(--text-muted)' },
            { check: 'Insert fit', value: 'Pending', color: 'var(--text-muted)' },
            { check: 'Bolt torque test', value: 'Pending', color: 'var(--text-muted)' },
          ].map(qc => (
            <div key={qc.check} style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '3px 8px', borderRadius: 4, fontSize: 10, fontFamily: 'var(--font-mono)',
              background: 'rgba(255,255,255,0.02)', marginBottom: 2,
            }}>
              <span style={{ color: 'var(--text-dim)' }}>{qc.check}</span>
              <span style={{ color: qc.color, fontWeight: 600 }}>{qc.value}</span>
            </div>
          ))}
          <div style={{ marginTop: 6, padding: '4px 8px', background: 'rgba(34,197,94,0.06)', borderRadius: 4, fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>
            Final status: Waiting for printed part
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* INSTALL LOG */}
      {/* ════════════════════════════════════════════════════════════════ */}

      <div className="card mb-4">
        <div className="card-header" style={{ marginBottom: 6 }}>
          <span className="card-title flex items-center gap-2"><FileText size={14} style={{ color: 'var(--accent)' }} /> INSTALL LOG</span>
        </div>
        <div style={{ display: 'flex', gap: 12, fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>
          <span>Bike: <strong style={{ color: 'var(--text)' }}>Yamaha R1 · #47</strong></span>
          <span style={{ width: 1, height: 14, background: 'var(--border)' }} />
          <span>Target: <strong style={{ color: 'var(--text)' }}>Front fairing · left side</strong></span>
          <span style={{ width: 1, height: 14, background: 'var(--border)' }} />
          <span>Torque: <strong style={{ color: 'var(--yellow)' }}>M6 · 8 Nm</strong></span>
          <span style={{ width: 1, height: 14, background: 'var(--border)' }} />
          <span>Status: <strong style={{ color: 'var(--accent)' }}>Not installed</strong></span>
        </div>
        <div style={{ marginTop: 6, fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          Inspection after use: <strong style={{ color: 'var(--yellow)' }}>Mandatory after first stint</strong>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* COMPONENT HEALTH + MASS BUDGET */}
      {/* ════════════════════════════════════════════════════════════════ */}

      <div className="grid-2 mb-4">
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><Layers size={13} /> COMPONENT HEALTH OVERVIEW</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>% life used</span>
          </div>
          <div className="card-body">
            <LifecycleHeatmap parts={parts} scheduled={scheduledServices} />
            <div style={{ display: 'flex', gap: 16, marginTop: 12, flexWrap: 'wrap' }}>
              {[
                { label: '> 90%',  color: 'var(--accent)', desc: 'Critical' },
                { label: '70-90%', color: 'var(--yellow)', desc: 'Warning'  },
                { label: '40-70%', color: 'var(--blue)', desc: 'Monitor'  },
                { label: '< 40%',  color: 'var(--green)', desc: 'Nominal'  },
              ].map(l => (
                <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: 'var(--text-muted)' }}>
                  <span style={{ width: 8, height: 8, borderRadius: 2, background: l.color, display: 'inline-block' }} />
                  {l.label} {l.desc}
                </span>
              ))}
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><BarChart2 size={13} /> MASS BUDGET · MONITORED COMPONENTS</span>
            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
              {totalMass.toFixed(1)} kg total
            </span>
          </div>
          <div className="card-body">
            <SystemMassChart parts={parts} />
          </div>
        </div>
      </div>

      {/* Component Lifecycle table */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title flex items-center gap-2"><Wrench size={14} /> COMPONENT LIFECYCLE</span>
          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{parts.length} components monitored</span>
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
              const lifePct = Math.round((p.km / p.maxKm) * 100);
              const displayStatus = getDisplayStatus(p);
              const isScheduled = scheduledServices.has(p.name);
              return (
                <tr key={p.name} style={
                  p.status === 'crit' && !isScheduled ? { background: 'rgba(224,55,55,0.06)' }
                    : isScheduled ? { background: 'rgba(59,130,246,0.06)' } : {}
                }>
                  <td><StatusIcon status={displayStatus} /></td>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td>
                    <span style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: SYSTEM_COLORS[p.system] ?? 'var(--text-muted)', fontWeight: 600 }}>
                      {p.system}
                    </span>
                  </td>
                  <td style={{ fontSize: 12, color: 'var(--text-dim)' }}>{p.component}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{p.km.toLocaleString()}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{ width: 52, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                        <div style={{
                          width: `${lifePct}%`, height: '100%',
                          background: isScheduled ? 'var(--blue)' : lifePct > 85 ? 'var(--accent)' : lifePct > 65 ? 'var(--yellow)' : 'var(--green)',
                          borderRadius: 2,
                        }} />
                      </div>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>{lifePct}%</span>
                    </div>
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{p.mass}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{p.fea ?? '—'}</td>
                  <td style={{ fontSize: 12, color: isScheduled ? 'var(--blue)' : p.status === 'crit' ? 'var(--accent)' : p.status === 'warn' ? 'var(--yellow)' : 'var(--text-muted)' }}>
                    {p.note}
                  </td>
                  <td>
                    {(p.status === 'crit' || p.status === 'warn') && !isScheduled ? (
                      <button className="btn btn-ghost btn-sm flex items-center gap-1" style={{ fontSize: 11, padding: '4px 8px', color: p.status === 'crit' ? 'var(--accent)' : 'var(--yellow)', borderColor: p.status === 'crit' ? 'rgba(224,55,55,0.3)' : 'rgba(245,158,11,0.3)' }}
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

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* SIMP + FEA + MATERIAL SELECTION */}
      {/* ════════════════════════════════════════════════════════════════ */}

      <div className="grid-2 mb-4">
        <div className="card">
          <div className="card-header">
            <span className="card-title">SIMP MASS EVOLUTION</span>
            <span className="badge badge-green">-{massSavingKg.toFixed(2)} kg total</span>
          </div>
          <div className="card-body">
            <MassEvolutionChart variants={DESIGN_VARIANTS} />
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <span className="card-title">FEA STRESS ANALYSIS</span>
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>Von Mises · Safety factor</span>
          </div>
          <div className="card-body">
            <FEAStressPanel variants={DESIGN_VARIANTS} />
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* MATERIAL SELECTION MATRIX */}
      {/* ════════════════════════════════════════════════════════════════ */}

      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">MATERIAL SELECTION</span>
          <span className="badge badge-muted">Trackside manufacturing reference</span>
        </div>
        <table className="data-table">
          <thead>
            <tr><th>Material</th><th>Process</th><th>Trackside?</th><th>Use case</th></tr>
          </thead>
          <tbody>
            {MATERIALS.map(m => (
              <tr key={m.name}>
                <td><span style={{ fontWeight: 700, color: m.color, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{m.name}</span></td>
                <td style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-dim)' }}>{m.process}</td>
                <td><span style={{ color: m.trackside === 'Yes' ? 'var(--green)' : m.trackside === 'Conditional' ? 'var(--yellow)' : 'var(--text-muted)', fontWeight: 600 }}>{m.trackside}</span></td>
                <td style={{ fontSize: 11, color: 'var(--text-dim)' }}>{m.use}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* ENGINEERING MATERIAL PROPERTIES */}
      {/* ════════════════════════════════════════════════════════════════ */}

      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">MATERIAL PROPERTIES MATRIX</span>
          <span className="badge badge-muted">Engineering reference</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Material</th><th>ρ (g/cm—th><th>σ  yield (MPa)</th><th>UTS (MPa)</th>
              <th>E (GPa)</th><th>Fatigue (MPa)</th><th>T max (°C)</th><th>Applications</th>
            </tr>
          </thead>
          <tbody>
            {ENG_MATERIAL_PROPS.map(m => (
              <tr key={m.mat}>
                <td><span style={{ fontWeight: 700, color: m.color, fontFamily: 'var(--font-mono)', fontSize: 12 }}>{m.mat}</span></td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{m.density}</td>
                <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--green)' }}>{m.yieldMPa}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{m.utsMPa}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{m.eMPa}</td>
                <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--yellow)' }}>{m.fatigueMPa}</td>
                <td style={{ fontFamily: 'var(--font-mono)' }}>{m.tempMax}°</td>
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

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* DESIGN VARIANTS */}
      {/* ════════════════════════════════════════════════════════════════ */}

      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">SIMP OPTIMIZATION LIBRARY</span>
          <span className="badge badge-muted">Reduce mass while maintaining safety factor</span>
        </div>
        <div style={{ display: 'flex', gap: 12, marginBottom: 10, fontSize: 11, fontFamily: 'var(--font-mono)', flexWrap: 'wrap' }}>
          <span><span style={{ color: 'var(--text-muted)' }}>Active variants:</span> {DESIGN_VARIANTS.filter(v => v.status === 'Active').length}</span>
          <span style={{ width: 1, height: 14, background: 'var(--border)' }} />
          <span><span style={{ color: 'var(--text-muted)' }}>Race install:</span> <strong style={{ color: 'var(--green)' }}>Approved / homologated only</strong></span>
          <span style={{ width: 1, height: 14, background: 'var(--border)' }} />
          <span><span style={{ color: 'var(--text-muted)' }}>Trackside print:</span> <strong style={{ color: 'var(--accent)' }}>Not printable trackside</strong></span>
          <span style={{ width: 1, height: 14, background: 'var(--border)' }} />
          <span><span style={{ color: 'var(--text-muted)' }}>Mass saving:</span> <strong style={{ color: 'var(--green)' }}>-{massSavingKg.toFixed(2)} kg vs baseline</strong></span>
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
              const sf = (v.yieldMPa / v.stress).toFixed(2);
              const sfNum = parseFloat(sf);
              return (
                <tr key={i} style={v.status === 'Active' ? { background: 'rgba(34,197,94,0.06)' } : {}}>
                  <td style={{ fontWeight: 600 }}>{v.part}</td>
                  <td>{v.variant}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{v.mass}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: v.stress > 140 ? 'var(--yellow)' : 'var(--text)' }}>{v.stress} MPa</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>{v.yieldMPa} MPa</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: sfNum >= 2.5 ? 'var(--green)' : sfNum >= 2.0 ? 'var(--yellow)' : 'var(--accent)', fontWeight: 700 }}>{sf}</td>
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

      {/* ════════════════════════════════════════════════════════════════ */}
      {/* PART REGISTRY (ex Cloud Inventory) */}
      {/* ════════════════════════════════════════════════════════════════ */}

      <div className="card">
        <div className="card-header">
          <div className="flex items-center gap-2">
            <Cloud size={14} style={{ color: 'var(--cyan)' }} />
            <span className="card-title">PART REGISTRY</span>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              InsForge · PostgreSQL + Object Storage · CAD/FEA/QC traceability
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
              {savedParts.length} part{savedParts.length !== 1 ? 's' : ''}
            </span>
            <button onClick={() => cloudRefresh()} style={{
              display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px',
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 5, cursor: 'pointer', color: 'var(--text-muted)',
              fontSize: 11, fontFamily: 'var(--font-mono)',
            }}>
              <RefreshCw size={11} style={{ animation: cloudLoading ? 'spin 1s linear infinite' : 'none' }} />
              Sync
            </button>
          </div>
        </div>

        {cloudLoading && savedParts.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
            <Wrench size={14} style={{ marginRight: 6, opacity: 0.4 }} /> Syncing with InsForge...
          </div>
        ) : savedParts.length === 0 ? (
          <div style={{ padding: '24px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, fontFamily: 'var(--font-mono)' }}>
            <CloudOff size={14} style={{ marginRight: 6, opacity: 0.4 }} />
            No AI-generated parts saved yet. Use the generator above and click "Save to InsForge".
          </div>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Part ID</th><th>Material</th><th>Dimensions</th>
                <th>Mass</th><th>Peak σ </th><th>SF</th>
                <th>Drag Cd</th><th>Prompt</th><th>Saved</th><th>Sync</th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {savedParts.map(p => (
                <tr key={p.part_id}>
                  <td style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    {p.part_id.slice(-10)}
                  </td>
                  <td>
                    <span style={{ fontSize: 11, fontWeight: 700, color: MAT_COLOR[p.material] ?? 'var(--text)', fontFamily: 'var(--font-mono)' }}>
                      {p.material.charAt(0).toUpperCase() + p.material.slice(1)}
                    </span>
                  </td>
                  <td style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>{p.dim_x}—{p.dim_y}—{p.dim_z}mm</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: MAT_COLOR[p.material] }}>{p.mass_kg} kg</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: p.peak_stress > 250 ? 'var(--yellow)' : 'var(--text)' }}>{p.peak_stress} MPa</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: p.safety_factor >= 2.0 ? 'var(--green)' : 'var(--yellow)', fontWeight: 700 }}>
                    {p.safety_factor.toFixed(2)}
                  </td>
                  <td style={{ fontSize: 11, fontFamily: 'var(--font-mono)' }}>{p.drag_coeff}</td>
                  <td style={{ fontSize: 11, color: 'var(--text-muted)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.prompt || '—'}
                  </td>
                  <td style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                    {p.created_at ? new Date(p.created_at).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'}
                  </td>
                  <td>
                    {p.synced_to_cloud
                      ? <span style={{ fontSize: 10, color: 'var(--green)', fontFamily: 'var(--font-mono)' }}>☁ Cloud</span>
                      : <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>⌂ Local</span>
                    }
                  </td>
                  <td>
                    <button onClick={() => { cloudRemove(p.part_id); toast({ type: 'info', title: 'Removed from local list', message: p.name }); }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
                      <Trash2 size={12} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ══ Apply to garage button ═══════════════════════════════════════ */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 16 }}>
        <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
          onClick={() => {
            toast({ type: 'success', title: 'Part workflow staged', message: 'Part sent to print queue. Engineer approval is pending.' });
          }}
        >
          <Printer size={14} /> Send to print queue <ChevronRight size={14} />
        </button>
      </div>

    </div>
  );
}
