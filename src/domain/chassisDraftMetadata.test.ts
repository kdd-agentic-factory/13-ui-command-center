import {it,expect} from 'vitest';
import {draftFromRevision,draftInput} from './chassisWorkshop';
import type {SetupRevision} from './chassisComparison';
const measurement={value:.223456789012345,unit:'m',provenance:'measured' as const,uncertainty:.0005};
const revision={id:'setup-a',bike_id:'bike-a',values:{front_radius_m:measurement}} as unknown as SetupRevision;
it('preserves original precision and uncertainty when the display was not edited',()=>{
 const draft=draftFromRevision(revision);
 expect(draftInput(draft,'bike-a','B').values.front_radius_m).toEqual(measurement);
});
it('does not reuse uncertainty after a value or provenance edit',()=>{
 const draft=draftFromRevision(revision);
 draft.values.front_radius_m='225';
 expect(draftInput(draft,'bike-a','B').values.front_radius_m).toEqual({value:.225,unit:'m',provenance:'measured'});
 const other=draftFromRevision(revision);other.assumed.front_radius_m=true;
 expect(draftInput(other,'bike-a','B').values.front_radius_m.uncertainty).toBeUndefined();
});
it('does not preserve metadata from another bike',()=>{
 expect(draftInput(draftFromRevision(revision),'bike-b','B').values.front_radius_m.uncertainty).toBeUndefined();
});
