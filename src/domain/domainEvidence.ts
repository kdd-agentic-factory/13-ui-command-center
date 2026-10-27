import type {EngineeringReference} from './engineeringSession';
export type Domain='track'|'weather'|'tires-powertrain'|'physical'|'neuro';
export type MeasuredDomain=Exclude<Domain,'physical'|'neuro'>;
export interface DomainReference extends EngineeringReference {domain:Domain;digest:string}
export interface DomainAssessment {status:'contributed'|'eligible_for_observation'|'exploratory'|'blocked';reasons:string[];missing_fields:string[];mechanical_authority:'none';external_validation:false}
export interface DomainManifest extends DomainReference {session_id:string;session_revision:number;created_at:string;classification:'restricted';assessment:DomainAssessment;inference_enabled?:false;requirements?:string[]}
export interface DomainPacket extends DomainManifest {packet?:{domain:Domain;temporal:Record<string,unknown>;source:Record<string,unknown>;quantities:DomainQuantity[]};input?:Record<string,unknown>;clock_quality?:{status:string;reasons:string[]};statistics?:{metric:string;minimum:string;maximum:string;mean:string;count:number}[]}
export interface DomainQuantity {evidence_id?:string;metric:string;value:string;unit:string;sensor_id?:string;uncertainty?:string;sector?:string;axle?:'front'|'rear';location?:'left'|'center'|'right';pressure_reference?:'gauge'|'absolute';condition?:'cold'|'hot'|'unspecified'}
export interface DomainPacketInput {schema_version:'1.0.0';domain:MeasuredDomain;session_id:string;session_revision:number;circuit:EngineeringReference;bike?:EngineeringReference;rider?:EngineeringReference;setup?:EngineeringReference;mounting_reference?:string;temporal:Record<string,unknown>;source:{kind:'manual'|'csv'|'recording';reference:string;instrument:string;calibration_reference?:string};quantities:DomainQuantity[]}
export interface DomainPage {items:DomainManifest[];next_cursor:string|null}
export const domainNames:Record<Domain,string>={track:'Pista',weather:'Clima','tires-powertrain':'Neumáticos y propulsión',physical:'Adquisición física',neuro:'Adquisición neuro'};
export const domainStatusLabel=(status:string)=>({contributed:'Aportado',eligible_for_observation:'Revisión documental para observaciones',exploratory:'Exploratorio',blocked:'Faltan datos'}[status]??'Estado no reconocido');
export const selectDomainReference=(previous:DomainReference[],reference:DomainReference)=>[...previous.filter(r=>r.domain!==reference.domain),reference].sort((a,b)=>a.domain.localeCompare(b.domain));
export const packetReference=(packet:DomainReference):DomainReference=>({domain:packet.domain,id:packet.id,revision:packet.revision,digest:packet.digest});
export const metricOptions:Record<MeasuredDomain,{id:string;label:string;units:string[];sensor:string}[]>={
 track:[{id:'sector_length_m',label:'Longitud del sector',units:['m','mm'],sensor:'track_sector_length'},{id:'bank_angle_rad',label:'Peralte',units:['deg','rad'],sensor:'track_bank_angle'},{id:'gradient_rad',label:'Pendiente longitudinal',units:['deg','rad'],sensor:'track_gradient_angle'}],
 weather:[{id:'air_temperature_k',label:'Temperatura del aire',units:['degC','K'],sensor:'air_temperature'},{id:'surface_temperature_k',label:'Temperatura del asfalto',units:['degC','K'],sensor:'track_temperature'},{id:'relative_humidity_fraction',label:'Humedad relativa',units:['%','1'],sensor:'humidity'},{id:'wind_speed_m_s',label:'Velocidad del viento',units:['m/s','km/h'],sensor:'wind_speed'}],
 'tires-powertrain':[{id:'tire_pressure_pa',label:'Presión del neumático',units:['bar','Pa','kPa'],sensor:'tire_pressure_front'},{id:'tire_temperature_k',label:'Temperatura del neumático',units:['degC','K'],sensor:'tire_temperature_front_center'}]
};
export const quantityName=(metric:string)=>Object.values(metricOptions).flat().find(m=>m.id===metric)?.label??({engine_speed_rad_s:'Régimen del motor',throttle_fraction:'Acelerador',vehicle_speed_m_s:'Velocidad'}[metric]??metric);

export interface DomainReportCoverage {partial:boolean;mechanical_authority:'none';external_validation:false;domains:{domain:Domain;state:string;reference?:DomainReference;assessment?:DomainAssessment;temporal?:Record<string,unknown>;quantities?:DomainQuantity[];requirements?:string[];inference_enabled?:false}[]}
