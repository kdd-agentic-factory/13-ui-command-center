import { useState, useCallback } from 'react';
import { Save, RotateCcw, CheckCircle } from 'lucide-react';
import { useToast } from '../components/ToastProvider';

// ── Setup parameter definitions ────────────────────────────────────────────────

interface SetupParam {
  group: string;
  name: string;
  defaultValue: number;
  min: number;
  max: number;
  unit: string;
  baseline: number;
}

const SETUP_PARAMS: SetupParam[] = [
  // Suspension
  { group: 'Suspension', name: 'Front Spring Preload', defaultValue: 12.5, min: 8,   max: 18,  unit: 'mm',    baseline: 11.0 },
  { group: 'Suspension', name: 'Front Compression',    defaultValue: 14,   min: 8,   max: 20,  unit: 'clicks', baseline: 12 },
  { group: 'Suspension', name: 'Front Rebound',         defaultValue: 16,   min: 8,   max: 22,  unit: 'clicks', baseline: 14 },
  { group: 'Suspension', name: 'Rear Preload',          defaultValue: 9.5,  min: 6,   max: 14,  unit: 'mm',    baseline: 8.5 },
  { group: 'Suspension', name: 'Rear Compression',      defaultValue: 18,   min: 10,  max: 25,  unit: 'clicks', baseline: 16 },
  { group: 'Suspension', name: 'Rear Rebound',          defaultValue: 20,   min: 12,  max: 28,  unit: 'clicks', baseline: 18 },
  // Aero
  { group: 'Aerodynamics', name: 'Front Downforce',   defaultValue: 4,    min: 1,   max: 9,   unit: 'level', baseline: 3 },
  { group: 'Aerodynamics', name: 'Ride Height Front', defaultValue: 110,  min: 90,  max: 130, unit: 'mm',    baseline: 108 },
  { group: 'Aerodynamics', name: 'Ride Height Rear',  defaultValue: 130,  min: 110, max: 150, unit: 'mm',    baseline: 128 },
  { group: 'Aerodynamics', name: 'Rake Angle',         defaultValue: 1.2,  min: 0,   max: 3,   unit: '°',     baseline: 1.1 },
  // Electronics
  { group: 'Electronics', name: 'Traction Control',   defaultValue: 3,    min: 1,   max: 9,   unit: 'TC',    baseline: 4 },
  { group: 'Electronics', name: 'Engine Brake',        defaultValue: 4,    min: 1,   max: 9,   unit: 'EB',    baseline: 3 },
  { group: 'Electronics', name: 'Engine Map',          defaultValue: 6,    min: 1,   max: 9,   unit: 'MAP',   baseline: 5 },
  { group: 'Electronics', name: 'Wheelie Control',     defaultValue: 2,    min: 1,   max: 5,   unit: 'WC',    baseline: 2 },
  // Geometry
  { group: 'Geometry', name: 'Front Camber',           defaultValue: -0.4, min: -1.5, max: 0,  unit: '°',     baseline: -0.3 },
  { group: 'Geometry', name: 'Rear Camber',            defaultValue: 0.0,  min: -0.5, max: 0.5, unit: '°',    baseline: 0.0 },
  { group: 'Geometry', name: 'Steering Head Angle',    defaultValue: 23.5, min: 22,  max: 26,  unit: '°',     baseline: 23.2 },
  { group: 'Geometry', name: 'Front Axle Offset',      defaultValue: 28,   min: 20,  max: 36,  unit: 'mm',    baseline: 26 },
];

// Storage key for localStorage persistence
const STORAGE_KEY = 'kdd-setup-v1';

// ── Helpers ────────────────────────────────────────────────────────────────────

function loadSavedValues(): Record<string, number> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as Record<string, number>;
  } catch { /* ignore */ }
  return Object.fromEntries(SETUP_PARAMS.map(p => [p.name, p.defaultValue]));
}

function baselineValues(): Record<string, number> {
  return Object.fromEntries(SETUP_PARAMS.map(p => [p.name, p.baseline]));
}

// ── Setup Variants ────────────────────────────────────────────────────────────

const SETUP_VARIANTS = [
  { name: 'Current Setup (Q3)', laps: 'L1–present', lapTime: '1:33.412', notes: 'Active' },
  { name: 'Race Baseline',      laps: 'FP3',        lapTime: '1:33.847', notes: 'Reference' },
  { name: 'Soft Front Option',  laps: 'FP2',        lapTime: '1:33.201', notes: 'Warmer conditions' },
  { name: 'High Grip Mugello',  laps: 'FP1',        lapTime: '1:34.102', notes: 'Conservative' },
];

// ── SetupSlider ────────────────────────────────────────────────────────────────

interface SliderProps {
  param: SetupParam;
  value: number;
  onChange: (name: string, v: number) => void;
}

