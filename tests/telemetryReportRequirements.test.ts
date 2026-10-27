import { describe, expect, it } from 'vitest';
import { reportRequirements, reportSource, specialistContracts, assessSessionContext } from '../src/domain/telemetryReportRequirements';
import { productModules } from '../src/domain/productModules';
import shell from '../src/app/DashboardShell.tsx?raw';

describe('minimum product requirements from the supplied report', () => {
  it('covers all three report domains and the six specialist contracts without claiming deployed agents', () => {
    expect(reportSource.sha256).toBe('794ebb2d3eb834556f3ed6b7d0794f44b4b522c2c6103d4864879fe49b36270f');
    expect(new Set(reportRequirements.map(r => r.domain))).toEqual(new Set(['motorcycle', 'track', 'rider', 'oracle']));
    expect(new Set(reportRequirements.map(r => r.id)).size).toBe(reportRequirements.length);
    expect(specialistContracts).toHaveLength(6);
    expect(specialistContracts.every(s => s.deployment === 'planned')).toBe(true);
    expect(reportRequirements.length).toBeGreaterThanOrEqual(35);
    for (const requirement of reportRequirements) {
      expect(requirement.sourceParagraphs.length).toBeGreaterThan(0);
      expect(requirement.acceptance.length).toBeGreaterThan(15);
      expect(requirement.dependencies.length).toBeGreaterThan(0);
      expect(requirement.status).not.toBe('verified');
    }
  });
  it('keeps unavailable physics, native exports, health predictions and optimizers explicitly pending', () => {
    for (const id of ['dynamic-trail', 'anti-squat', 'native-math-exports', 'hed', 'neuro-flow', 'contextual-optimization']) {
      const requirement = reportRequirements.find(r => r.id === id)!;
      expect(requirement).toBeDefined();
      expect(['pending', 'research', 'external-validation']).toContain(requirement.status);
    }
    expect(reportRequirements.find(r => r.id === 'progressive-suspension')?.status).toBe('partial');
    expect(reportRequirements.find(r => r.id === 'two-d-reading')?.status).toBe('external-validation');
  });
  it('never treats missing, empty or experimental telemetry as a working specialist or a rider diagnosis', () => {
    expect(assessSessionContext(null).every(c => c.state === 'missing')).toBe(true);
    const channels = [{ sensor_id: 'suspension_front', sample_count: 100 }, { sensor_id: 'engine_rpm', sample_count: 0 }];
    const context = assessSessionContext({ channels, validation: { status: 'experimental' } });
    expect(context.find(c => c.id === 'chassis')?.state).toBe('source-unverified');
    expect(context.find(c => c.id === 'tires-powertrain')?.state).toBe('missing');
    expect(context.find(c => c.id === 'physical')?.state).toBe('missing');
    expect(context.find(c => c.id === 'neuro')?.state).toBe('missing');
    const exported = assessSessionContext({ channels, validation: undefined });
    expect(exported.find(c => c.id === 'chassis')?.state).toBe('signals-only');
    expect(exported.find(c => c.id === 'chassis')?.note).toMatch(/calibración/i);
  });
  it('catalogues every actual navigation ID with a reason and evidence rather than implying completion', () => {
    const nav = shell.slice(shell.indexOf('const ALL_NAV_SECTIONS'), shell.indexOf('function useClock'));
    const ids = [...nav.matchAll(/\{ id: '([^']+)', labelKey:/g)].map(m => m[1]);
    expect(ids.length).toBeGreaterThan(60);
    expect(new Set(productModules.map(m => m.id)).size).toBe(productModules.length);
    for (const id of ids) {
      const entry = productModules.find(m => m.id === id);
      expect(entry, id).toBeDefined();
      expect(entry?.reason).toBeTruthy();
      expect(entry?.evidence.length).toBeGreaterThan(0);
    }
  });
});
