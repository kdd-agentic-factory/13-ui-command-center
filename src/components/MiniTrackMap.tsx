/**
 * MiniTrackMap — tiny procedural circuit outline for circuit cards.
 *
 * Deterministic: the closed-loop shape derives only from the circuit id
 * (seeded radii around a circle, smoothed with quadratic midpoint curves),
 * so each circuit always shows the same recognisable silhouette. The trace
 * draws itself via the global .mini-track dash animation on hover/selection.
 */
import { mulberry32 } from '../domain/demoSessions';

function seedFrom(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) { h ^= id.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

export function miniTrackPath(id: string, size = 64): string {
  const rand = mulberry32(seedFrom(id));
  const n = 9 + Math.floor(rand() * 4);            // 9–12 control points
  const cx = size / 2, cy = size / 2;
  const pts: Array<[number, number]> = [];
  for (let i = 0; i < n; i++) {
    const ang = (i / n) * Math.PI * 2;
    const r = size * (0.22 + rand() * 0.21);       // varied radii → corners
    pts.push([cx + Math.cos(ang) * r * 1.25, cy + Math.sin(ang) * r]);
  }
  // Smooth closed loop through midpoints (quadratic Béziers)
  const mid = (a: [number, number], b: [number, number]): [number, number] =>
    [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M ${mid(pts[n - 1], pts[0])[0].toFixed(1)} ${mid(pts[n - 1], pts[0])[1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p = pts[i];
    const m = mid(p, pts[(i + 1) % n]);
    d += ` Q ${p[0].toFixed(1)} ${p[1].toFixed(1)} ${m[0].toFixed(1)} ${m[1].toFixed(1)}`;
  }
  return d + ' Z';
}

export function MiniTrackMap({ id, color, size = 40, active = false }: {
  id: string; color: string; size?: number; active?: boolean;
}) {
  return (
    <svg
      className={`mini-track${active ? ' mini-track--active' : ''}`}
      width={size} height={size} viewBox="0 0 64 64"
      style={{ flexShrink: 0, opacity: 0.9 }}
      aria-hidden
    >
      <path d={miniTrackPath(id)} fill="none" stroke={color} strokeWidth={2.4}
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
