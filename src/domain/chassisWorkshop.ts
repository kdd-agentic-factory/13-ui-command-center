import {setupFields, type MeasuredValue, type SetupInput, type SetupRevision, type PhysicsResult} from './chassisComparison';
import type {Draft} from '../components/chassis/SetupEditor';

export type PartId='fork_cap'|'fork_outer'|'fork_spring'|'fork_cartridge'|'rear_shock'|'rear_spring'|'rear_linkage'|'swingarm_pivot'|'rear_drive';
export type PointId='swingarm_pivot'|'steer_reference'|'front_sprocket'|'cog';
export interface MechanicalSetup {schema_version:'1.0.0';frame:'body_x_forward_z_up';points:Partial<Record<PointId,{x:MeasuredValue;z:MeasuredValue}>>;rear_radius_m?:MeasuredValue|null;swingarm_length_m?:MeasuredValue|null;swingarm_angle_rad?:MeasuredValue|null;steer_axis_body_rad?:MeasuredValue|null;fork_length_m?:MeasuredValue|null;fork_compression_m?:MeasuredValue|null;chain_pitch_m?:MeasuredValue|null;front_teeth?:number|null;rear_teeth?:number|null}
export type SettingKey='front_preload_m'|'front_air_gap_m'|'front_spring_rate_n_m'|'front_compression_clicks'|'front_rebound_clicks'|'rear_preload_m'|'rear_spring_rate_n_m'|'rear_lsc_clicks'|'rear_hsc_clicks'|'rear_rebound_clicks';
export interface ShimLayer {outer_m:number;inner_m:number;thickness_m:number;count:number}
export interface ComponentConfiguration {settings:Partial<Record<SettingKey,number>>;shim_stack:ShimLayer[];source:string;models?:Partial<Record<PartId,string>>}
export interface SpecificationRef {id:string;revision:number;digest:string}
export interface ComponentSpecification extends SpecificationRef {schema_version:'1.0.0';component:PartId;model_reference:string;operation:string;source:string;page:string;tool:string;torque_nm:number|null;setting:SettingKey|ActuatorKey|null;minimum:number|null;maximum:number|null;step:number|null;unit:'m'|'rad'|'N/m'|'clicks'|null;zero_reference:string;conditions:string;status:'contributed'|'verified';verified_by:string|null}
export interface PoseResult {model_version:string;status:string;points:Record<string,[number,number]>;segments:Record<string,[[number,number],[number,number]]>;metrics:Record<string,number>;missing:string[];warnings:string[];assumptions:string[]}
export interface WorkshopPreview {schema_version:'1.0.0';model_version:string;input_digest:string;mode:PreviewMode;static:PhysicsResult;pose:PoseResult;chain:{metrics:Record<string,number>;points:Record<string,[number,number]>;segments:Record<string,[[number,number],[number,number]]>;missing:string[];warnings:string[];anti_squat_status:string;anti_squat_reason:string};signals:{channel_index:number;time_s:number;value:number;unit:string;quantity:string;measurement_location:string}[];warnings:string[];dynamic_pose:{status:string;reason:string};loads?:PhysicsResult;spring_curve:Record<string,number>[];spring_curve_provenance?:string;source_status?:string}
export type PreviewMode='static'|'recorded'|'quasistatic_scenario';
export type ActuatorKey='fork_length_m'|'fork_compression_m'|'swingarm_angle_rad'|'steer_axis_body_rad'|'offset_m';
export interface PreviewOptions {mode:PreviewMode;acceleration_g?:number;at_s?:number;calibrations?:import('./chassisComparison').Calibration[]}
export const emptyMechanical=():MechanicalSetup=>({schema_version:'1.0.0',frame:'body_x_forward_z_up',points:{}});
export const emptyConfiguration=():ComponentConfiguration=>({settings:{},shim_stack:[],source:''});
export function draftInput(draft:Draft,bike:string,label:string,parent?:string,operation='preview'):SetupInput {
 const values=Object.fromEntries(setupFields.map(f=>[f.key,{value:draft.values[f.key]?.trim()?Number(draft.values[f.key])*f.factor:null,unit:f.unit,provenance:draft.assumed[f.key]?'assumed' as const:'measured' as const}]));
 return {bike_id:bike.trim(),label,operation_id:operation,parent_id:parent??null,values,linkage_curve:draft.curveEnabled===false?null:draft.curve??null,
  ...(draft.mechanical?{mechanical:draft.mechanical}:{}),...(draft.configuration?{component_configuration:draft.configuration}:{}),...(draft.specificationRefs?{specification_refs:draft.specificationRefs}:{})};
}
export function draftFromRevision(setup?:SetupRevision):Draft {
 if(!setup)return {values:{},assumed:{}};
 return {values:Object.fromEntries(setupFields.map(f=>[f.key,setup.values[f.key]?.value==null||setup.values[f.key]?.unit!==f.unit?'':String(Number((Number(setup.values[f.key].value)/f.factor).toPrecision(12)))])),assumed:Object.fromEntries(setupFields.map(f=>[f.key,setup.values[f.key]?.provenance==='assumed'])),curve:setup.linkage_curve??null,
  ...(setup.mechanical?{mechanical:structuredClone(setup.mechanical)}:{}),...(setup.component_configuration?{configuration:structuredClone(setup.component_configuration)}:{}),...(setup.specification_refs?{specificationRefs:structuredClone(setup.specification_refs)}:{})};
}
export const previewIsCurrent=(requested:string,current:string)=>requested===current;
