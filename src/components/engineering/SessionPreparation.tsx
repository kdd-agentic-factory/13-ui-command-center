import { useEffect, useState } from 'react';
import { useEngineeringSession } from '../../context/EngineeringSessionContext';
import { useWorkspaceDraft } from '../../context/WorkspaceDraftContext';
import { canWriteTelemetry } from '../../services/telemetryIdentity';
import { emptySession, referenceValue, sessionInput, sessionTypes, type CatalogKind, type EngineeringSessionInput } from '../../domain/engineeringSession';
import { SessionHeader } from './SessionHeader';
import '../../styles/engineering.css';

const labels:Record<CatalogKind,string>={circuit:'Circuito',bike:'Moto',rider:'Piloto'};
const nouns:Record<CatalogKind,string>={circuit:'circuito',bike:'moto',rider:'piloto'};
export function SessionPreparation({recordingId=null}:{recordingId?:string|null}) {
  const context=useEngineeringSession();const {markDirty,isDirty}=useWorkspaceDraft();
  const [draft,setDraft]=useState<EngineeringSessionInput>(emptySession),[names,setNames]=useState<Record<CatalogKind,string>>({circuit:'',bike:'',rider:''});
  const [dirty,setDirty]=useState(false),[saved,setSaved]=useState('');
  const {session,scope,loading,busy,catalog,historical}=context;
  useEffect(()=>{setDraft(session?sessionInput(session):emptySession());setDirty(false);setSaved('');setNames({circuit:'',bike:'',rider:''});},[session,scope,context.workspaceEpoch]);
  useEffect(()=>{markDirty(dirty,'engineering-session');return()=>markDirty(false,'engineering-session');},[dirty,markDirty]);
  function edit(change:Partial<EngineeringSessionInput>){setDraft(old=>({...old,...change}));setDirty(true);setSaved('');}
  async function save(){const result=await context.save({...draft,name:draft.name.trim(),other_label:draft.session_type==='other'?draft.other_label?.trim()??null:null});if(result){setDirty(false);markDirty(false,'engineering-session');setSaved('Sesión guardada.');}}
  const locked=loading||busy||!canWriteTelemetry();
  return <section className="engineering-preparation" aria-label="Contexto de ingeniería">
    <SessionHeader />
    <div className="engineering-session-actions"><label>Reabrir sesión <select aria-label="Reabrir sesión" value={session?.id??''} disabled={busy} onChange={e=>context.choose(e.target.value||null)}><option value="">Nueva sesión</option>{context.sessions.map(item=><option key={item.id} value={item.id}>{item.name} · r{item.revision}</option>)}</select></label>{context.sessionCursor&&<button className="btn" disabled={busy||loading} onClick={()=>void context.loadMoreSessions()}>Más sesiones</button>}<button className="btn" disabled={busy} onClick={context.reload}>{context.conflict?'Recargar sesión':'Recargar contexto'}</button>{session&&<button className="btn" disabled={busy} onClick={()=>context.choose(null)}>Nueva sesión</button>}</div>
    {loading&&<p role="status">Cargando contexto y catálogo del equipo…</p>}
    {context.error&&<p className="engineering-error" role="alert">{context.error}</p>}
    <details open={!session||dirty} className="engineering-form"><summary>{session?'Editar contexto de la sesión':'Datos de la sesión'}</summary>
      <fieldset disabled={locked}><div className="engineering-fields">
        <label>Nombre de sesión <input value={draft.name} maxLength={200} onChange={e=>edit({name:e.target.value})}/></label>
        <label>Tipo de sesión <select value={draft.session_type} onChange={e=>edit({session_type:e.target.value as EngineeringSessionInput['session_type']})}>{Object.entries(sessionTypes).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
        {draft.session_type==='other'&&<label>Nombre de otro tipo <input maxLength={200} value={draft.other_label??''} onChange={e=>edit({other_label:e.target.value})}/></label>}
        <label>Procedencia <select value={draft.provenance} onChange={e=>edit({provenance:e.target.value as EngineeringSessionInput['provenance']})}><option value="recorded">Grabada</option><option value="live">Live</option><option value="sample">Muestra</option><option value="synthetic">Sintética</option></select></label>
        {(['circuit','bike','rider'] as const).map(kind=>{
          const selected=draft[kind],past=historical[kind];
          const choices=catalog[kind].filter(item=>!item.retired);
          const needsHistorical=past&&selected&&past.id===selected.id&&past.revision===selected.revision&&!choices.some(item=>referenceValue(item)===referenceValue(selected));
          return <div className="engineering-catalog-field" key={kind}><label>{labels[kind]} <select aria-label={labels[kind]} value={referenceValue(selected)} onChange={e=>{const item=[...choices,...past?[past]:[]].find(ref=>referenceValue(ref)===e.target.value);edit({[kind]:item?{id:item.id,revision:item.revision}:null});}}><option value="">Sin definir</option>{needsHistorical&&<option value={referenceValue(past)}>{past.name} · r{past.revision} · referencia guardada</option>}{choices.map(item=><option key={referenceValue(item)} value={referenceValue(item)}>{item.name} · r{item.revision}</option>)}</select></label>
            {!choices.length&&<p className="engineering-field-hint">Catálogo de {nouns[kind]} vacío. Puedes guardar la sesión o crear una entrada.</p>}
            {context.catalogCursors[kind]&&<button type="button" className="btn" onClick={()=>void context.loadMoreCatalog(kind)}>Más {nouns[kind]}s</button>}
          </div>;
        })}
      </div><label className="engineering-notes">Notas de sesión <textarea value={draft.notes} maxLength={4000} rows={2} onChange={e=>edit({notes:e.target.value})}/></label>
      <div className="engineering-save"><button type="button" className="btn" disabled={!draft.name.trim()||(draft.session_type==='other'&&!draft.other_label?.trim())} onClick={()=>void save()}>{busy?'Guardando…':session?'Guardar revisión':'Guardar sesión'}</button>{dirty&&<span>Cambios sin guardar</span>}{saved&&<span role="status">{saved}</span>}</div>
      </fieldset>
      <p className="engineering-field-hint">La moto del catálogo identifica el contexto. Confirma por separado la moto de la grabación y sus medidas en A/B.</p>
      <details className="engineering-catalog-editor"><summary>Añadir al catálogo del equipo</summary><div className="engineering-fields">{(['circuit','bike','rider'] as const).map(kind=><div key={kind}><label>Nombre de nuevo {nouns[kind]} <input value={names[kind]} maxLength={200} disabled={locked} onChange={e=>{setNames({...names,[kind]:e.target.value});setDirty(true);}}/></label><button type="button" className="btn" disabled={locked||!names[kind].trim()} onClick={()=>{void context.createCatalog(kind,names[kind]).then(item=>{if(item){setNames(old=>({...old,[kind]:''}));edit({[kind]:{id:item.id,revision:item.revision}});}});}}>Crear {nouns[kind]}</button></div>)}</div></details>
    </details>
    {session&&<div className="engineering-association"><p>{context.association?'La selección asociada contiene solo revisiones persistidas. El análisis validará su vigencia al crear el snapshot.':'Asocia explícitamente la grabación abierta y su setup guardado para preparar el análisis.'}</p><div className="engineering-session-actions"><button className="btn" disabled={!recordingId||locked||isDirty||context.bridgeLoading} onClick={()=>recordingId&&void context.associateWorkspace(recordingId)}>{context.bridgeLoading?'Verificando grabación y setup…':'Asociar grabación y setup actuales'}</button>{context.association&&<button className="btn" disabled={context.bridgeLoading} onClick={context.clearAssociation}>Quitar asociación</button>}</div>{!recordingId&&<p className="engineering-field-hint">Importa o abre una grabación para asociarla. La sesión ya puede guardarse sin archivo.</p>}{isDirty&&<p className="engineering-field-hint">Guarda los cambios de sesión y A/B antes de asociar la fuente.</p>}</div>}
  </section>;
}
