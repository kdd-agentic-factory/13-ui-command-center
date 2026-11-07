import type { RecordedChannel, RecordedSession, RecordedSignal } from './recordedSession';

type Lap = RecordedSession['laps'][number];
export interface GpsPoint { x: number; y: number; t: number; gap: boolean }
export interface SpatialPoint extends GpsPoint { distance: number }
type Gap = { start: number; end: number };
interface Alignment {
  reference: SpatialPoint[];
  compared: SpatialPoint[];
  length: number;
  referenceCoverage: number;
  coverage: number;
  valid: boolean;
}
const maxOffset = 15;
const maxPoints = 6000;
const separation = (a: GpsPoint, b: GpsPoint) => Math.hypot(b.x - a.x, b.y - a.y);

export function recordedGpsPair(channels: RecordedChannel[]) {
  const degrees = channels.filter(c => /^(°|deg|degrees?)$/i.test(c.unit.trim()));
  for (const kind of ['gps_computed', 'logged', 'gps_raw', undefined]) {
    const group = degrees.filter(c => c.kind === kind);
    const lat = group.find(c => c.sensor_id === 'gps_lat' || /^(?:gps)?lat(?:itude)?$/.test(c.name.toLowerCase().replace(/[^a-z]/g, '')));
    const lon = group.find(c => c.sensor_id === 'gps_lon' || /^(?:gps)?lon(?:g(?:itude)?)?$/.test(c.name.toLowerCase().replace(/[^a-z]/g, '')));
    if (lat && lon) return { lat, lon };
  }
  return null;
}

export function gpsLap(latitude: RecordedSignal, longitude: RecordedSignal, lap: Lap): GpsPoint[] {
  if (latitude.preview || longitude.preview || !Number.isFinite(lap.start_s) || !(lap.duration_s > 0)) return [];
  const end = lap.start_s + lap.duration_s;
  const origin = latitude.values.find(v => Number.isFinite(v) && Math.abs(v) <= 90);
  if (origin === undefined) return [];
  const metresPerDegree = 111195;
  const longitudeScale = metresPerDegree * Math.cos(origin * Math.PI / 180);
  const points: GpsPoint[] = [];
  let j = 0;
  let gap = false;
  for (let i = 0; i < latitude.times.length; i++) {
    const time = latitude.times[i];
    if (time < lap.start_s) continue;
    if (time > end) break;
    while (longitude.times[j] < time - 1e-6) j++;
    const lat = latitude.values[i], lon = longitude.values[j];
    if (!(Math.abs(longitude.times[j] - time) <= 1e-6 && Math.abs(lat) <= 90 && Math.abs(lon) <= 180)) {
      gap = true;
      continue;
    }
    points.push({ x: lon * longitudeScale, y: lat * metresPerDegree, t: time - lap.start_s, gap });
    gap = false;
    if (points.length > maxPoints) return [];
  }
  return points;
}

function discontinuous(a: GpsPoint, b: GpsPoint) {
  const dt = b.t - a.t;
  return b.gap || dt <= 0 || dt > .5 || separation(a, b) > 120 * dt + 8;
}

function project(p: GpsPoint, a: SpatialPoint, b: SpatialPoint) {
  const dx = b.x - a.x, dy = b.y - a.y;
  const fraction = Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.y - a.y) * dy) / (dx * dx + dy * dy)));
  return {
    distance: a.distance + fraction * (b.distance - a.distance),
    offset: Math.hypot(p.x - a.x - fraction * dx, p.y - a.y - fraction * dy),
  };
}

function covered(points: SpatialPoint[]) {
  return points.reduce((sum, p, i) => p.gap || i === 0 ? sum : sum + p.distance - points[i - 1].distance, 0);
}

