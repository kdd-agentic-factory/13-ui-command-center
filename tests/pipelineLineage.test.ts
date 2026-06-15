/**
 * Data Trust Center ↔ 06-kdd-data-pipelines lineage (live with fallback). Locks
 * the four states and the pipeline-name cleanup.
 */
import { describe, it, expect } from 'vitest';
import { loadPipelineLineage } from '../src/domain/dataTrust';

describe('pipeline lineage', () => {
  it('overlays live pipelines and strips file extensions', async () => {
    const p = await loadPipelineLineage({
      fetchPipelines: async () => ({ ok: true, data: { pipelines: ['ingest.yaml', 'clean.yml', 'feature_extract.json'], total: 3 } }),
    });
    expect(p.state).toBe('live');
    expect(p.total).toBe(3);
    expect(p.pipelines).toEqual(['ingest', 'clean', 'feature_extract']);
  });

  it('caps the displayed list but keeps the real total', async () => {
    const many = Array.from({ length: 20 }, (_, i) => `p${i}.yaml`);
    const p = await loadPipelineLineage({ fetchPipelines: async () => ({ ok: true, data: { pipelines: many, total: 20 } }) });
    expect(p.total).toBe(20);
    expect(p.pipelines.length).toBe(12);
  });

  it('REACHABLE on 401 / empty, OFFLINE on unreachable / throw', async () => {
    const unauth = await loadPipelineLineage({ fetchPipelines: async () => ({ ok: false, reason: 'unauthorized' }) });
    const empty = await loadPipelineLineage({ fetchPipelines: async () => ({ ok: true, data: { pipelines: [], total: 0 } }) });
    const offline = await loadPipelineLineage({ fetchPipelines: async () => ({ ok: false, reason: 'unreachable' }) });
    const threw = await loadPipelineLineage({ fetchPipelines: async () => { throw new Error('down'); } });
    expect(unauth.state).toBe('reachable');
    expect(empty.state).toBe('reachable');
    expect(offline.state).toBe('unavailable');
    expect(threw.state).toBe('unavailable');
  });
});
