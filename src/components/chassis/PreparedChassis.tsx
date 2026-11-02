import {useEffect} from 'react';
import {useChassisWorkspace} from '../../hooks/useChassisWorkspace';
import {useWorkspaceDraft} from '../../context/WorkspaceDraftContext';
import {canWriteTelemetry} from '../../services/telemetryIdentity';
import type {WorkView} from '../../domain/chassisWorkViews';
import {ChassisWorkshop} from './workshop/ChassisWorkshop';

export function PreparedChassis({bikeId,workView}:{bikeId:string;workView:WorkView}){
 const workspace=useChassisWorkspace({bike:bikeId,recordingId:null});
 const {markDirty}=useWorkspaceDraft();
 useEffect(()=>()=>markDirty(false,'prepared-chassis'),[markDirty]);
 return <>
  <p>Borrador de preparación sin grabación. Las medidas de la ficha aún no se incorporan automáticamente. Este borrador no se guarda como setup de una salida.</p>
  <ChassisWorkshop workView={workView} draft={workspace.b} bike={bikeId} recordingId={null}
   onChange={draft=>{if(canWriteTelemetry()&&!workspace.busy){workspace.setB(draft);markDirty(true,'prepared-chassis');}}}
   onCalculate={options=>{if(canWriteTelemetry())void workspace.calculate(options);}}
   preview={workspace.preview} busy={workspace.busy} error={workspace.error}
   specifications={workspace.specifications} specError={workspace.specError} onSpecificationSaved={workspace.updateSpecification}/>
 </>;
}
