export const setupFields = [
  { key: 'front_radius_m', label: 'Radio delantero cargado', unit: 'm', displayUnit: 'mm', factor: .001 },
  { key: 'rake_rad', label: 'Dirección desde la vertical', unit: 'rad', displayUnit: '°', factor: Math.PI / 180 },
  { key: 'offset_m', label: 'Offset de dirección', unit: 'm', displayUnit: 'mm', factor: .001 },
  { key: 'wheelbase_m', label: 'Batalla', unit: 'm', displayUnit: 'mm', factor: .001 },
  { key: 'mass_kg', label: 'Masa con piloto y combustible', unit: 'kg', displayUnit: 'kg', factor: 1 },
  { key: 'front_weight_fraction', label: 'Reparto estático delantero', unit: '1', displayUnit: '%', factor: .01 },
  { key: 'cg_height_m', label: 'Altura del centro de gravedad', unit: 'm', displayUnit: 'mm', factor: .001 },
  { key: 'spring_rate_n_m', label: 'Constante del muelle', unit: 'N/m', displayUnit: 'N/mm', factor: 1000 },
  { key: 'preload_m', label: 'Precarga del muelle', unit: 'm', displayUnit: 'mm', factor: .001 },
  { key: 'motion_ratio', label: 'Relación local ds/dz medida', unit: '1', displayUnit: '1', factor: 1 },
  { key: 'motion_ratio_slope_per_m', label: 'Pendiente local dq/dz medida', unit: '1/m', displayUnit: '1/m', factor: 1 },
] as const;
export type SetupKey = typeof setupFields[number]['key'];
export interface MeasuredValue { value: number | null; unit: string; provenance: 'measured' | 'assumed'; uncertainty?: number | null }
export interface LinkageCurve { points: {wheel_m:number;shock_m:number}[]; provenance:'measured'|'assumed'; reference:'full_extension'; source:string }
export interface SetupInput { bike_id: string; label: string; operation_id: string; parent_id?: string | null; values: Record<string, MeasuredValue>; linkage_curve?:LinkageCurve|null;mechanical?:import('./chassisWorkshop').MechanicalSetup;component_configuration?:import('./chassisWorkshop').ComponentConfiguration;specification_refs?:import('./chassisWorkshop').SpecificationRef[] }
export interface SetupRevision extends SetupInput { id: string; version: number }
export interface PhysicsResult { metrics: Record<string, number>; missing: string[]; warnings: string[] }
export interface Evidence { id: string; kind: string; metric: string; model_version: string; channels: { name: string; original_unit: string }[]; interval_s: number[] | null; formula: string; quality: string; min?: number | null; max?: number | null; unit?: string; sample_count?: number; setup_id?: string; loads?: Record<string, { min: number; max: number }>; missing?: string[]; warnings?: string[]; transform?: Record<string, unknown>;valid_sample_count?:number;excluded_sample_count?:number;coverage_fraction?:number;curve_provenance?:string;excluded_reasons?:Record<string,number> }
export interface Finding {id:string;type:string;title:string;observation:string;next_test:string;evidence_ids:string[]}
export interface Recommendation { provider: string; observations: string[]; calculations: string[]; hypotheses: string[]; references: string[]; missing: string[]; next_test: string; limitations: string[];findings?:Finding[];inference?:{status:string;model?:string} }
export interface ComparisonRun { id: string; session_id: string; model_version: string; setup_a_id: string; setup_b_id: string; setup_a?: SetupRevision; setup_b?: SetupRevision; calibration?: Calibration | null; interval_s?: [number, number] | null; signal_error?: string; a: PhysicsResult; b: PhysicsResult; deltas: Record<string, number>; missing: string[]; warnings: string[]; evidence: Evidence[]; recommendation: Recommendation }
export interface Calibration { channel_index: number; quantity: 'longitudinal_acceleration' | 'suspension_displacement'; scale: number; zero: number; sign: 1 | -1; provenance: string; measurement_location?: 'shock' | 'fork' | 'wheel' | 'unknown'; derivative_window?: number; max_gap_s?: number; displacement_reference?:'full_extension'|'unknown' }
export const metricLabels: Record<string, string> = { trail_m: 'Avance en el suelo', normal_trail_m: 'Avance normal', wheelbase_m: 'Batalla', longitudinal_acceleration: 'Aceleración longitudinal', suspension_displacement: 'Desplazamiento de suspensión', quasistatic_load_envelope: 'Cargas cuasiestáticas', spring_response_envelope: 'Respuesta del muelle', filtered_suspension_velocity: 'Velocidad de suspensión filtrada',progressive_spring_envelope:'Suspensión progresiva' };
export function fieldLabel(key: string) { return setupFields.find(f => f.key === key)?.label.toLowerCase() ?? key; }
