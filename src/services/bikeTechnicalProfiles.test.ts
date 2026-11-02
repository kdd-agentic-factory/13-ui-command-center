import {describe,it,expect,vi} from 'vitest';
const mocks=vi.hoisted(()=>({fetch:vi.fn(),identity:{team:'team-a',generation:1}}));
vi.mock('./telemetryIdentity',()=>({telemetryFetch:mocks.fetch,identitySnapshot:()=>mocks.identity}));
import {readBikeProfile} from './bikeTechnicalProfiles';
const bike={id:'00000000-0000-4000-8000-000000000001',revision:1};
describe('bike profile transport',()=>{
 it('distinguishes missing profile from server failure',async()=>{
  mocks.fetch.mockResolvedValueOnce(new Response('null'));
  expect(await readBikeProfile(bike)).toBeNull();
  mocks.fetch.mockResolvedValueOnce(new Response('{"detail":"Unavailable"}',{status:503}));
  await expect(readBikeProfile(bike)).rejects.toThrow('Unavailable');
 });
 it('rejects cross-team payload',async()=>{
  mocks.fetch.mockResolvedValueOnce(new Response(JSON.stringify({schema_version:'1.0.0',team_id:'other',bike_reference:bike,revision:1})));
  await expect(readBikeProfile(bike)).rejects.toThrow();
 });
});
