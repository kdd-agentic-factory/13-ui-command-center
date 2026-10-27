export type CatalogKind = 'circuit' | 'bike' | 'rider';
export interface EngineeringReference { id: string; revision: number }
export interface CatalogInput { name: string; notes: string }
export interface CatalogRevision extends CatalogInput, EngineeringReference {
  schema_version: '1.0.0'; kind: CatalogKind; retired: boolean;
  team_id: string | null; created_by: string | null; created_at: string;
}
export const sessionTypes = { stint: 'Stint', warm_up: 'Warm-up', practice: 'Práctica', qualifying: 'Clasificación', test: 'Test', race: 'Carrera', other: 'Otro' } as const;
export interface EngineeringSessionInput {
  name: string; session_type: keyof typeof sessionTypes; other_label: string | null;
  provenance: 'live' | 'recorded' | 'sample' | 'synthetic';
  circuit: EngineeringReference | null; bike: EngineeringReference | null; rider: EngineeringReference | null; notes: string;
}
export interface EngineeringSession extends EngineeringSessionInput, EngineeringReference {
  schema_version: '1.0.0'; team_id: string | null; created_by: string | null; created_at: string;
}
export interface EngineeringPage<T> { items: T[]; next_cursor: string | null }
export interface RecordingSelection { id: string; geometry_revision: string | null; interval_s: [string, string] | null }
/** Exact human snapshot selection wire shape. No client hashes are treated as authority. */
export interface SnapshotSelection {
  domain_contexts?: {domain:'track'|'weather'|'tires-powertrain'|'physical'|'neuro';id:string;revision:number;digest:string}[]; suspension_analyses?:{id:string;revision:number;digest:string}[];
  recordings: RecordingSelection[]; comparison: EngineeringReference | null;
  setup_a: EngineeringReference | null; setup_b: EngineeringReference | null;
  binding: EngineeringReference | null; calibration: EngineeringReference | null;
  validation: EngineeringReference | null; environment: EngineeringReference | null;
}
export interface WorkspaceAssociation {
  session_id: string; session_revision: number;
  recording: { id: string; filename: string; sha256: string; geometry_revision: string | null };
  selection: SnapshotSelection;
}
export const emptySession = (): EngineeringSessionInput => ({ name: '', session_type: 'practice', other_label: null, provenance: 'recorded', circuit: null, bike: null, rider: null, notes: '' });
export function sessionInput(session: EngineeringSession): EngineeringSessionInput {
  const { name, session_type, other_label, provenance, circuit, bike, rider, notes } = session;
  return { name, session_type, other_label, provenance, circuit, bike, rider, notes };
}
export const referenceValue = (ref: EngineeringReference | null) => ref ? `${ref.id}:${ref.revision}` : '';

