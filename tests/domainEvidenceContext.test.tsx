import {describe,it,expect} from 'vitest';
import {selectDomainReference,domainStatusLabel} from '../src/domain/domainEvidence';

describe('domain selection stays explicit',()=>{
 it('replaces a domain revision without mutating prior selections',()=>{
  const original=[{domain:'weather' as const,id:'one',revision:1,digest:'a'.repeat(64)}];
  const next=selectDomainReference(original,{domain:'weather',id:'one',revision:2,digest:'b'.repeat(64)});
  expect(next).toHaveLength(1);expect(next[0].revision).toBe(2);expect(original[0].revision).toBe(1);
  expect(domainStatusLabel('eligible_for_observation')).toBe('Revisión documental para observaciones');
 });
});
