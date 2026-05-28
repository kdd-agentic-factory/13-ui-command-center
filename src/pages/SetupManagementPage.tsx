import { useState } from 'react';
import { Save, RotateCcw } from 'lucide-react';

interface SetupParam {
  group: string;
  name: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  baseline: number;
}

const SETUP_PARAMS: SetupParam[] = [
  // Suspension
  { group: 'Suspension', name: 'Front Spring Preload', value: 12.5, min: 8, max: 18, unit: 'mm', baseline: 11.0 },
  { group: 'Suspension', name: 'Front Compression',   value: 14,   min: 8, max: 20, unit: 'clicks', baseline: 12 },
  { group: 'Suspension', name: 'Front Rebound',        value: 16,   min: 8, max: 22, unit: 'clicks', baseline: 14 },
  { group: 'Suspension', name: 'Rear Preload',         value: 9.5,  min: 6, max: 14, unit: 'mm', baseline: 8.5 },
  { group: 'Suspension', name: 'Rear Compression',     value: 18,   min: 10, max: 25, unit: 'clicks', baseline: 16 },
  { group: 'Suspension', name: 'Rear Rebound',         value: 20,   min: 12, max: 28, unit: 'clicks', baseline: 18 },
  // Aero
  { group: 'Aerodynamics', name: 'Front Downforce',   value: 4,    min: 1, max: 9, unit: 'level', baseline: 3 },
  { group: 'Aerodynamics', name: 'Ride Height Front', value: 110,  min: 90, max: 130, unit: 'mm', baseline: 108 },
  { group: 'Aerodynamics', name: 'Ride Height Rear',  value: 130,  min: 110, max: 150, unit: 'mm', baseline: 128 },
  { group: 'Aerodynamics', name: 'Rake Angle',         value: 1.2,  min: 0, max: 3, unit: '°', baseline: 1.1 },
  // Electronics
  { group: 'Electronics', name: 'Traction Control',   value: 3,    min: 1, max: 9, unit: 'TC', baseline: 4 },
  { group: 'Electronics', name: 'Engine Brake',        value: 4,    min: 1, max: 9, unit: 'EB', baseline: 3 },
  { group: 'Electronics', name: 'Engine Map',          value: 6,    min: 1, max: 9, unit: 'MAP', baseline: 5 },
  { group: 'Electronics', name: 'Wheelie Control',     value: 2,    min: 1, max: 5, unit: 'WC', baseline: 2 },
  // Geometry
  { group: 'Geometry', name: 'Front Camber',           value: -0.4, min: -1.5, max: 0, unit: '°', baseline: -0.3 },
  { group: 'Geometry', name: 'Rear Camber',            value: 0.0,  min: -0.5, max: 0.5, unit: '°', baseline: 0.0 },
  { group: 'Geometry', name: 'Steering Head Angle',    value: 23.5, min: 22, max: 26, unit: '°', baseline: 23.2 },
  { group: 'Geometry', name: 'Front Axle Offset',      value: 28,   min: 20, max: 36, unit: 'mm', baseline: 26 },
];

const SETUP_VARIANTS = [
  { name: 'Current Setup (Q3)', laps: 'L1–present', lapTime: '1:33.412', notes: 'Active' },
  { name: 'Race Baseline',      laps: 'FP3',        lapTime: '1:33.847', notes: 'Reference' },
  { name: 'Soft Front Option',  laps: 'FP2',        lapTime: '1:33.201', notes: 'Warmer conditions' },
  { name: 'High Grip Mugello',  laps: 'FP1',        lapTime: '1:34.102', notes: 'Conservative' },
];

