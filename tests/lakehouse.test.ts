/**
 * Motorsport Data Lakehouse & Feature Store — the data foundation. Locks the
 * six-zone model, the asset summary, the feature store + sample feature, the
 * decision-linked-to-outcome store, the model registry and the privacy export.
 */
import { describe, it, expect } from 'vitest';
import { buildLakehouse } from '../src/domain/lakehouse';

const args = ['Rubén Juárez', 'Yamaha R1', 'Mugello', 'Stint 03'] as const;

describe('motorsport data lakehouse', () => {
  it('models six zones raw → … → model', () => {
    const l = buildLakehouse(...args);
    expect(l.zones.map(z => z.layer)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(l.zones[0].name).toContain('Raw');
    expect(l.zones[5].name).toContain('Model');
  });

  it('asset summary + feature store + sample feature are coherent', () => {
    const l = buildLakehouse(...args);
    expect(l.summary.features).toBeGreaterThan(1000);
    expect(l.featureGroups.length).toBeGreaterThanOrEqual(5);
    expect(l.sampleFeature.corner).toBe('T15 Bucine');
    expect(Number(l.sampleFeature.rear_slip_pct)).toBe(14);
  });

  it('decisions are linked to their outcome and events store carries status', () => {
    const l = buildLakehouse(...args);
    expect(l.decisions.find(d => d.decision.includes('rebound'))!.outcome).toBe('Validated');
    expect(l.decisions.some(d => d.outcome === 'Rejected')).toBe(true);
    expect(l.events.some(e => e.outcome === 'Validated')).toBe(true);
  });

  it('model registry + lineage + query studio expose explainable data', () => {
    const l = buildLakehouse(...args);
    expect(l.models.length).toBeGreaterThanOrEqual(2);
    expect(l.models[0].score).toBeGreaterThan(0);
    expect(l.lineage.basedOn.length).toBeGreaterThan(2);
    expect(l.queries.length).toBeGreaterThanOrEqual(3);
    expect(l.versions.map(v => v.version)).toContain('v0');
  });

  it('federated export shares aggregates only, never raw/identity; GPS-only lowers trust', () => {
    const full = buildLakehouse(...args);
    const gps = buildLakehouse('KD5', 'Kawasaki ZX-10R', 'Mugello', 'Stint 03', true);
    expect(full.federatedExport.notShared).toContain('Raw telemetry');
    expect(full.federatedExport.notShared).toContain('Rider identity');
    expect(gps.cleanDataTrust).toBeLessThan(full.cleanDataTrust);
  });
});
