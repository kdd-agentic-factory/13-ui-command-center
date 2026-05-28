import { CheckCircle, AlertTriangle, XCircle, Wrench } from 'lucide-react';

const PARTS = [
  { name: 'Front Fork Assembly',     component: 'Öhlins TTX25',     km: 1240, maxKm: 2000, status: 'ok',    mass: 4.2,  fea: null,       note: '62% life remaining' },
  { name: 'Rear Shock',              component: 'Öhlins TTX36',     km: 1240, maxKm: 1800, status: 'warn',  mass: 2.8,  fea: null,       note: 'Schedule service next round' },
  { name: 'Carbon Front Rim',        component: 'Marchesini Ultra', km: 580,  maxKm: 3000, status: 'ok',    mass: 1.4,  fea: 107,        note: 'SIMP-optimized · –18% mass' },
  { name: 'Carbon Rear Rim',         component: 'Marchesini Ultra', km: 580,  maxKm: 3000, status: 'ok',    mass: 2.1,  fea: 142,        note: 'SIMP-optimized · –15% mass' },
  { name: 'Brake Discs (Front)',     component: 'Brembo GP-Style',  km: 980,  maxKm: 1200, status: 'warn',  mass: 0.9,  fea: null,       note: 'High wear — monitor' },
  { name: 'Brake Pads (Front)',      component: 'Brembo RC19',      km: 980,  maxKm: 1000, status: 'crit',  mass: 0.15, fea: null,       note: 'Replace before next session' },
  { name: 'Swingarm',                component: 'Alu-Ti Hybrid',    km: 8400, maxKm: 20000,status: 'ok',    mass: 3.8,  fea: 89,         note: 'Topology optimized · -22% mass' },
  { name: 'Front Upper Fairing',     component: 'Carbon Prototype', km: 2100, maxKm: 10000,status: 'ok',    mass: 1.2,  fea: 62,         note: 'Aero variant B3 active' },
  { name: 'Engine #4',               component: 'Prototype V4',     km: 2580, maxKm: 3500, status: 'ok',    mass: 62.0, fea: null,       note: 'Within rev limit · Map 6' },
];

const DESIGN_VARIANTS = [
  { part: 'Carbon Front Rim', variant: 'V3 Baseline',  mass: 1.68, stress: 118, status: 'Archive' },
  { part: 'Carbon Front Rim', variant: 'V4 SIMP-INT4', mass: 1.40, stress: 107, status: 'Active' },
  { part: 'Carbon Front Rim', variant: 'V5 Prototype', mass: 1.31, stress: 122, status: 'Testing' },
  { part: 'Swingarm',         variant: 'Al Baseline',  mass: 4.90, stress: 145, status: 'Archive' },
  { part: 'Swingarm',         variant: 'Al-Ti V2',     mass: 4.20, stress: 132, status: 'Archive' },
  { part: 'Swingarm',         variant: 'Al-Ti V3+SIMP',mass: 3.80, stress: 89,  status: 'Active' },
];

function StatusIcon({ status }: { status: string }) {
  if (status === 'ok')   return <CheckCircle   size={16} style={{ color: 'var(--green)' }} />;
  if (status === 'warn') return <AlertTriangle size={16} style={{ color: 'var(--yellow)' }} />;
  return <XCircle size={16} style={{ color: 'var(--accent)' }} />;
}

