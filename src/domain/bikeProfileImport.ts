import type {EngineeringReference} from './engineeringSession';
import {setupFields,type MeasuredValue} from './chassisComparison';
import type {Draft} from '../components/chassis/SetupEditor';
export interface ProfileGeometryProjection {
 schema_version:'1.0.0';profile_id:string;profile_revision:number;profile_digest:string;
 bike_reference:EngineeringReference;values:Record<string,MeasuredValue>;
 sources:Record<string,unknown>;excluded:Record<string,string>;missing_geometry:string[];
}
export interface BikeProfileOrigin {profile_id:string;profile_revision:number;profile_digest:string;bike_reference:EngineeringReference;fields:string[]}
export function importProfileGeometry(draft:Draft,bike:EngineeringReference,projection:ProfileGeometryProjection):Draft{
 if(draft.importedProfile)throw new Error('El borrador ya contiene una importación de ficha');
 if(projection.schema_version!=='1.0.0'||projection.bike_reference.id!==bike.id||projection.bike_reference.revision!==bike.revision)throw new Error('La geometría pertenece a otra moto o revisión');
 const fields=Object.entries(projection.values).filter(([key])=>!draft.values[key]?.trim());
 if(!fields.length)throw new Error('No hay medidas contrastadas para completar campos vacíos');
 const next:Draft={...draft,values:{...draft.values},assumed:{...draft.assumed},originalMeasurements:{bikeId:bike.id,fields:{...(draft.originalMeasurements?.bikeId===bike.id?draft.originalMeasurements.fields:{})}}};
 for(const [key,measurement] of fields){
  const field=setupFields.find(f=>f.key===key);
  if(!['front_radius_m','rake_rad','offset_m'].includes(key)||!field||measurement.unit!==field.unit||measurement.provenance!=='measured'||measurement.value===null||!Number.isFinite(measurement.value))throw new Error('Medida de geometría incompatible');
  const display=String(measurement.value/field.factor);
  next.values[key]=display;next.assumed[key]=false;
  next.originalMeasurements!.fields[key]={display,measurement:{...measurement}};
 }
 next.importedProfile={profile_id:projection.profile_id,profile_revision:projection.profile_revision,profile_digest:projection.profile_digest,bike_reference:{...bike},fields:fields.map(([key])=>key)};
 return next;
}
