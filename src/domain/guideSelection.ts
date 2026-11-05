import type {EngineeringSession,SnapshotSelection,WorkspaceAssociation} from './engineeringSession';
import type {LabReference} from './suspensionLab';

/** Freeze only selections belonging to this session, recording and workspace. */
export function guideSelection(
 session:Pick<EngineeringSession,'id'|'revision'>|null,
 association:WorkspaceAssociation|null|undefined,
 context:string,
 lab:{context:string;reference:LabReference}|null,
 recordingId:string|null,
):SnapshotSelection|undefined{
 if(!session)return undefined;
 const base=association?.session_id===session.id&&association.session_revision===session.revision&&association.recording.id===recordingId
  ? association.selection : undefined;
 if(lab?.context!==context)return base ? structuredClone(base) : undefined;
 const selection=base??{recordings:[],comparison:null,setup_a:null,setup_b:null,binding:null,calibration:null,validation:null,environment:null};
 return structuredClone({...selection,suspension_analyses:[lab.reference]});
}
