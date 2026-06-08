/**
 * InteractiveCircuitMap (engineer report §4) — the circuit map as the protagonist:
 * a clickable, numbered corner map with the racing line. Selecting a corner shows
 * its full breakdown — time loss, entry/exit speed, max lean, brake/throttle
 * timing, rear grip — and the AI Coach call. Colour + number + label (never
 * colour alone) so it is readable and WCAG-friendly.
 */

interface CornerMap {
  n: number; name: string; x: number; y: number;
  lossS: number; entry: number; exit: number; maxLean: number;
  brake: string; throttle: string; rearGrip: number; coach: string;
}

// Jarama-style closed loop; corner pins are the bends of the circuit.
const CORNERS: CornerMap[] = [
  { n: 1, name: 'Nuvolari', x: 70, y: 70, lossS: 0.061, entry: 138, exit: 96, maxLean: 51, brake: '1 m late', throttle: 'on reference', rearGrip: 90, coach: 'Tidy — turn in a touch earlier to free the exit.' },
  { n: 2, name: 'Le Mans', x: 150, y: 46, lossS: 0.022, entry: 96, exit: 92, maxLean: 48, brake: '1 m early', throttle: 'on reference', rearGrip: 92, coach: 'Reference-lap quality. Keep it.' },
  { n: 3, name: 'Tunel', x: 245, y: 58, lossS: 0.216, entry: 84, exit: 90, maxLean: 55, brake: '9 m late', throttle: '0.18 s late', rearGrip: 86, coach: 'Release the brake earlier, roll more mid-corner speed, then open the gas progressively.' },
  { n: 4, name: 'Ascari', x: 322, y: 96, lossS: 0.088, entry: 132, exit: 118, maxLean: 53, brake: '3 m late', throttle: '0.08 s late', rearGrip: 84, coach: 'Trail less front brake to settle the front and rotate.' },
  { n: 5, name: 'Bus Stop', x: 352, y: 158, lossS: 0.131, entry: 76, exit: 70, maxLean: 49, brake: '4 m late', throttle: '0.12 s late', rearGrip: 80, coach: 'Pick the bike up sooner to get drive onto the straight.' },
  { n: 6, name: 'Pedrosa', x: 320, y: 214, lossS: 0.074, entry: 154, exit: 140, maxLean: 56, brake: '2 m late', throttle: '0.06 s late', rearGrip: 82, coach: 'Use less lean and more steering to save the rear tyre.' },
  { n: 7, name: 'Portago', x: 236, y: 238, lossS: 0.284, entry: 121, exit: 94, maxLean: 57, brake: '7 m late', throttle: '0.40 s late', rearGrip: 78, coach: 'Open the throttle 0.3 s earlier with lower lean; raise TC +1 to control the rear on exit.' },
  { n: 8, name: 'Fonsi', x: 158, y: 230, lossS: 0.030, entry: 188, exit: 176, maxLean: 47, brake: 'on reference', throttle: 'on reference', rearGrip: 88, coach: 'Strong corner — no change.' },
  { n: 9, name: 'Nieto', x: 86, y: 198, lossS: 0.142, entry: 103, exit: 88, maxLean: 54, brake: '5 m late', throttle: '0.10 s late', rearGrip: 83, coach: 'Brake 5 m earlier, square the corner for a better exit.' },
  { n: 10, name: 'Bugatti', x: 48, y: 132, lossS: 0.048, entry: 142, exit: 130, maxLean: 50, brake: '1 m late', throttle: 'on reference', rearGrip: 87, coach: 'Hold the line.' },
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
  const sel = CORNERS.find(c => c.n === selected) ?? CORNERS.find(c => c.n === 7) ?? CORNERS[0];

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title flex items-center gap-2">Circuit Map · Jarama · racing line</span>
        <span className="badge badge-blue">click a corner</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1.3fr) minmax(220px,1fr)', gap: 16, alignItems: 'center', marginTop: 6 }}>
        {/* Map */}
        <svg viewBox="0 0 400 290" style={{ width: '100%', height: 'auto' }}>
          {/* track ribbon */}
          <path d={PATH} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="16" strokeLinejoin="round" />
          <path d={PATH} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth="13" strokeLinejoin="round" />
          {/* racing line */}
          <path d={PATH} fill="none" stroke="var(--accent)" strokeWidth="2" strokeDasharray="1 5" strokeLinecap="round" opacity="0.7" />
          {/* corner pins */}
          {CORNERS.map(c => {
            const isSel = c.n === sel.n;
            const col = lossColor(c.lossS);
            return (
              <g key={c.n} onClick={() => onSelect(c.n)} style={{ cursor: 'pointer' }}>
                {isSel && <circle cx={c.x} cy={c.y} r="15" fill="none" stroke={col} strokeWidth="2" opacity="0.6" />}
                <circle cx={c.x} cy={c.y} r="10" fill={col} stroke="#0B0D12" strokeWidth="2" />
                <text x={c.x} y={c.y + 3.5} textAnchor="middle" fontSize="10" fontWeight="800" fill="#0B0D12" fontFamily="var(--font-mono)">{c.n}</text>
              </g>
            );
          })}
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
