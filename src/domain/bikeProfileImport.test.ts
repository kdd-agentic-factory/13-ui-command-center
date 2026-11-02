import {it,expect} from 'vitest';
import {importProfileGeometry} from './bikeProfileImport';
import {draftInput} from './chassisWorkshop';
const bike={id:'00000000-0000-4000-8000-000000000001',revision:1};
const projection={schema_version:'1.0.0' as const,profile_id:'00000000-0000-4000-8000-000000000002',profile_revision:1,profile_digest:'a'.repeat(64),bike_reference:bike,values:{front_radius_m:{value:.22,unit:'m',provenance:'measured' as const,uncertainty:.001}},sources:{},excluded:{},missing_geometry:['rake_rad','offset_m']};
it('imports only empty fields and retains exact uncertainty through draft serialization',()=>{
 const initial={values:{offset_m:'30'},assumed:{}};
 const next=importProfileGeometry(initial,bike,projection);
 expect(next.values.front_radius_m).toBe('220');expect(next.values.offset_m).toBe('30');
 expect(initial.values).toEqual({offset_m:'30'});
 expect(draftInput(next,bike.id,'B').values.front_radius_m).toEqual(projection.values.front_radius_m);
 expect(draftInput(next,bike.id,'B').bike_profile_origin?.profile_digest).toBe(projection.profile_digest);
 next.values.front_radius_m='225';
 expect(draftInput(next,bike.id,'B').bike_profile_origin).toBeUndefined();
});
it('never overwrites existing values or imports another bike',()=>{
 expect(()=>importProfileGeometry({values:{front_radius_m:'225'},assumed:{}},bike,projection)).toThrow();
 expect(()=>importProfileGeometry({values:{},assumed:{}},{...bike,revision:2},projection)).toThrow();
});
