import { describe, expect, it } from 'vitest';
import type { RecordedSession } from './recordedSession';
import { compareRecordedStints, type StintDeclaration } from './recordedStintPace';

const laps = [62, 120, 64, 65, 66, 67].map((duration_s, position) => ({
  index: position + 10, start_s: position * 130, duration_s,
}));
const recording = { laps, validation: { status: 'validated', vendor_crosschecked: true } } satisfies Pick<RecordedSession, 'laps' | 'validation'>;
const a: StintDeclaration = { start: 0, end: 2, setup: 'Base v1', compound: 'Medium', age: 0, conditions: 'Seco, 26 °C', exclusions: { 1: 'Tráfico' } };
const b: StintDeclaration = { start: 3, end: 5, setup: 'Prueba v2', compound: 'Soft', age: 8, conditions: 'Húmedo, 20 °C', exclusions: {} };

describe('recorded stint pace', () => {
  it('computes descriptive pace from included laps and retains declared conditions and exclusions', () => {
    expect(compareRecordedStints(recording, a, b)).toMatchObject({
      kind: 'observed_pace',
      a: { age: 0, compound: 'Medium', conditions: 'Seco, 26 °C', setup: 'Base v1', count: 2, median: 63, observedChange: 2, excluded: [{ lap: 11, reason: 'Tráfico' }] },
      b: { age: 8, compound: 'Soft', conditions: 'Húmedo, 20 °C', setup: 'Prueba v2', count: 3, median: 66 },
      medianDelta: 3,
    });
  });

  it('blocks undeclared age, undocumented exclusions and overlapping stints', () => {
    expect(compareRecordedStints(recording, { ...a, age: null }, b)).toMatchObject({ kind: 'blocked', reason: 'declaration' });
    expect(compareRecordedStints(recording, { ...a, exclusions: { 1: ' ' } }, b)).toMatchObject({ kind: 'blocked', reason: 'exclusion' });
    expect(compareRecordedStints(recording, a, { ...b, start: 2 })).toMatchObject({ kind: 'blocked', reason: 'overlap' });
  });

  it('blocks experimental clocks and documents unusable recorded markers', () => {
    expect(compareRecordedStints({ ...recording, validation: { status: 'experimental', vendor_crosschecked: false } }, a, b))
      .toMatchObject({ kind: 'blocked', reason: 'experimental' });
    const invalidMarker = { ...recording, laps: laps.map((lap, position) => position === 4 ? { ...lap, duration_s: 0 } : lap) };
    expect(compareRecordedStints(invalidMarker, a, b)).toMatchObject({
      kind: 'observed_pace',
      b: { count: 2, excluded: [{ lap: 14, reason: 'Marcador de vuelta inválido' }] },
    });
  });
});
