import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import type { CatalogKind, CatalogRevision, EngineeringSession, EngineeringSessionInput, WorkspaceAssociation } from '../domain/engineeringSession';
import { activeRecording } from '../domain/recordedSession';
import { telemetryScope } from '../services/telemetryIdentity';
import * as api from '../services/engineeringSession';
import { useWorkspaceDraft } from './WorkspaceDraftContext';

const kinds:CatalogKind[]=['circuit','bike','rider'];
type Catalog = Record<CatalogKind,CatalogRevision[]>;
type CreateAttempt = { fingerprint:string; operation_id:string };
const blankCatalog=():Catalog=>({circuit:[],bike:[],rider:[]});
interface SessionContext {
  scope:string; workspaceEpoch:number; session:EngineeringSession|null; sessions:EngineeringSession[]; catalog:Catalog; historical:Partial<Record<CatalogKind,CatalogRevision>>;
  loading:boolean; busy:boolean; error:string; conflict:boolean; sessionCursor:string|null; catalogCursors:Record<CatalogKind,string|null>;
  association:WorkspaceAssociation|null; bridgeLoading:boolean;
  choose:(id:string|null)=>void; reload:()=>void; loadMoreSessions:()=>Promise<void>; loadMoreCatalog:(kind:CatalogKind)=>Promise<void>;
  save:(body:EngineeringSessionInput)=>Promise<EngineeringSession|null>; createCatalog:(kind:CatalogKind,name:string)=>Promise<CatalogRevision|null>;
  associateWorkspace:(recordingId:string)=>Promise<void>; clearAssociation:()=>void; workspaceChanged:()=>void;
}
const Context=createContext<SessionContext|null>(null);
const selectedKey=(scope:string)=>`kdd-engineering-session:${scope}`;
const associationKey=(scope:string,id:string,revision:number)=>`kdd-engineering-selection:${scope}:${id}:${revision}`;
const message=(error:unknown)=>error instanceof Error?error.message:'No se pudo preparar la sesión';
export function EngineeringSessionProvider({children}:{children:ReactNode}) {
  const {requestLeave}=useWorkspaceDraft();
  const [scope,setScope]=useState(telemetryScope),[session,setSession]=useState<EngineeringSession|null>(null),[sessions,setSessions]=useState<EngineeringSession[]>([]),[catalog,setCatalog]=useState<Catalog>(blankCatalog),[historical,setHistorical]=useState<SessionContext['historical']>({});
  const [loading,setLoading]=useState(true),[busy,setBusy]=useState(false),[error,setError]=useState(''),[conflict,setConflict]=useState(false),[association,setAssociation]=useState<WorkspaceAssociation|null>(null),[bridgeLoading,setBridgeLoading]=useState(false);
  const [workspaceEpoch,setWorkspaceEpoch]=useState(0);
  const [sessionCursor,setSessionCursor]=useState<string|null>(null),[catalogCursors,setCatalogCursors]=useState<Record<CatalogKind,string|null>>({circuit:null,bike:null,rider:null});
  const epoch=useRef(0),selectionEpoch=useRef(0),sourceEpoch=useRef(0),current=useRef<EngineeringSession|null>(null),controllers=useRef(new Set<AbortController>()),bridgeController=useRef<AbortController|null>(null);
  const selectionControllers=useRef(new Set<AbortController>());
  const createAttempt=useRef<CreateAttempt|null>(null),catalogAttempts=useRef(new Map<CatalogKind,CreateAttempt>());
  const pendingSave=useRef<Promise<EngineeringSession|null>|null>(null),pendingCatalog=useRef(new Map<CatalogKind,Promise<CatalogRevision|null>>());
  const controller=()=>{const c=new AbortController();controllers.current.add(c);return c;};
  const selectedController=()=>{const c=controller();selectionControllers.current.add(c);return c;};
  const release=(c:AbortController)=>{controllers.current.delete(c);selectionControllers.current.delete(c);};
  const report=(e:unknown)=>{setError(message(e));setConflict(e instanceof api.EngineeringRequestError&&e.status===409);};
  const setCurrent=(value:EngineeringSession|null)=>{current.current=value;setSession(value);};
  const clearAssociation=useCallback(()=>{sourceEpoch.current++;bridgeController.current?.abort();setBridgeLoading(false);setAssociation(null);const value=current.current;if(value)localStorage.removeItem(associationKey(telemetryScope(),value.id,value.revision));},[]);
  const workspaceChanged=useCallback(()=>clearAssociation(),[clearAssociation]);
  async function open(id:string|null, restore=false) {
    const token=++selectionEpoch.current,g=epoch.current;selectionControllers.current.forEach(c=>c.abort());selectionControllers.current.clear();const c=selectedController();
    sourceEpoch.current++;bridgeController.current?.abort();setWorkspaceEpoch(old=>old+1);
    createAttempt.current=null;catalogAttempts.current.clear();pendingSave.current=null;pendingCatalog.current.clear();
    setCurrent(null);setHistorical({});setAssociation(null);setError('');setConflict(false);setBusy(false);setBridgeLoading(false);
    if(!id){release(c);setLoading(false);localStorage.removeItem(selectedKey(telemetryScope()));return;}
    setLoading(true);
    try {
      const value=await api.getEngineeringSession(id,c.signal);
      const refs=await Promise.all(kinds.map(async kind=>[kind,value[kind]?await api.getCatalogEntity(kind,value[kind]!,c.signal):null] as const));
      if(epoch.current!==g||selectionEpoch.current!==token)return;
      setCurrent(value);setHistorical(Object.fromEntries(refs.filter(([,item])=>item)));localStorage.setItem(selectedKey(telemetryScope()),value.id);
      const saved=localStorage.getItem(associationKey(telemetryScope(),value.id,value.revision));
      if(saved){
        const source=sourceEpoch.current;
        const stored=JSON.parse(saved) as WorkspaceAssociation;
        if(activeRecording()!==stored.recording.id){setError('Chassis tiene otra grabación abierta. Asocia explícitamente su fuente y setup actuales.');return;}
        const fresh=await api.readWorkspaceAssociation(value,stored.recording.id,c.signal);
        if(epoch.current!==g||selectionEpoch.current!==token||sourceEpoch.current!==source)return;
        if(stored.session_id===value.id&&stored.session_revision===value.revision&&stored.recording.sha256===fresh.recording.sha256&&JSON.stringify(stored.selection)===JSON.stringify(fresh.selection))setAssociation(fresh);
        else setError('La asociación guardada ha cambiado. Asocia de nuevo la grabación y el setup actuales.');
      }
    }catch(e){if(epoch.current===g&&selectionEpoch.current===token&&!c.signal.aborted){report(e);if(restore)localStorage.removeItem(selectedKey(telemetryScope()));}}
    finally{release(c);if(epoch.current===g&&selectionEpoch.current===token)setLoading(false);}
  }
  async function refresh(restore:boolean) {
    const g=epoch.current,c=controller();setLoading(true);setError('');
    try {
      const [list,...pages]=await Promise.all([api.listEngineeringSessions({signal:c.signal}),...kinds.map(kind=>api.listCatalog(kind,{signal:c.signal}))]);
      if(epoch.current!==g)return;
      setSessions(list.items as EngineeringSession[]);setSessionCursor(list.next_cursor);
      setCatalog(Object.fromEntries(kinds.map((kind,i)=>[kind,pages[i].items])) as Catalog);
      setCatalogCursors(Object.fromEntries(kinds.map((kind,i)=>[kind,pages[i].next_cursor])) as Record<CatalogKind,string|null>);
      const id=restore?localStorage.getItem(selectedKey(telemetryScope())):null;
      if(id)await open(id,true);
    }catch(e){if(epoch.current===g&&!c.signal.aborted)report(e);}
    finally{controllers.current.delete(c);if(epoch.current===g)setLoading(false);}
  }
  useEffect(()=>{
    const reset=()=>{epoch.current++;selectionEpoch.current++;sourceEpoch.current++;controllers.current.forEach(c=>c.abort());controllers.current.clear();current.current=null;setSession(null);setSessions([]);setCatalog(blankCatalog());setHistorical({});setAssociation(null);setBusy(false);setBridgeLoading(false);setConflict(false);createAttempt.current=null;catalogAttempts.current.clear();pendingSave.current=null;pendingCatalog.current.clear();setScope(telemetryScope());void refresh(false);};
    const recordingChanged=()=>clearAssociation();
    window.addEventListener('telemetry-scope-changed',reset);window.addEventListener('recorded-session-changed',recordingChanged);
    void refresh(true);
    return()=>{epoch.current++;controllers.current.forEach(c=>c.abort());window.removeEventListener('telemetry-scope-changed',reset);window.removeEventListener('recorded-session-changed',recordingChanged);};
  },[clearAssociation]);
  const choose=(id:string|null)=>requestLeave(()=>void open(id));
  function save(body:EngineeringSessionInput) {
    if(pendingSave.current)return pendingSave.current;
    const operation=performSave(body);pendingSave.current=operation;
    void operation.finally(()=>{if(pendingSave.current===operation)pendingSave.current=null;});
    return operation;
  }
  async function performSave(body:EngineeringSessionInput) {
    const g=epoch.current,s=selectionEpoch.current,value=current.current,c=selectedController();setBusy(true);setError('');setConflict(false);
    try {
      const fingerprint=JSON.stringify(body);
      if(!value&&createAttempt.current?.fingerprint!==fingerprint)createAttempt.current={fingerprint,operation_id:crypto.randomUUID()};
      const saved=value?await api.reviseEngineeringSession(value.id,body,value.revision,c.signal):await api.createEngineeringSession(body,createAttempt.current!.operation_id,c.signal);
      if(epoch.current!==g||selectionEpoch.current!==s)return null;
      createAttempt.current=null;clearAssociation();setCurrent(saved);setSessions(old=>[saved,...old.filter(item=>item.id!==saved.id)]);localStorage.setItem(selectedKey(telemetryScope()),saved.id);return saved;
    }catch(e){if(epoch.current===g&&selectionEpoch.current===s&&!c.signal.aborted)report(e);return null;}
    finally{release(c);if(epoch.current===g&&selectionEpoch.current===s)setBusy(false);}
  }
  function createCatalog(kind:CatalogKind,name:string) {
    const pending=pendingCatalog.current.get(kind);if(pending)return pending;
    const operation=performCreateCatalog(kind,name);pendingCatalog.current.set(kind,operation);
    void operation.finally(()=>{if(pendingCatalog.current.get(kind)===operation)pendingCatalog.current.delete(kind);});
    return operation;
  }
  async function performCreateCatalog(kind:CatalogKind,name:string) {
    const g=epoch.current,s=selectionEpoch.current,c=selectedController();setBusy(true);setError('');
    try {
      const body={name:name.trim(),notes:''},fingerprint=JSON.stringify(body);
      if(catalogAttempts.current.get(kind)?.fingerprint!==fingerprint)catalogAttempts.current.set(kind,{fingerprint,operation_id:crypto.randomUUID()});
      const saved=await api.saveCatalogEntity(kind,body,{operation_id:catalogAttempts.current.get(kind)!.operation_id},c.signal);
      if(epoch.current!==g||selectionEpoch.current!==s)return null;
      catalogAttempts.current.delete(kind);setCatalog(old=>({...old,[kind]:[...old[kind].filter(item=>item.id!==saved.id),saved]}));return saved;
    }catch(e){if(epoch.current===g&&selectionEpoch.current===s&&!c.signal.aborted)report(e);return null;}
    finally{release(c);if(epoch.current===g&&selectionEpoch.current===s)setBusy(false);}
  }
  async function loadMore(kind?:CatalogKind) {
    const cursor=kind?catalogCursors[kind]:sessionCursor;if(!cursor)return;const g=epoch.current,c=controller();setBusy(true);
    try {
      if(kind){const page=await api.listCatalog(kind,{cursor,signal:c.signal});if(g!==epoch.current)return;setCatalog(old=>({...old,[kind]:[...old[kind],...page.items.filter(item=>!old[kind].some(previous=>previous.id===item.id))]}));setCatalogCursors(old=>({...old,[kind]:page.next_cursor}));}
      else{const page=await api.listEngineeringSessions({cursor,signal:c.signal});if(g!==epoch.current)return;setSessions(old=>[...old,...page.items.filter(item=>!old.some(previous=>previous.id===item.id))]);setSessionCursor(page.next_cursor);}
    }catch(e){if(g===epoch.current&&!c.signal.aborted)report(e);}finally{controllers.current.delete(c);if(g===epoch.current)setBusy(false);}
  }
  async function associateWorkspace(recordingId:string) {
    const value=current.current;if(!value)return;const g=epoch.current,s=selectionEpoch.current,source=++sourceEpoch.current,c=selectedController();bridgeController.current?.abort();bridgeController.current=c;setBridgeLoading(true);setError('');
    try {
      const fresh=await api.readWorkspaceAssociation(value,recordingId,c.signal);
      if(epoch.current!==g||selectionEpoch.current!==s||sourceEpoch.current!==source||activeRecording()!==recordingId)return;
      setAssociation(fresh);localStorage.setItem(associationKey(telemetryScope(),value.id,value.revision),JSON.stringify(fresh));
    }catch(e){if(epoch.current===g&&selectionEpoch.current===s&&sourceEpoch.current===source&&!c.signal.aborted)report(e);}
    finally{release(c);if(epoch.current===g&&selectionEpoch.current===s&&sourceEpoch.current===source)setBridgeLoading(false);}
  }
  return <Context.Provider value={{scope,workspaceEpoch,session,sessions,catalog,historical,loading,busy,error,conflict,sessionCursor,catalogCursors,association,bridgeLoading,choose,reload:()=>requestLeave(()=>{const id=current.current?.id??null;void open(id).then(()=>{if(!id)void refresh(false);});}),loadMoreSessions:()=>loadMore(),loadMoreCatalog:kind=>loadMore(kind),save,createCatalog,associateWorkspace,clearAssociation,workspaceChanged}}>{children}</Context.Provider>;
}
export function useEngineeringSession(){const context=useContext(Context);if(!context)throw new Error('EngineeringSessionProvider requerido');return context;}