function SetupSlider({ param }: { param: SetupParam }) {
  const [val, setVal] = useState(param.value);
  const pct = ((val - param.min) / (param.max - param.min)) * 100;
  const diff = val - param.baseline;
  const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
  const diffColor = Math.abs(diff) < 0.01 ? 'var(--text-muted)' : 'var(--yellow)';

  return (
    <div className="setup-row">
      <span className="setup-name">{param.name}</span>
      <input
        type="range"
        min={param.min}
        max={param.max}
        step={(param.max - param.min) / 100}
        value={val}
        onChange={e => setVal(parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: 'var(--accent)' }}
      />
      <span className="setup-val text-mono">{val.toFixed(1)}</span>
      <span style={{ fontSize: 11, color: diffColor, minWidth: 40, textAlign: 'right', fontFamily: 'JetBrains Mono,monospace' }}>
        {diffStr}
      </span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 36 }}>{param.unit}</span>
    </div>
  );
}

export function SetupManagementPage() {
  const groups = [...new Set(SETUP_PARAMS.map(p => p.group))];

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Setup Management</h1>
          <p className="page-subtitle">Live parameter control · Baseline comparison · Variant management</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost btn-sm flex items-center gap-2">
            <RotateCcw size={14} />
            Reset to Baseline
          </button>
          <button className="btn btn-primary btn-sm flex items-center gap-2">
            <Save size={14} />
            Save Variant
          </button>
        </div>
      </div>

      <div className="grid-2-1">

        {/* Setup parameters */}
        <div className="flex-col gap-3">
          {groups.map(group => (
            <div className="card" key={group}>
              <div className="card-header">
                <span className="card-title">{group}</span>
                <span className="text-muted" style={{ fontSize: 12 }}>
                  {SETUP_PARAMS.filter(p => p.group === group).length} params
                </span>
              </div>
              <div>
                {SETUP_PARAMS.filter(p => p.group === group).map(p => (
                  <SetupSlider key={p.name} param={p} />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Variants + AI insight */}
        <div className="flex-col gap-3">

          <div className="card">
            <div className="card-header"><span className="card-title">Setup Variants</span></div>
            <table className="data-table">
              <thead>
                <tr><th>Name</th><th>Session</th><th>Lap Time</th></tr>
              </thead>
              <tbody>
                {SETUP_VARIANTS.map(v => (
                  <tr
                    key={v.name}
                    style={v.notes === 'Active' ? { background: 'var(--accent-dim)' } : {}}
                    className="setup-variant-row"
                  >
                    <td>
                      <div style={{ fontWeight: v.notes === 'Active' ? 700 : 400 }}>{v.name}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{v.notes}</div>
                    </td>
                    <td className="mono text-dim">{v.laps}</td>
                    <td className="mono" style={{ color: v.notes === 'Active' ? 'var(--accent)' : 'var(--text)' }}>{v.lapTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="card">
            <div className="card-header">
              <span className="card-title" style={{ color: 'var(--accent)' }}>AI Setup Insight</span>
              <span className="badge badge-blue">KDD Agent</span>
            </div>
            <div className="card-body flex-col gap-3" style={{ gap: 12 }}>
              {[
                {
                  title: 'Rear Grip Issue Detected',
                  color: 'var(--yellow)',
                  text: 'Traction control firing 23% more than baseline in T9–T11. Consider +2 clicks rear compression to improve corner exit stability.',
                },
                {
                  title: 'Front Entry Understeer',
                  color: 'var(--blue)',
                  text: 'Sector 2 lap delta of +0.17s concentrated in braking. Softening front compression by 2 clicks may improve initial turn-in.',
                },
                {
                  title: 'Recommended: Engine Map 7',
                  color: 'var(--green)',
                  text: 'Digital twin predicts +0.08s/lap with Map 7 in current fuel load range (8–12 kg). Lower fuel consumption rate.',
                },
              ].map(insight => (
                <div key={insight.title} className="insight-panel" style={{ ['--dot-color' as string]: insight.color }}>
                  <div className="insight-panel__title" style={{ color: insight.color }}>{insight.title}</div>
                  <p className="insight-panel__body">{insight.text}</p>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
