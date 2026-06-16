/**
 * Developer & Integration Hub / Open Motorsport Protocol. Locks the schema,
 * connector health, the plugin trust/permission model (no raw export without
 * approval), the API surface and the sandbox gate.
 */
import { describe, it, expect } from 'vitest';
import { buildDevHub, connColor, trustColor } from '../src/domain/devHub';

const args = ['Rubén Juárez', 'Yamaha R1', 'Mugello'] as const;

describe('developer & integration hub', () => {
  it('defines a common data schema with required + optional fields', () => {
    const d = buildDevHub(...args);
    expect(d.schema.some(f => f.field === 'session_id' && f.required)).toBe(true);
    expect(d.schema.some(f => !f.required)).toBe(true);
    expect(d.sampleSchemaJson.session_id).toBe('mugello_stint03');
  });

  it('lists connectors with health states incl degraded/offline', () => {
    const d = buildDevHub(...args);
    expect(d.connectors.length).toBeGreaterThanOrEqual(5);
    expect(d.connectors.some(c => c.status === 'Healthy')).toBe(true);
    expect(d.connectors.some(c => c.status === 'Offline' || c.status === 'Warning')).toBe(true);
  });

  it('plugins carry trust + permissions; none export raw data', () => {
    const d = buildDevHub(...args);
    expect(d.plugins.length).toBeGreaterThanOrEqual(4);
    expect(d.plugins.every(p => p.permissions.exportRaw === false)).toBe(true);
    expect(d.plugins.some(p => p.trust === 'verified')).toBe(true);
    expect(d.plugins.some(p => p.trust === 'team-private')).toBe(true);
    expect(d.manifestSample.trust_level).toBe('verified');
  });

  it('exposes an API surface, SDKs and the plugin→orchestrator flow', () => {
    const d = buildDevHub(...args);
    expect(d.apis.some(a => a.path.includes('/telemetry/'))).toBe(true);
    expect(d.sdks).toContain('Python');
    expect(d.pluginFlow[d.pluginFlow.length - 1].toLowerCase()).toContain('knowledge graph');
  });

  it('sandbox gates plugins before live + marketplace carries trust', () => {
    const d = buildDevHub(...args);
    expect(d.sandbox.status.toLowerCase()).toContain('not approved for live');
    expect(d.marketplace.length).toBeGreaterThan(3);
    expect(connColor('Offline')).toBeTruthy();
    expect(trustColor('verified')).toBeTruthy();
  });
});