export function alignRecordedLaps(a: GpsPoint[], b: GpsPoint[], durations?: [number, number]): Alignment {
  let length = 0;
  const reference = a.map((p, i) => {
    if (i) length += separation(a[i - 1], p);
    return { ...p, distance: length, gap: i > 0 && discontinuous(a[i - 1], p) };
  });
  const gaps: Gap[] = [];
  const cellSize = 2 * maxOffset;
  const grid = new Map<string, { start: SpatialPoint; end: SpatialPoint }[]>();
  for (let i = 1; i < reference.length; i++) {
    const start = reference[i - 1], end = reference[i];
    if (end.gap) {
      gaps.push({ start: start.distance, end: end.distance });
      continue;
    }
    if (start.distance === end.distance) continue;
    const left = Math.floor((Math.min(start.x, end.x) - maxOffset) / cellSize);
    const right = Math.floor((Math.max(start.x, end.x) + maxOffset) / cellSize);
    const bottom = Math.floor((Math.min(start.y, end.y) - maxOffset) / cellSize);
    const top = Math.floor((Math.max(start.y, end.y) + maxOffset) / cellSize);
    for (let x = left; x <= right; x++) {
      for (let y = bottom; y <= top; y++) {
        const key = x + ':' + y;
        const cell = grid.get(key) ?? [];
        cell.push({ start, end });
        grid.set(key, cell);
      }
    }
  }
  const compared: SpatialPoint[] = [];
  let gap = false;
  for (let i = 0; i < b.length; i++) {
    const p = b[i];
    const previous = compared[compared.length - 1];
    const floor = previous?.distance ?? 0;
    if (i && discontinuous(b[i - 1], p)) gap = true;
    const key = Math.floor(p.x / cellSize) + ':' + Math.floor(p.y / cellSize);
    const candidates = (grid.get(key) ?? []).flatMap(({ start, end }) => {
      const match = project(p, start, end);
      if (match.offset > maxOffset || match.distance < floor - 2) return [];
      // The start and finish share a physical location on a closed track.
      if (floor < 40 && match.distance > length - 40 && p.t <= .5) return [];
      return [match];
    });
    const match = candidates.reduce<typeof candidates[number] | undefined>((best, c) =>
      !best || c.offset < best.offset ? c : best, undefined);
    if (!match || candidates.some(c => c.offset <= match.offset + 2 && Math.abs(c.distance - match.distance) > 40)) {
      gap = true;
      continue;
    }
    const distance = Math.max(floor, match.distance);
    if (previous && distance === floor) continue;
    if (previous && (discontinuous(previous, p) || distance - floor > separation(previous, p) + maxOffset || crossesIndexedGap(gaps, floor, distance))) gap = true;
    compared.push({ ...p, distance, gap: Boolean(previous) && gap });
    gap = false;
  }
  const coverage = length ? covered(compared) / length : 0;
  const referenceCoverage = length ? covered(reference) / length : 0;
  const closed = (p: GpsPoint[], duration?: number) => p.length > 1 && p[0].t <= .3 &&
    (duration === undefined || duration - p[p.length - 1].t <= .3) && separation(p[0], p[p.length - 1]) <= 2 * maxOffset;
  const valid = length >= 100 && closed(a, durations?.[0]) && closed(b, durations?.[1]) && coverage >= .90 && referenceCoverage >= .90 &&
    compared[0]?.distance <= maxOffset && (compared[compared.length - 1]?.distance ?? 0) >= length - maxOffset;
  return { reference, compared, length, coverage, referenceCoverage, valid };
}

function crossesIndexedGap(gaps: Gap[], start: number, end: number) {
  let lo = 0, hi = gaps.length;
  while (lo < hi) {
    const mid = Math.floor((lo + hi) / 2);
    if (gaps[mid].end <= start) lo = mid + 1;
    else hi = mid;
  }
  return lo < gaps.length && gaps[lo].start < end;
}

function crossesGap(points: SpatialPoint[], start: number, end: number) {
  return points.some((p, i) => i > 0 && p.gap && p.distance > start && points[i - 1].distance < end);
}

export function pointAtDistance(points: SpatialPoint[], distance: number): SpatialPoint | null {
  const i = points.findIndex(p => p.distance >= distance);
  if (i < 0) return null;
  const after = points[i];
  if (after.distance === distance) return after;
  if (!i || after.gap) return null;
  const before = points[i - 1];
  const f = (distance - before.distance) / (after.distance - before.distance);
  return { distance, gap: false, x: before.x + f * (after.x - before.x), y: before.y + f * (after.y - before.y), t: before.t + f * (after.t - before.t) };
}

export function curveDelta(alignment: Alignment, start: number, end: number): number | null {
  if (!alignment.valid || !(end > start)) return null;
  const durations = [alignment.reference, alignment.compared].map(points => {
    const from = pointAtDistance(points, start), to = pointAtDistance(points, end);
    return from && to && !crossesGap(points, start, end) ? to.t - from.t : null;
  });
  const [a, b] = durations;
  return a === null || b === null ? null : b - a;
}
