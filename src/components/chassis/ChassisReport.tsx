import { useEffect, useRef, useState } from 'react';
import { getChassisReport } from '../../services/chassisTelemetry';
import { serializeChassisReport, type ChassisReportDocument } from '../../domain/chassisReport';
import { EvidencePanel } from './EvidencePanel';
import {WorkshopAnnexPanel} from './workshop/WorkshopAnnexPanel';
import { metricLabels, setupFields } from '../../domain/chassisComparison';
export function ChassisReport({comparisonId}:{comparisonId:string}){
  const [document,setDocument]=useState<ChassisReportDocument|null>(null),[error,setError]=useState('');const epoch=useRef(0);
  const section=useRef<HTMLElement>(null);
  useEffect(()=>{
    let original: {node:HTMLDetailsElement;open:boolean}[]|null=null;
    const expand=()=>{if(original)return;original=[...section.current?.querySelectorAll('details')??[]].map(node=>({node,open:node.open}));original.forEach(({node})=>{node.open=true;});};
    const restore=()=>{original?.forEach(({node,open})=>{node.open=open;});original=null;};
    window.addEventListener('beforeprint',expand);window.addEventListener('afterprint',restore);
    return()=>{restore();window.removeEventListener('beforeprint',expand);window.removeEventListener('afterprint',restore);};
  },[document]);
  useEffect(()=>{const token=++epoch.current;setDocument(null);setError('');getChassisReport(comparisonId).then(data=>{if(token===epoch.current)setDocument(data);}).catch(e=>{if(token===epoch.current)setError(e.message);});const reset=()=>{epoch.current++;setDocument(null);setError('El ámbito cambió. Abre de nuevo una comparación autorizada.');};window.addEventListener('telemetry-scope-changed',reset);return()=>{epoch.current++;window.removeEventListener('telemetry-scope-changed',reset);};},[comparisonId]);
  function download(){if(!document)return;const link=window.document.createElement('a');const url=URL.createObjectURL(new Blob([serializeChassisReport(document)],{type:'application/json;charset=utf-8'}));link.href=url;link.download=`chassis-report-${document.comparison.id}.json`;link.click();URL.revokeObjectURL(url);}
  return <section ref={section} className="chassis-saved-report" aria-label="Informe de comparación guardada"><h2>Informe de comparación guardada</h2>{error?<p role="alert">{error}</p>:!document?<p role="status">Cargando informe autorizado…</p>:<>
    <p>Informe {document.comparison.id} · sesión {document.session.id} · {document.classification} · esquema {document.schema_version}</p><p>Fuente {document.session.source.toUpperCase()} · lector {document.session.reader} {document.session.reader_version} · SHA-256 {document.session.sha256}</p><p>A: {document.comparison.setup_a_id} · B: {document.comparison.setup_b_id}. B es una alternativa calculada, no otra sesión medida.</p>
    <div className="chassis-report-actions"><button className="btn" onClick={download}>Descargar informe JSON</button><button className="btn" onClick={()=>window.print()}>Imprimir informe</button></div>
    <div className="chassis-table-scroll"><table className="chassis-metrics"><caption>Geometría guardada · valores en metros</caption><thead><tr><th>Magnitud</th><th>A</th><th>B</th><th>B − A</th></tr></thead><tbody>{Object.entries(document.comparison.a?.metrics??{}).map(([key,value])=><tr key={key}><th>{metricLabels[key]??key}</th><td>{value.toFixed(6)}</td><td>{document.comparison.b?.metrics[key]?.toFixed(6)??'—'}</td><td>{document.comparison.deltas?.[key]?.toFixed(6)??'—'}</td></tr>)}</tbody></table></div>
    <div className="chassis-table-scroll"><table className="chassis-metrics"><caption>Medidas de las revisiones · unidad original del modelo y procedencia</caption><thead><tr><th>Medida</th><th>A</th><th>B</th></tr></thead><tbody>{setupFields.map(field=><tr key={field.key}><th>{field.label}</th>{[document.comparison.setup_a,document.comparison.setup_b].map((setup,index)=>{const measured=setup?.values[field.key];return <td key={index}>{measured?.value==null?'Sin medir':`${measured.value} ${measured.unit} · ${measured.provenance==='assumed'?'estimado':'medido'}`}</td>;})}</tr>)}</tbody></table></div>
    <details><summary>Datos y revisiones persistidos</summary><pre>{serializeChassisReport(document)}</pre></details>
    <EvidencePanel run={document.comparison}/><ul>{document.limitations.map(value=><li key={value}>{value}</li>)}</ul><WorkshopAnnexPanel comparisonId={comparisonId} recordingId={document.session.id} readOnly/>
  </>}</section>;
}
