import { AlertTriangle, Circle } from 'lucide-react';

/**
 * TyreGridSchematic (engineer report v2 Ã‚Â§8) Ã¢â‚¬â€ Tyre & Grip Intelligence shown on a
 * top-down motorcycle silhouette: front and rear tyres coloured by temperature,
 * each with temp / pressure / wear / grip, plus the live grip/thermal alerts.
 * Critical states use colour + an explicit label (WCAG), never colour alone.
 */

export interface TyreData {
  temp: number;       // Ã‚Â°C
  pressure: number;   // bar
  wear: number;       // %
  grip: number;       // %
  compound: string;
}

interface Props {
  front?: TyreData;
  rear?: TyreData;
  alerts?: string[];
}

const DEF_FRONT: TyreData = { temp: 82, pressure: 2.1, wear: 34, grip: 91, compound: 'SC1' };
const DEF_REAR: TyreData = { temp: 96, pressure: 1.9, wear: 48, grip: 84, compound: 'SC1' };
const DEF_ALERTS = [
  'Rear tyre running hot after lap 6 (96Ã‚Â°C)',
  'Front pressure slightly above optimal (2.1 bar)',
  'Grip drop detected on right-hand exits',
];

// Working window ~90Ã¢â‚¬â€œ115 Ã‚Â°C (matches the 3D tyre model).
function tempColor(t: number): string {
  if (t < 90) return 'var(--blue)';       // cold
  if (t <= 115) return 'var(--green)';     // working window
  if (t < 125) return 'var(--yellow)';      // hot
  return 'var(--accent)';                   // overheating
}
function tempState(t: number): string {
  if (t < 90) return 'COLD';
  if (t <= 115) return 'OPTIMAL';
  if (t < 125) return 'HOT';
  return 'OVERHEAT';
}
const gripColor = (g: number) => (g >= 85 ? 'var(--green)' : g >= 70 ? 'var(--yellow)' : 'var(--accent)');

function TyrePanel({ label, d }: { label: string; d: TyreData }) {
  return (
    <div style={{ flex: 1, minWidth: 150 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 13 }}>{label}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, padding: '1px 6px', borderRadius: 4, color: tempColor(d.temp), background: `color-mix(in srgb, ${tempColor(d.temp)} 16%, transparent)` }}>{tempState(d.temp)}</span>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>{d.compound}</span>
      </div>
      <div className="grid-2" style={{ gap: 6 }}>
        <div className="stat-tile"><div className="stat-tile__label">Temp</div><span className="stat-tile__value" style={{ fontSize: 15, color: tempColor(d.temp) }}>{d.temp}Ã‚Â°C</span></div>
        <div className="stat-tile"><div className="stat-tile__label">Pressure</div><span className="stat-tile__value" style={{ fontSize: 15 }}>{d.pressure.toFixed(1)} bar</span></div>
        <div className="stat-tile"><div className="stat-tile__label">Wear</div><span className="stat-tile__value" style={{ fontSize: 15, color: d.wear > 60 ? 'var(--accent)' : undefined }}>{d.wear}%</span></div>
        <div className="stat-tile"><div className="stat-tile__label">Grip</div><span className="stat-tile__value" style={{ fontSize: 15, color: gripColor(d.grip) }}>{d.grip}%</span></div>
      </div>
    </div>
  );
}

export function TyreGridSchematic({ front = DEF_FRONT, rear = DEF_REAR, alerts = DEF_ALERTS }: Props) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title flex items-center gap-2"><Circle size={14} style={{ color: 'var(--accent)' }} /> Tyre &amp; Grip Intelligence</span>
        <span className="badge badge-green">Ã¢â€”Â live</span>
      </div>

      <div style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}>
        {/* Top-down bike silhouette */}
        <svg width="110" height="200" viewBox="0 0 110 200" style={{ flex: 'none' }}>
          {/* body / fairing */}
          <path d="M55 34 C70 60 70 80 64 110 L64 150 C64 168 46 168 46 150 L46 110 C40 80 40 60 55 34 Z"
            fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.12)" strokeWidth="1.5" />
          {/* front tyre */}
          <rect x="48" y="14" width="14" height="34" rx="6" fill={tempColor(front.temp)} />
          <text x="55" y="36" textAnchor="middle" fill="#0B0D12" fontSize="11" fontWeight="800" fontFamily="var(--font-mono)">F</text>
          {/* rear tyre (wider) */}
          <rect x="45" y="150" width="20" height="40" rx="7" fill={tempColor(rear.temp)} />
          <text x="55" y="174" textAnchor="middle" fill="#0B0D12" fontSize="11" fontWeight="800" fontFamily="var(--font-mono)">R</text>
          {/* temp labels */}
          <text x="55" y="10" textAnchor="middle" fill={tempColor(front.temp)} fontSize="9" fontFamily="var(--font-mono)">{front.temp}Ã‚Â°</text>
          <text x="55" y="199" textAnchor="middle" fill={tempColor(rear.temp)} fontSize="9" fontFamily="var(--font-mono)">{rear.temp}Ã‚Â°</text>
        </svg>

        <TyrePanel label="FRONT" d={front} />
        <TyrePanel label="REAR" d={rear} />
      </div>

      {/* Alerts Ã¢â‚¬â€ colour + explicit label */}
      {alerts.length > 0 && (
        <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {alerts.map((a, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 'var(--radius)', background: 'var(--yellow-dim)', border: '1px solid color-mix(in srgb, var(--yellow) 28%, transparent)' }}>
              <AlertTriangle size={12} style={{ color: 'var(--yellow)', flex: 'none' }} />
              <span style={{ fontSize: 12, color: 'var(--text-dim)' }}>{a}</span>
            </div>
          ))}
        </div>
      )}

      {/* Temperature legend */}
      <div style={{ display: 'flex', gap: 14, marginTop: 10, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)' }}>
        <span><span style={{ color: 'var(--blue)' }}>Ã¢â€“Â </span> cold</span>
        <span><span style={{ color: 'var(--green)' }}>Ã¢â€“Â </span> optimal 90Ã¢â‚¬â€œ115Ã‚Â°</span>
        <span><span style={{ color: 'var(--yellow)' }}>Ã¢â€“Â </span> hot</span>
        <span><span style={{ color: 'var(--accent)' }}>Ã¢â€“Â </span> overheat</span>
      </div>
    </div>
  );
}
