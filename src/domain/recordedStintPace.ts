import type { RecordedSession } from './recordedSession';

export interface StintDeclaration {
  start: number;
  end: number;
  setup: string;
  compound: string;
  age: number | null;
  conditions: string;
  exclusions: Record<number, string>;
}

interface StintPace {
  setup: string;
  compound: string;
  age: number;
  conditions: string;
  included: number[];
  excluded: { lap: number; reason: string }[];
  count: number;
  median: number;
  observedChange: number | null;
}

type BlockReason = 'experimental' | 'range' | 'overlap' | 'declaration' | 'exclusion' | 'empty';
type Blocked = { kind: 'blocked'; reason: BlockReason };
type Result = Blocked | { kind: 'observed_pace'; a: StintPace; b: StintPace; medianDelta: number };
type Laps = RecordedSession['laps'];

function summarize(laps: Laps, stint: StintDeclaration): StintPace | Blocked {
  const { start, end, age, setup, compound, conditions, exclusions } = stint;
  if (age === null || !Number.isSafeInteger(age) || age < 0 || !setup.trim() || !compound.trim() || !conditions.trim()) {
    return { kind: 'blocked', reason: 'declaration' };
  }

  const included: number[] = [];
  const excluded: StintPace['excluded'] = [];
  const times: number[] = [];
  for (let position = start; position <= end; position++) {
    const { index, start_s, duration_s } = laps[position];
    const manualReason = exclusions[position]?.trim();
    if (manualReason === '') return { kind: 'blocked', reason: 'exclusion' };
    const valid = Number.isFinite(start_s) && start_s >= 0 && Number.isFinite(duration_s) && duration_s > 0;
    const reason = [manualReason, !valid && 'Marcador de vuelta inválido'].filter(Boolean).join(' · ');
    if (reason) {
      excluded.push({ lap: index, reason });
    } else {
      included.push(index);
      times.push(duration_s);
    }
  }
  if (!times.length) return { kind: 'blocked', reason: 'empty' };
  const sorted = [...times].sort((x, y) => x - y);
  const midpoint = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[midpoint] : (sorted[midpoint - 1] + sorted[midpoint]) / 2;
  return {
    setup: setup.trim(), compound: compound.trim(), age, conditions: conditions.trim(),
    included, excluded, count: times.length, median,
    observedChange: times.length > 1 ? times[times.length - 1] - times[0] : null,
  };
}

export function compareRecordedStints(
  recording: Pick<RecordedSession, 'laps' | 'validation'>, a: StintDeclaration, b: StintDeclaration,
): Result {
  if (recording.validation?.status === 'experimental') return { kind: 'blocked', reason: 'experimental' };
  const validRange = ({ start, end }: StintDeclaration) =>
    Number.isInteger(start) && Number.isInteger(end) && start >= 0 && start <= end && end < recording.laps.length;
  if (!validRange(a) || !validRange(b)) return { kind: 'blocked', reason: 'range' };
  if (a.start <= b.end && b.start <= a.end) return { kind: 'blocked', reason: 'overlap' };
  const first = summarize(recording.laps, a);
  if ('kind' in first) return first;
  const second = summarize(recording.laps, b);
  if ('kind' in second) return second;
  return { kind: 'observed_pace', a: first, b: second, medianDelta: second.median - first.median };
}
