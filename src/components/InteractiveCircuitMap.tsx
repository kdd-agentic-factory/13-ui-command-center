/**
 * InteractiveCircuitMap — Mugello 15-turn circuit map with racing line.
 *
 * Click a corner to see full breakdown: loss, entry/exit speed, max lean,
 * brake/throttle timing, rear grip, coach recommendation.
 * Colour + number + label (never colour alone) — WCAG-friendly.
 */

interface CornerMap {
  n: number; name: string; x: number; y: number;
  lossS: number; entry: number; exit: number; maxLean: number;
  brake: string; throttle: string; rearGrip: number; coach: string;
}

// Mugello 15-turn layout — clockwise, S/F near T15/Bucine
const CORNERS: CornerMap[] = [
  { n: 1,  name: 'San Donato',     x: 135, y: 55,  lossS: 0.216, entry: 350, exit: 148, maxLean: 52, brake: '9 m late',   throttle: '0.18 s late', rearGrip: 84, coach: 'Brake 5 m earlier, trail less front brake to settle the bike.' },
  { n: 2,  name: 'Luco',           x: 200, y: 48,  lossS: 0.022, entry: 155, exit: 142, maxLean: 45, brake: 'on ref.',    throttle: 'on ref.',      rearGrip: 92, coach: 'Keep it. Reference-lap quality.' },
  { n: 3,  name: 'Poggio Secco',   x: 265, y: 58,  lossS: 0.037, entry: 148, exit: 132, maxLean: 48, brake: 'on ref.',    throttle: '0.02 s late',  rearGrip: 88, coach: 'Avoid aggressive brake release before weight settles over crest.' },
  { n: 4,  name: 'Materassi',      x: 315, y: 82,  lossS: 0.030, entry: 182, exit: 171, maxLean: 47, brake: 'on ref.',    throttle: '0.02 s late',  rearGrip: 89, coach: 'Turn in a touch earlier to free the exit.' },
  { n: 5,  name: 'Borgo S. Lorenzo', x: 335, y: 125, lossS: 0.026, entry: 171, exit: 184, maxLean: 46, brake: 'on ref.',  throttle: '0.01 s late',  rearGrip: 90, coach: 'Reference-lap quality. Hold the line.' },
  { n: 6,  name: 'Casanova',       x: 330, y: 175, lossS: 0.061, entry: 218, exit: 204, maxLean: 50, brake: '1 m late',   throttle: '0.05 s late',  rearGrip: 86, coach: 'Pick the bike up sooner to get drive onto the straight.' },
  { n: 7,  name: 'Savelli',        x: 305, y: 215, lossS: 0.058, entry: 204, exit: 198, maxLean: 53, brake: '1 m late',   throttle: '0.04 s late',  rearGrip: 85, coach: 'Hold the line through transition.' },
  { n: 8,  name: 'Arrabbiata 1',   x: 260, y: 240, lossS: 0.131, entry: 242, exit: 224, maxLean: 58, brake: '4 m late',   throttle: '0.12 s late',  rearGrip: 82, coach: 'Release the brake earlier, roll more mid-corner speed.' },
  { n: 9,  name: 'Arrabbiata 2',   x: 210, y: 238, lossS: 0.088, entry: 238, exit: 229, maxLean: 57, brake: '3 m late',   throttle: '0.08 s late',  rearGrip: 83, coach: 'Use less lean and more steering to save the rear tyre.' },
  { n: 10, name: 'Scarperia',      x: 165, y: 215, lossS: 0.074, entry: 195, exit: 171, maxLean: 51, brake: '2 m late',   throttle: '0.06 s late',  rearGrip: 84, coach: 'Turn in earlier to carry more speed.' },
  { n: 11, name: 'Palagio',        x: 130, y: 182, lossS: 0.018, entry: 171, exit: 186, maxLean: 44, brake: 'on ref.',    throttle: 'on ref.',      rearGrip: 92, coach: 'Keep it. Reference-lap quality.' },
  { n: 12, name: 'Correntaio',     x: 108, y: 140, lossS: 0.142, entry: 186, exit: 158, maxLean: 54, brake: '5 m late',   throttle: '0.10 s late',  rearGrip: 80, coach: 'Square the corner for a better exit.' },
  { n: 13, name: 'Biondetti 1',    x: 105, y: 95,  lossS: 0.048, entry: 228, exit: 214, maxLean: 49, brake: '1 m late',   throttle: '0.03 s late',  rearGrip: 88, coach: 'Hold the line.' },
  { n: 14, name: 'Biondetti 2',    x: 125, y: 62,  lossS: 0.043, entry: 214, exit: 207, maxLean: 50, brake: '1 m late',   throttle: '0.03 s late',  rearGrip: 87, coach: 'Hold the line on exit.' },
  { n: 15, name: 'Bucine',         x: 165, y: 50,  lossS: 0.284, entry: 159, exit: 184, maxLean: 57, brake: '7 m late',   throttle: '0.40 s late',  rearGrip: 78, coach: 'Open throttle 0.3 s earlier with lower lean; raise TC +1 if rear slip persists.' },
];

