import { sessionTypes } from '../../domain/engineeringSession';
import { useEngineeringSession } from '../../context/EngineeringSessionContext';

export function SessionHeader() {
  const {session,association,historical,catalog,scope}=useEngineeringSession();
  const names=session?(['circuit','bike','rider'] as const).map(kind=>{const ref=session[kind];return historical[kind]?.id===ref?.id&&historical[kind]?.revision===ref?.revision?historical[kind]?.name:catalog[kind].find(item=>item.id===ref?.id&&item.revision===ref.revision)?.name;}).filter(Boolean).join(' · '):'';
  return <header className="engineering-header">
    <div><h2>{session?.name??'Preparar sesión de ingeniería'}</h2><p>{session?`${sessionTypes[session.session_type]} · ${session.provenance} · revisión ${session.revision}`:'Elige el contexto real del equipo; puedes guardarlo antes de importar telemetría.'}</p></div>
    <div className="engineering-summary"><span>{scope==='local'?'Preparación local': 'Equipo verificado'}</span>{session&&<span>{names||'Contexto por completar'}</span>}<span>{association?`${association.recording.filename} · ${association.selection.comparison?'A/B guardado':'sin comparación A/B'}`:'Sin grabación asociada'}</span></div>
  </header>;
}
