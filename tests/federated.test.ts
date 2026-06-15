/**
 * Federated Motorsport Intelligence — privacy-first comparative benchmarks.
 * Locks the benchmark contract, the percentile bounds, the privacy posture
 * (raw data private) and the modelled-cohort honesty.
 */
import { describe, it, expect } from 'vitest';
import { buildFederated, BENCHMARK_MODES } from '../src/domain/federated';

const args = ['Rubén Juárez', 'Yamaha R1', 'Mugello'] as const;

describe('federated intelligence', () => {
  it('builds percentiles in range and a cohort group', () => {
    const f = buildFederated(...args);
    expect(f.group.length).toBeGreaterThan(5);
    expect(f.percentiles.length).toBeGreaterThanOrEqual(5);
    for (const p of f.percentiles) { expect(p.percentile).toBeGreaterThanOrEqual(0); expect(p.percentile).toBeLessThanOrEqual(100); }
    expect(f.overallPercentile).toBeGreaterThan(0);
  });

  it('keeps raw telemetry, identity and setup private; shares only aggregates', () => {
    const f = buildFederated(...args);
    const raw = f.privacy.find(p => p.field === 'Raw telemetry')!;
    expect(raw.private).toBe(true);
    expect(f.privacy.find(p => p.field === 'Rider identity')!.private).toBe(true);
    const shared = f.privacy.find(p => p.field === 'Shared with federation')!;
    expect(shared.private).toBe(false);
    expect(shared.status.toLowerCase()).toContain('aggregated');
    expect(f.cohortNote.toLowerCase()).toContain('no raw third-party');
  });

  it('corner + technique benchmarks expose your value vs median vs top 20%', () => {
    const f = buildFederated(...args);
    const bucine = f.corners.find(c => c.corner.includes('Bucine'))!;
    expect(bucine.yours).toBeLessThan(bucine.top20);     // room to improve
    expect(bucine.median).toBeLessThanOrEqual(bucine.top20);
    expect(f.technique.some(t => t.vs === 'Below')).toBe(true); // throttle smoothness
    expect(f.technique.some(t => t.vs === 'Above')).toBe(true);
  });

  it('exposes riders-like-you, learning benchmark and the four modes', () => {
    const f = buildFederated(...args);
    expect(f.ridersLikeYou.avgGain).toMatch(/s/);
    expect(f.learning.status.length).toBeGreaterThan(0);
    expect(BENCHMARK_MODES.map(m => m.id)).toEqual(['private', 'team', 'federated', 'academy']);
    expect(f.oracleContext.length).toBeGreaterThan(20);
  });
});