export function PartDesignPage() {
  const critParts  = PARTS.filter(p => p.status === 'crit').length;
  const warnParts  = PARTS.filter(p => p.status === 'warn').length;
  const okParts    = PARTS.filter(p => p.status === 'ok').length;
  const totalMass  = PARTS.reduce((a, p) => a + p.mass, 0).toFixed(1);

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Part Design</h1>
          <p className="page-subtitle">Component lifecycle · FEA results · SIMP optimization · Design variants</p>
        </div>
        <div className="flex items-center gap-2">
          {critParts > 0 && <span className="badge badge-red">{critParts} Critical</span>}
          {warnParts > 0 && <span className="badge badge-yellow">{warnParts} Warning</span>}
          <span className="badge badge-green">{okParts} Nominal</span>
        </div>
      </div>

      {/* ── Summary tiles ─────────────────────────────────────────────────── */}
      <div className="grid-4 mb-4">
        <div className="stat-tile accent-border">
          <div className="stat-tile__label">Critical Parts</div>
          <div className="stat-tile__value" style={{ color: 'var(--accent)' }}>{critParts}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Requires attention</div>
        </div>
        <div className="stat-tile yellow-border">
          <div className="stat-tile__label">Warning Parts</div>
          <div className="stat-tile__value" style={{ color: 'var(--yellow)' }}>{warnParts}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>Monitor closely</div>
        </div>
        <div className="stat-tile blue-border">
          <div className="stat-tile__label">Monitored Components</div>
          <div className="stat-tile__value">{PARTS.length}</div>
        </div>
        <div className="stat-tile green-border">
          <div className="stat-tile__label">Total Component Mass</div>
          <div className="stat-tile__value text-mono">{totalMass}<span className="stat-tile__unit">kg</span></div>
          <div style={{ fontSize: 12, color: 'var(--green)', marginTop: 4 }}>–4.8 kg vs baseline</div>
        </div>
      </div>

      {/* ── Parts table ───────────────────────────────────────────────────── */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title flex items-center gap-2"><Wrench size={14} />Component Lifecycle</span>
        </div>
        <table className="data-table">
          <thead>
            <tr>
              <th>Status</th>
              <th>Part</th>
              <th>Component</th>
              <th>km Used</th>
              <th>Life %</th>
              <th>Mass (kg)</th>
              <th>FEA MPa</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {PARTS.map(p => {
              const lifePct = Math.round((p.km / p.maxKm) * 100);
              return (
                <tr key={p.name} style={p.status === 'crit' ? { background: 'rgba(224,55,55,0.06)' } : {}}>
                  <td><StatusIcon status={p.status} /></td>
                  <td style={{ fontWeight: 600 }}>{p.name}</td>
                  <td className="text-dim" style={{ fontSize: 12 }}>{p.component}</td>
                  <td className="mono">{p.km.toLocaleString()}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="bar-track" style={{ width: 60 }}>
                        <div
                          className="bar-fill"
                          style={{
                            width: `${lifePct}%`,
                            background: lifePct > 85 ? 'var(--accent)' : lifePct > 65 ? 'var(--yellow)' : 'var(--green)',
                          }}
                        />
                      </div>
                      <span className="mono" style={{ fontSize: 12 }}>{lifePct}%</span>
                    </div>
                  </td>
                  <td className="mono">{p.mass}</td>
                  <td className="mono">{p.fea ?? '—'}</td>
                  <td style={{ fontSize: 12, color: p.status === 'crit' ? 'var(--accent)' : p.status === 'warn' ? 'var(--yellow)' : 'var(--text-dim)' }}>
                    {p.note}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Design variants comparison ───────────────────────────────────── */}
      <div className="card">
        <div className="card-header"><span className="card-title">Design Variant Comparison — SIMP Optimization Results</span></div>
        <table className="data-table">
          <thead>
            <tr><th>Part</th><th>Variant</th><th>Mass (kg)</th><th>Peak Stress (MPa)</th><th>Safety Factor</th><th>Status</th></tr>
          </thead>
          <tbody>
            {DESIGN_VARIANTS.map((v, i) => {
              const sf = (250 / v.stress).toFixed(2);
              return (
                <tr key={i} style={v.status === 'Active' ? { background: 'var(--green-dim)' } : {}}>
                  <td style={{ fontWeight: 600 }}>{v.part}</td>
                  <td>{v.variant}</td>
                  <td className="mono">{v.mass}</td>
                  <td className="mono" style={{ color: v.stress > 140 ? 'var(--yellow)' : 'var(--text)' }}>{v.stress}</td>
                  <td className="mono" style={{ color: parseFloat(sf) > 2 ? 'var(--green)' : 'var(--yellow)' }}>{sf}</td>
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
    </div>
  );
}