export type AnalysisTaskState='queued'|'running'|'succeeded'|'blocked_missing_inputs'|'unavailable'|'failed'|'timed_out'|'cancelled';
export type AnalysisRunState='running'|'sealed'|'cancelled'|'failed';
export interface AnalysisTask { task_id:string; branch:string; agent_id:string; status:AnalysisTaskState; cause:string|null; result_hash:string|null }
export interface AnalysisRun { run_id:string;session_id:string;snapshot_id:string;snapshot_digest:string;workflow_id:string;status:AnalysisRunState;review_mode:'blind_review'|'informed_review';created_at:number;deadline:number;model_calls:number;revealed:boolean;tasks:AnalysisTask[] }
export interface AnalysisSnapshot extends EngineeringReference { schema_version:'1.0.0'|'1.1.0'|'1.2.0';session_id:string;session_revision:number;team_id:string|null;created_at:string;snapshot_digest:string;selection:SnapshotSelection;analyzable:boolean;blocked_reasons:string[];evidence:Record<string,unknown> }
export interface MeasurementReference { evidence_id:string;metric:string;measurement:string;unit:string }
export interface InputRequest {
  source:'comparison'|'setup_a'|'setup_b'|'domain';
  field:'interval_s'|'calibration'|'linkage_curve'|'values_si'|'track_context'|'weather_context'|'tires_powertrain_context';
  parameter?:'front_radius_m'|'rake_rad'|'offset_m'|'wheelbase_m'|'mass_kg'|'front_weight_fraction'|'cg_height_m'|'spring_rate_n_m'|'preload_m'|'motion_ratio'|'motion_ratio_slope_per_m'|'observation_attestation'|'source_calibration'|'eligible_original_clock'|'source_validation'|null;
  reason:'absent'|'unmeasured'|'incompatible'|'domain_unrepresentable';
  blocks:'geometry_review'|'suspension_replay'|'physical_setup_change'|'domain_review';
}
export interface InputRequestDiagnostic {request:InputRequest;observed_state:'absent'|'present'|'unmeasured'|'measured'|'incompatible'|'unrepresented'|'unknown'}
export interface SpecialistPosition { agent_id:string;result_hash:string;available:boolean;status:string;assumptions:string[];missing_inputs:string[];requested_inputs?:InputRequest[]|null;request_diagnostics?:InputRequestDiagnostic[]|null;limitations:string[];proposed_tests:string[];hypotheses:string[];evidence_ids:string[];measurement_refs:MeasurementReference[];hypotheses_with_references:{code:string;references:MeasurementReference[]}[];alternatives_with_references:{code:string;references:MeasurementReference[]}[] }
export interface SectionSummary { section_id:'motorcycle'|'circuit'|'rider';leader_id:string;leader_role:'deterministic_section_aggregator';available_agents:string[];missing_agents:string[];hypothesis_differences:string[];positions:SpecialistPosition[];consensus:'not_established';external_validation:false }
export interface ConflictMatrix { conflicts:{code:string;topic:string;sources:string[]}[];missing_reviewers:string[];review_evidence:Record<string,string[]>;consensus:'not_established';independence:'process_independent_same_model'|'informed_review'|'unavailable';external_validation:false;object_reviews:{candidate_id:string;setup_id:string;parameter:string;reviewer_id:string;classification:string;basis:string;result_hash:string|null;references:MeasurementReference[]}[] }
export interface ProposalParameter { setup_id:string;revision:number;parameter:string;value_si:string;unit:string;support:MeasurementReference[] }
export interface ProposalItem { candidate_id:string;kind:'measurement'|'controlled_test'|'setup_change';code:string;evidence_ids:string[];parameters:ProposalParameter[];reason:string;evaluation:{criterion:string;description:string;conditions:string[];measurements:MeasurementReference[];baseline:EngineeringReference|null;alternative:EngineeringReference|null;limits:string[];counterarguments:string[]} }
export interface FinalProposal { schema_version:'2.0.0';run_id:string;snapshot_digest:string;revision:number;section_summaries:SectionSummary[];matrix:ConflictMatrix;items:ProposalItem[];result_hashes:string[];model_metadata:{name:string;digest:string|null;runtime:'ollama';external_validation:false}|null;source_status:string[];limitations:string[];resolution:{expected_revision:number;note:string;evidence_ids:string[]}|null }
export interface ProposalEligibility {inputs_valid:boolean;branches_sealed:boolean;independence_checked:boolean;conflicts_resolved:boolean;domain_valid:boolean;source_valid:boolean;blocked_reasons:{code:string;message:string}[]}
export interface StoredProposal { authority_proposal_id:string;generation:number;proposal_id:string;proposal_digest:string;proposal:FinalProposal;eligibility:ProposalEligibility;publication_status:string;approvable:false }
export interface ReferenceSummary {provenance:'deterministic_reference_summary';section_summaries:SectionSummary[];matrix:ConflictMatrix;source_status:string[];limitations:string[];result_hashes:string[]}
export interface SynthesisProgress {status:string;cause:string|null;proposal_id:string|null;operation_id:string|null;publication_status:string|null;report:ReferenceSummary|null}
export interface CurrentValidity {schema_version:'1.0.0';proposal_id:string;proposal_revision:number;authority_proposal_id:string;generation:number;current:boolean;approvable:boolean;rejectable:boolean;revision_requestable:boolean;approved_current:boolean;authority_available:boolean;designation_revision:number|null;primary_id:string|null;substitute_id:string|null;decision_id:string|null;decision_action:string|null;reasons:string[]}
export interface CrewDesignation {team_id:string;primary_id:string|null;substitute_id:string|null;revision:number}
export interface DesignationCandidate {user_id:string;role:'engineer'|'admin'}
export type DecisionAction='approve'|'reject'|'request_revision';
export interface DecisionInput {expected_session_revision:number;expected_proposal_revision:number;expected_designation_revision:number;proposal_digest:string;snapshot_digest:string;action:DecisionAction;note:string}
export interface ApplicationInput extends Omit<DecisionInput,'action'> {setup:EngineeringReference;mounted_at:string}
export interface ValidationInput {expected_designation_revision:number;evidence_snapshot_id:string;evidence_ids:string[];validated_at:string;outcome:'supported'|'not_supported'|'inconclusive';note:string}
export interface HumanEvent {schema_version:'1.0.0';id:string;kind:'decision'|'application'|'validation';action:DecisionAction|null;actor_id:string;designation_revision:number;created_at:string;generation:number;authority_proposal_id:string;proposal_digest:string;snapshot_digest:string;parent_event_id:string|null;payload:Record<string,unknown>;proposal_id:string;proposal_revision:number;session_id:string;operation_id:string}
export interface HumanEventsPage extends EngineeringPage<HumanEvent> {recovery_unavailable:boolean}
export interface EngineeringReport {schema_version:'1.0.0'|'1.1.0';domain_coverage?:import('./domainEvidence').DomainReportCoverage;id:string;session_id:string;session_revision:number;created_at:string;context:Record<string,unknown>;snapshot:Record<string,unknown>|null;run:AnalysisRun|null;branches:Record<string,unknown>[];synthesis:SynthesisProgress|null;proposal:StoredProposal|null;human_events:HumanEvent[];current_validity:CurrentValidity|null;limitations:string[];content_digest:string}

export type DecisionMode='reference_review'|'input_triage'|'blocked';
export type ModelDecision=
 | {kind:'review_supported';references:MeasurementReference[];hypotheses?:{label?:'hypothesis';code:'measurement_artifact'|'setup_difference'|'unresolved_mechanism';references:MeasurementReference[]}[];alternatives?:{label?:'hypothesis';code:'measurement_artifact'|'setup_difference'|'unresolved_mechanism';references:MeasurementReference[]}[];assumptions?:('frozen_snapshot_only'|'no_causal_inference')[];limitations?:string[]}
 | {kind:'request_input';request_id:string;references?:MeasurementReference[];limitations?:string[]}
 | {kind:'abstain';reason:'insufficient_evidence'|'model_capability_limit'|'context_not_representable';references?:MeasurementReference[];limitations?:string[]};
export interface SpecialistPosition {model_decision?:ModelDecision|null;decision_context_digest?:string|null;decision_mode?:DecisionMode|null;decision_error?:{phase:string;cause:string;response_sha256?:string|null}|null}
