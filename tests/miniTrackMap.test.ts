/**
 * MiniTrackMap — the procedural circuit silhouettes must be deterministic
 * (same circuit id → same path, always) and distinct between circuits.
 */
import { describe, it, expect } from 'vitest';
import { miniTrackPath } from '../src/components/MiniTrackMap';

describe('miniTrackPath', () => {
  it('is deterministic per circuit id', () => {
    expect(miniTrackPath('mugello')).toBe(miniTrackPath('mugello'));
    expect(miniTrackPath('jerez')).toBe(miniTrackPath('jerez'));
  });

  it('produces distinct closed loops per circuit', () => {
    const a = miniTrackPath('mugello');
    const b = miniTrackPath('jarama');
    expect(a).not.toBe(b);
    expect(a.startsWith('M ')).toBe(true);
    expect(a.endsWith(' Z')).toBe(true);
    expect(a.split('Q').length).toBeGreaterThan(8); // smooth multi-corner loop
  });
});