function lossColor(l: number): string {
  if (l > 0.15) return 'var(--accent)';
  if (l > 0.07) return 'var(--yellow)';
  return 'var(--green)';
}

// Catmull-Rom → cubic-bezier smooth closed path through the corner pins.
function smoothLoop(pts: CornerMap[]): string {
  const n = pts.length;
  let d = `M ${pts[0].x} ${pts[0].y} `;
  for (let i = 0; i < n; i++) {
    const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
    const c1x = p1.x + (p2.x - p0.x) / 6, c1y = p1.y + (p2.y - p0.y) / 6;
    const c2x = p2.x - (p3.x - p1.x) / 6, c2y = p2.y - (p3.y - p1.y) / 6;
    d += `C ${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${p2.x} ${p2.y} `;
  }
  return d + 'Z';
}

const PATH = smoothLoop(CORNERS);

export function InteractiveCircuitMap({ selected, onSelect }: { selected: number | null; onSelect: (n: number) => void }) {
  const sel = CORNERS.find(c => c.n === selected) ?? CORNERS.find(c => c.n === 15) ?? CORNERS[0];

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title flex items-center gap-2">Circuit Map · Mugello · racing line</span>
        <span className="badge badge-blue">click a corner</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(220px,1fr)', gap: 16, alignItems: 'center', marginTop: 6 }}>
        {/* Map */}
        <svg viewBox="0 0 400 290" style={{ width: '100%', height: 'auto' }}>
          {/* track ribbon */}
          <path d={PATH} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="20" strokeLinejoin="round" />
          <path d={PATH} fill="none" stroke="rgba(255,255,255,0.20)" strokeWidth="16" strokeLinejoin="round" />
          {/* racing line */}
          <path d={PATH} fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeDasharray="1 5" strokeLinecap="round" opacity="0.6" />
          {/* corner pins */}
          {CORNERS.map(c => {
            const isSel = c.n === sel.n;
            const col = lossColor(c.lossS);
            return (
              <g key={c.n} onClick={() => onSelect(c.n)} style={{ cursor: 'pointer' }}>
                {isSel && <circle cx={c.x} cy={c.y} r="14" fill="none" stroke={col} strokeWidth="2" opacity="0.6" />}
                <circle cx={c.x} cy={c.y} r="9" fill={col} stroke="#0B0D12" strokeWidth="2" />
                <text x={c.x} y={c.y + 3} textAnchor="middle" fontSize="9" fontWeight="800" fill="#0B0D12" fontFamily="var(--font-mono)">{c.n}</text>
              </g>
            );
          })}
          {/* S/F line marker */}
          <line x1="88" y1="268" x2="118" y2="268" stroke="var(--text-muted)" strokeWidth="2" strokeDasharray="4 2" opacity="0.5" />
          <text x="170" y="274" fill="var(--text-muted)" fontSize="8" fontFamily="var(--font-mono)" opacity="0.5">S/F</text>
        </svg>

        {/* Selected corner detail */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 18, color: lossColor(sel.lossS) }}>T{sel.n}</span>
            <span style={{ fontSize: 14, color: 'var(--text-dim)' }}>{sel.name}</span>
            <span style={{ marginLeft: 'auto', fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 16, color: lossColor(sel.lossS) }}>+{sel.lossS.toFixed(3)}s</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6, marginBottom: 10 }}>
            {[
              { l: 'Entry', v: `${sel.entry} km/h` },
              { l: 'Exit', v: `${sel.exit} km/h` },
              { l: 'Max lean', v: `${sel.maxLean}°` },
              { l: 'Rear grip', v: `${sel.rearGrip}%` },
              { l: 'Brake', v: sel.brake },
              { l: 'Throttle', v: sel.throttle },
            ].map(s => (
              <div key={s.l} className="stat-tile" style={{ padding: '6px 9px' }}>
                <div className="stat-tile__label">{s.l}</div>
                <span className="stat-tile__value" style={{ fontSize: 13 }}>{s.v}</span>
              </div>
            ))}
          </div>
          <div style={{ fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: 3 }}>RIDER COACH AI</div>
          <div style={{ fontSize: 12.5, color: 'var(--text)', lineHeight: 1.45 }}>{sel.coach}</div>
        </div>
      </div>
    </div>
  );
}
