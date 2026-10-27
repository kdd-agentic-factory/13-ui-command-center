import { canWriteTelemetry } from '../services/telemetryIdentity';
import { TelemetryGate } from '../components/auth/TeamSelector';
import { RecordedSessionLibrary } from '../components/recorded/RecordedSessionLibrary';
import { selectRecording } from '../domain/recordedSession';
import { useRef, useState } from 'react';
import '../styles/recorded.css';
import { useNavigate } from '../context/NavContext';
import { importRecording,inspectTwoD,type TwoDMeasurement } from '../services/recordedTelemetry';
import type { RecordedSession } from '../domain/recordedSession';

export function ConnectDataPage() {
  const [libraryOpen,setLibraryOpen]=useState(false);
  const navigate = useNavigate();
  const [source, setSource] = useState<'aim' | '2d'>('aim');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [session, setSession] = useState<RecordedSession | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const [archive,setArchive]=useState<File|null>(null),[measurements,setMeasurements]=useState<TwoDMeasurement[]>([]),[measurement,setMeasurement]=useState(''),[ack,setAck]=useState(false);
  async function upload(file?: File) {
    if (!file || busy || !canWriteTelemetry()) return;
    setBusy(true); setError(''); setSession(null);
    setArchive(null);setMeasurements([]);setMeasurement('');setAck(false);
    try { if(source==='2d'&&file.name.toLowerCase().endsWith('.zip')){setArchive(file);setMeasurement('');setAck(false);setMeasurements((await inspectTwoD(file)).measurements);} else {setArchive(null);setMeasurements([]);setSession(await importRecording(file, source));} }
    catch (e) { setError(e instanceof Error ? e.message : 'No se pudo importar el archivo'); }
    finally { setBusy(false); if (input.current) input.current.value = ''; }
  }
  async function importSelected(){if(!archive||!measurement||!ack||busy)return;setBusy(true);setError('');try{setSession(await importRecording(archive,'2d',measurement));}catch(e){setError(e instanceof Error?e.message:'No se pudo importar la medición');}finally{setBusy(false);}}
  return <div className="page recorded-workspace">
    <h1 className="page-title">Importar telemetría</h1>{!canWriteTelemetry()&&<p role="status">Acceso de lectura: importa y guarda un ingeniero o administrador del equipo.</p>}
    <details className="recorded-library-toggle" onToggle={event=>setLibraryOpen(event.currentTarget.open)}><summary>Abrir una sesión guardada</summary>{libraryOpen&&<RecordedSessionLibrary onOpen={recording=>{selectRecording(recording);navigate('chassis');}}/>}</details>
    <p className="page-subtitle">Sesiones grabadas para Chassis Tool · sin conexión activa a GPS, IMU o ECU.</p>
    <div className="card">
      <label>Origen <select aria-label="Origen de telemetría" value={source} disabled={busy || !canWriteTelemetry()} onChange={e => { setSource(e.target.value as 'aim' | '2d'); setSession(null); setError('');setArchive(null);setMeasurements([]);setMeasurement(''); }}>
        <option value="aim">AiM / Race Studio</option><option value="2d">2D / WinARace</option>
      </select></label>
      <p>AiM: XRK/XRZ con el lector oficial instalado, o exportación CSV con unidades.</p>
      <p>2D: exportación CSV/TSV o ZIP con mediciones MES. El lector nativo de variantes observadas es experimental: requiere contraste de escala y tiempo con 2D Analyzer.</p>
      <p>Incluye una columna Time, una fila de unidades (s o ms para el tiempo) y las muestras. No se inventan frecuencias ni canales ausentes.</p>
      <label htmlFor="telemetry-upload">Archivo de sesión </label>
      <input ref={input} id="telemetry-upload" aria-label="Archivo de telemetría" type="file" accept={source === 'aim' ? '.csv,.tsv,.txt,.xrk,.xrz,.drk' : '.csv,.tsv,.txt,.zip'} disabled={busy || !canWriteTelemetry()} onChange={e => void upload(e.target.files?.[0])} />
      {archive&&measurements.length>0&&!session&&<div className="recorded-measurement-select"><label>Medición 2D <select aria-label="Medición 2D" value={measurement} disabled={busy || !canWriteTelemetry()} onChange={e=>setMeasurement(e.target.value)}><option value="">Selecciona una medición del paquete</option>{measurements.map(m=><option key={m.path} value={m.path}>{m.path} · {m.channels.filter(c=>c.numeric_supported).length}/{m.channels.length} canales candidatos</option>)}</select></label><p>No se importan automáticamente todas las mediciones. Los relojes nativos se reconstruyen a partir de metadatos; no están contrastados con el fabricante.</p><label><input type="checkbox" checked={ack} disabled={busy || !canWriteTelemetry()} onChange={e=>setAck(e.target.checked)}/> Entiendo que esta lectura 2D es experimental y requiere contraste</label><button className="btn" disabled={busy||!measurement||!ack||!canWriteTelemetry()} onClick={()=>void importSelected()}>Importar medición seleccionada</button></div>}
      {busy && <p role="status">Leyendo y validando las muestras…</p>}
      {error && <p role="alert">{error}</p>}
      {session && <div role="status">
        <p>{session.filename}: {session.channels.length} canales con muestras · {session.laps.length ? `${session.laps.length} vueltas registradas` : 'Sin marcadores de vuelta en la exportación'}.</p>
        <p>Lector: {session.reader} · datos restringidos guardados en el backend local.</p>
        {session.validation?.status==='experimental'&&<p>Lectura experimental: escala, signo y reloj pendientes de contrastar. {session.excluded_channels?.length??0} canales excluidos; consulta sus causas en Chassis.</p>}
        <button className="btn" onClick={() => navigate('chassis')}>Abrir Chassis Tool</button>
      </div>}
    </div>
    <p>Conexiones en directo: no configuradas. Importar un archivo no conecta dispositivos.</p>
  </div>;
}
export default function ProtectedConnectDataPage(){ return <TelemetryGate><ConnectDataPage/></TelemetryGate>; }
