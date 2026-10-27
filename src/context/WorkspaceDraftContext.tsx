import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
const Context=createContext({isDirty:false,dirtyOwners:[] as string[],markDirty:(_value:boolean,_owner?:string)=>{},requestLeave:(action:()=>void)=>action()});
export function WorkspaceDraftProvider({children}:{children:ReactNode}){
  const [drafts,setDrafts]=useState<Record<string,boolean>>({}),[pending,setPending]=useState<(()=>void)|null>(null);const dialog=useRef<HTMLDivElement>(null);const previous=useRef<HTMLElement|null>(null);
  const isDirty=Object.values(drafts).some(Boolean);
  const dirtyOwners=Object.keys(drafts).filter(owner=>drafts[owner]);
  const markDirty=useCallback((value:boolean,owner='workspace')=>setDrafts(old=>old[owner]===value?old:{...old,[owner]:value}),[]);
  const requestLeave=useCallback((action:()=>void)=>{if(isDirty){previous.current=document.activeElement as HTMLElement;setPending(()=>action);}else action();},[isDirty]);
  const cancel=()=>{setPending(null);previous.current?.focus();};
  useEffect(()=>{const reset=()=>{setDrafts({});setPending(null);};window.addEventListener('telemetry-scope-changed',reset);return()=>window.removeEventListener('telemetry-scope-changed',reset);},[]);
  useEffect(()=>{if(!isDirty)return;const guard=(event:BeforeUnloadEvent)=>{event.preventDefault();event.returnValue='';};window.addEventListener('beforeunload',guard);return()=>window.removeEventListener('beforeunload',guard);},[isDirty]);
  useEffect(()=>{if(pending)dialog.current?.querySelector<HTMLButtonElement>('button')?.focus();},[pending]);
  return <Context.Provider value={{isDirty,dirtyOwners,markDirty,requestLeave}}>{children}{pending&&<div className="workspace-draft-backdrop"><div ref={dialog} className="workspace-draft-dialog" role="alertdialog" aria-modal="true" aria-labelledby="draft-title" aria-describedby="draft-description" onKeyDown={event=>{if(event.key==='Escape'){event.preventDefault();cancel();}if(event.key==='Tab'){const buttons=dialog.current?.querySelectorAll('button');if(buttons?.length){const first=buttons[0],last=buttons[buttons.length-1];if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}}}}>
    <h2 id="draft-title">Hay cambios sin guardar</h2><p id="draft-description">Conserva el borrador para seguir trabajando o descártalo antes de cambiar de vista.</p><button className="btn" onClick={cancel}>Seguir editando</button><button className="btn" onClick={()=>{const action=pending;setPending(null);setDrafts({});action();}}>Descartar cambios y continuar</button>
  </div></div>}</Context.Provider>;
}
export const useWorkspaceDraft=()=>useContext(Context);
