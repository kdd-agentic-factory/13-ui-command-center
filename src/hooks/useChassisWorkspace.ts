import {useEffect,useRef,useState,type SetStateAction} from 'react';
import type {Draft} from '../components/chassis/SetupEditor';
import {draftInput,previewIsCurrent,type PreviewOptions,type WorkshopPreview,type ComponentSpecification} from '../domain/chassisWorkshop';
import {previewWorkshop,listSpecifications} from '../services/chassisWorkshop';
import {identitySnapshot} from '../services/telemetryIdentity';
const empty=():Draft=>({values:{},assumed:{}});

export function useChassisWorkspace({bike,recordingId}:{bike:string;recordingId:string|null}){
 const [a,setA]=useState<Draft>(empty),[b,rawSetB]=useState<Draft>(empty);
 const [preview,setPreview]=useState<WorkshopPreview|null>(null),[error,setError]=useState(''),[busy,setBusy]=useState(false);
 const [specifications,setSpecifications]=useState<ComponentSpecification[]>([]),[specError,setSpecError]=useState('');
 const ticket=useRef(0);const context=JSON.stringify([bike,recordingId,identitySnapshot().generation]);
 const current=useRef(context);current.current=context;
 useEffect(()=>{ticket.current++;setPreview(null);setError('');setBusy(false);},[context]);
 useEffect(()=>{let live=true;setSpecifications([]);setSpecError('');listSpecifications().then(s=>{if(live)setSpecifications(s);}).catch(e=>{if(live)setSpecError(e.message);});return()=>{live=false;};},[context]);
 useEffect(()=>()=>{ticket.current++;},[]);
 function setB(next:SetStateAction<Draft>){ticket.current++;rawSetB(next);setPreview(null);setError('');setBusy(false);}
 async function calculate(options:PreviewOptions,referenceId?:string){
  if(!bike.trim()){setError('Identifica la moto antes de calcular.');return;}
  const request=++ticket.current;const requestedContext=context;setBusy(true);setError('');
  try{const result=await previewWorkshop({...options,draft:draftInput(b,bike,'B'),...(recordingId?{recording_id:recordingId}:{}),...(referenceId?{reference_id:referenceId}:{})});
   if(request===ticket.current&&previewIsCurrent(requestedContext,current.current))setPreview(result);
  }catch(e){if(request===ticket.current&&previewIsCurrent(requestedContext,current.current))setError(e instanceof Error?e.message:'No se pudo calcular');}
  finally{if(request===ticket.current&&previewIsCurrent(requestedContext,current.current))setBusy(false);}
 }
 function updateSpecification(spec:ComponentSpecification){if(current.current===context)setSpecifications(old=>[...old.filter(s=>s.id!==spec.id),spec]);}
 return {a,b,setA,setB,preview,error,busy,calculate,specifications,specError,updateSpecification};
}
