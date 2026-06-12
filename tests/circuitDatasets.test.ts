/**
 * Circuit datasets — Jarama gets its own named corner set with deterministic
 * metrics; dataset-aware integrity stops warning for circuits that have one.
 */
import { describe, it, expect } from 'vitest';
import { CORNER_SETS, hasDataset, generateCorners, activeRaceLaps } from '../src/domain/circuitDatasets';

describe('circuit datasets', () => {
  it('jarama has a 13-corner named set and counts as having a dataset', () => {
    expect(CORNER_SETS.jarama).toHaveLength(13);
    expect(CORNER_SETS.jarama[0].name).toBe('Nuvolari');
    expect(CORNER_SETS.jarama[12].name).toBe('Portago');
    expect(hasDataset('jarama')).toBe(true);
    expect(hasDataset('mugello')).toBe(true);   // curated
    expect(hasDataset('jerez')).toBe(false);    // still reference-sample only
  });

  it('generated corners are deterministic and fully populated', () => {
    const a = generateCorners('jarama');
    const b = generateCorners('jarama');
    expect(a).toEqual(b);
    expect(a).toHaveLength(13);
    for (const c of a) {
      expect(c.entrySpeed).toBeGreaterThan(c.apexSpeed);
      expect(c.rearGrip).toBeGreaterThanOrEqual(74);
      expect(c.issue.length).toBeGreaterThan(3);
    }
  });

  it('race distance follows circuit length (Mugello stays canonical 23)', () => {
    expect(activeRaceLaps({ id: 'mugello', lengthKm: 5.245 })).toBe(23);
    expect(activeRaceLaps({ id: 'jarama', lengthKm: 3.85 })).toBe(27); // ~105 km
  });
});