function SetupSlider({ param, value, onChange }: SliderProps) {
  const diff = value - param.baseline;
  const diffStr = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
  const hasChange = Math.abs(diff) >= 0.01;

  return (
    <div className="setup-row">
      <span className="setup-name">{param.name}</span>
      <input
        type="range"
        min={param.min}
        max={param.max}
        step={(param.max - param.min) / 100}
        value={value}
        onChange={e => onChange(param.name, parseFloat(e.target.value))}
        style={{ flex: 1, accentColor: 'var(--accent)' }}
      />
      <span className="setup-val text-mono">{value.toFixed(1)}</span>
      <span style={{
        fontSize: 11,
        color: hasChange ? 'var(--yellow)' : 'var(--text-muted)',
        minWidth: 40,
        textAlign: 'right',
        fontFamily: 'JetBrains Mono,monospace',
        transition: 'color 180ms ease',
      }}>
        {diffStr}
      </span>
      <span style={{ fontSize: 11, color: 'var(--text-muted)', minWidth: 36 }}>{param.unit}</span>
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

export function SetupManagementPage() {
  const { toast } = useToast();

  // Lifted state — single source of truth for all slider values
  const [values, setValues] = useState<Record<string, number>>(loadSavedValues);
  const [savedAt, setSavedAt] = useState<string | null>(() => {
    try { return localStorage.getItem(`${STORAGE_KEY}-ts`); }
    catch { return null; }
  });

  const groups = [...new Set(SETUP_PARAMS.map(p => p.group))];

  // Count how many params differ from baseline
  const changedCount = SETUP_PARAMS.filter(p => Math.abs(values[p.name] - p.baseline) >= 0.01).length;

  const handleChange = useCallback((name: string, v: number) => {
    setValues(prev => ({ ...prev, [name]: v }));
  }, []);

  // ── Save ─────────────────────────────────────────────────────────────────
  function handleSave() {
    const ts = new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(values));
      localStorage.setItem(`${STORAGE_KEY}-ts`, ts);
      setSavedAt(ts);
    } catch { /* quota exceeded — still show toast */ }

    toast({
      type: 'success',
      title: 'Setup saved',
      message: `${changedCount > 0 ? changedCount + ' parameter(s) modified from baseline' : 'No changes from baseline'}. Saved at ${ts}.`,
    });
  }

  // ── Reset to baseline ─────────────────────────────────────────────────────
  function handleReset() {
    const base = baselineValues();
    setValues(base);
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(`${STORAGE_KEY}-ts`);
    } catch { /* ignore */ }
    setSavedAt(null);

    toast({
      type: 'info',
      title: 'Reset to baseline',
      message: 'All 18 parameters restored to race baseline values.',
    });
  }

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Setup Management</h1>
          <p className="page-subtitle">Live parameter control · Baseline comparison · Variant management</p>
        </div>
        <div className="flex items-center gap-2">
          {changedCount > 0 && (
            <span className="badge badge-yellow">{changedCount} modified</span>
          )}
          {savedAt && (
            <span style={{ fontSize: 11, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
              saved {savedAt}
            </span>
          )}
          <button
            className="btn btn-ghost btn-sm flex items-center gap-2"
            onClick={handleReset}
          >
            <RotateCcw size={14} />
            Reset to Baseline
          </button>
          <button
            className="btn btn-primary btn-sm flex items-center gap-2"
            onClick={handleSave}
          >
            <Save size={14} />
            {savedAt ? 'Update Saved' : 'Save Variant'}
          </button>
        </div>
      </div>

      <div className="grid-2-1">

        {/* ── Setup parameters ────────────────────────────────────────────── */}
        <div className="flex-col gap-3">
          {groups.map(group => {
            const groupParams = SETUP_PARAMS.filter(p => p.group === group);
            const groupChanged = groupParams.filter(p => Math.abs(values[p.name] - p.baseline) >= 0.01).length;
            return (
              <div className="card" key={group}>
                <div className="card-header">
                  <span className="card-title">{group}</span>
                  <div className="flex items-center gap-2">
                    {groupChanged > 0 && (
                      <span className="badge badge-yellow">{groupChanged} changed</span>
                    )}
                    <span className="text-muted" style={{ fontSize: 12 }}>
                      {groupParams.length} params
                    </span>
                  </div>
                </div>
                <div>
                  {groupParams.map(p => (
                    <SetupSlider
                      key={p.name}
                      param={p}
                      value={values[p.name]}
                      onChange={handleChange}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Variants + AI insight ───────────────────────────────────────── */}
        <div className="flex-col gap-3">

          {/* Changed parameters summary */}
          {changedCount > 0 && (
            <div className="card" style={{ borderColor: 'rgba(245,158,11,0.3)' }}>
              <div className="card-header">
                <span className="card-title" style={{ color: 'var(--yellow)' }}>Unsaved Changes</span>
                <span className="badge badge-yellow">{changedCount}</span>
              </div>
              <div className="card-body flex-col gap-3" style={{ gap: 8, maxHeight: 200, overflowY: 'auto' }}>
                {SETUP_PARAMS
                  .filter(p => Math.abs(values[p.name] - p.baseline) >= 0.01)
                  .map(p => {
                    const diff = values[p.name] - p.baseline;
                    return (
                      <div key={p.name} className="flex items-center justify-between">
                        <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{p.name}</span>
                        <span style={{ fontSize: 12, fontFamily: 'JetBrains Mono,monospace', color: 'var(--yellow)' }}>
                          {values[p.name].toFixed(1)} {p.unit} ({diff > 0 ? '+' : ''}{diff.toFixed(1)})
                        </span>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Saved confirmation */}
          {changedCount === 0 && savedAt && (
            <div className="card" style={{ borderColor: 'rgba(34,197,94,0.3)' }}>
              <div className="card-body" style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <CheckCircle size={16} style={{ color: 'var(--green)', flexShrink: 0 }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--green)' }}>Setup at baseline</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>Last saved {savedAt}</div>
                </div>
              </div>
            </div>
          )}

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
