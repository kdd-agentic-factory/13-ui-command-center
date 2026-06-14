/**
 * Setup Lab version control — locks the git-of-the-setup contract: diff
 * between versions, commit, validate and revert.
 */
import { describe, it, expect, afterEach } from 'vitest';
import {
  getVersions, diffVersions, commitVersion, validateVersion, revertVersion,
  getVersion, _resetSetupLab,
} from '../src/domain/setupLab';

afterEach(() => _resetSetupLab());

describe('setup version control', () => {
  it('seeds a baseline + stint progression with parents', () => {
    const vs = getVersions();
    expect(vs[0].status).toBe('baseline');
    expect(vs[0].parentId).toBeNull();
    expect(vs.find(v => v.id === 'v2')!.parentId).toBe('v0');
    expect(vs.find(v => v.id === 'v3')!.source).toBe('oracle');
  });

  it('diffs only the changed parameters between versions', () => {
    const d = diffVersions('v0', 'v2'); // baseline → TC + rebound
    const keys = d.map(x => x.key).sort();
    expect(keys).toEqual(['rearReb', 'tc']);
    expect(d.find(x => x.key === 'tc')!.from).toBe(4);
    expect(d.find(x => x.key === 'tc')!.to).toBe(5);
  });

  it('commit creates a pending head; validate promotes it', () => {
    const before = getVersions().length;
    const v = commitVersion('v2', 'Test commit', getVersion('v2')!.params, 'because');
    expect(getVersions().length).toBe(before + 1);
    expect(v.status).toBe('pending');
    validateVersion(v.id, 'works');
    expect(getVersion(v.id)!.status).toBe('validated');
    expect(getVersion(v.id)!.result).toBe('works');
  });

  it('revert marks the version reverted and re-commits the parent params', () => {
    const head = revertVersion('v2'); // parent v0
    expect(getVersion('v2')!.status).toBe('reverted');
    expect(head).not.toBeNull();
    expect(head!.params.tc).toBe(getVersion('v0')!.params.tc);
  });
});
