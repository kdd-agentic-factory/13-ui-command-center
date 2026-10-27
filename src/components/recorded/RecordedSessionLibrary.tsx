import { useEffect, useRef, useState } from 'react';
import { getRecording, listRecordings, type RecordedSessionListItem } from '../../services/recordedTelemetry';
import type { RecordedSession } from '../../domain/recordedSession';

export function RecordedSessionLibrary({ onOpen }: { onOpen:(session:RecordedSession)=>void }) {
  const [items,setItems]=useState<RecordedSessionListItem[]>([]),[cursor,setCursor]=useState<string|null>(null),[busy,setBusy]=useState(false),[error,setError]=useState('');
  const generation=useRef(0);
  async function load(next?:string) {
    const token=generation.current;setBusy(true);setError('');
    try {const page=await listRecordings({cursor:next});if(token===generation.current){setItems(previous=>next?[...previous,...page.items]:page.items);setCursor(page.next_cursor);}}
    catch(e){if(token===generation.current)setError(e instanceof Error?e.message:'No se pudo cargar la biblioteca');}
    finally{if(token===generation.current)setBusy(false);}
  }
  useEffect(()=>{
    void load();
    const reset=()=>{generation.current++;setItems([]);setCursor(null);setBusy(false);setError('');void load();};
    window.addEventListener('telemetry-scope-changed',reset);
    return()=>{generation.current++;window.removeEventListener('telemetry-scope-changed',reset);};
  },[]);
  async function open(id:string){const token=generation.current;setBusy(true);setError('');try{const session=await getRecording(id);if(token===generation.current)onOpen(session);}catch(e){if(token===generation.current)setError(e instanceof Error?e.message:'No se pudo abrir la sesión');}finally{if(token===generation.current)setBusy(false);}}
  return <section aria-label="Biblioteca de sesiones" className="recorded-library"><h2>Sesiones guardadas</h2><p>Solo se muestran sesiones del ámbito actual. La fecha indica su incorporación al catálogo, no la hora de adquisición.</p>
    {error&&<p role="alert">{error} <button className="btn" onClick={()=>void load()}>Reintentar</button></p>}
    {busy&&<p role="status">Consultando sesiones…</p>}
    {!busy&&!error&&!items.length&&<p>No hay sesiones guardadas en este ámbito. Importa una medición para comenzar.</p>}
    <ul>{items.map(item=><li key={item.id}><div><strong>{item.filename}</strong><p>{item.source.toUpperCase()} · {item.channel_count} canales · {item.validation_status==='experimental'?'Fuente experimental': 'Validación según origen'} · {item.imported_at}</p></div><button className="btn" disabled={busy} onClick={()=>void open(item.id)} aria-label={`Abrir ${item.filename}`}>Abrir sesión</button></li>)}</ul>
    {cursor&&<button className="btn" disabled={busy} onClick={()=>void load(cursor)}>Cargar más sesiones</button>}
  </section>;
}
