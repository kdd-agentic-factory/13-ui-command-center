import type {LabAnalysis} from '../../../domain/suspensionLab';
import {BenchView} from './BenchView';
export function BenchComparison({reference:a,candidate:b}:{reference:LabAnalysis;candidate:LabAnalysis}){
 const ma=(a.source_manifest.metadata??{}) as Record<string,unknown>,mb=(b.source_manifest.metadata??{}) as Record<string,unknown>;
 const fields=['model_reference','component','mounting','zero_reference','force_definition'];
 const conditions=fields.every(k=>ma[k]!=null&&ma[k]===mb[k])&&a.result.temperature_c!=null&&a.result.temperature_c===b.result.temperature_c;
 return <section aria-label="Comparación de ensayos"><h3>Comparación de ensayos medidos</h3><p>{conditions?'Condiciones declaradas coincidentes; revisar dispersión y calibración antes de concluir.':'Condiciones incompletas o diferentes: las curvas se muestran para inspección y no permiten atribuir una mejora al setup.'}</p><div className="lab-table-scroll"><table><thead><tr><th>Condición</th><th>Referencia</th><th>Candidato</th></tr></thead><tbody>{[...fields,'configuration_reference'].map(k=><tr key={k}><th>{k}</th><td>{String(ma[k]??'No declarada')}</td><td>{String(mb[k]??'No declarada')}</td></tr>)}<tr><th>Temperatura (°C)</th><td>{String(a.result.temperature_c??'Desconocida')}</td><td>{String(b.result.temperature_c??'Desconocida')}</td></tr></tbody></table></div><h4>Referencia · {a.id.slice(-8)}</h4><BenchView result={a.result}/><h4>Candidato · {b.id.slice(-8)}</h4><BenchView result={b.result}/></section>;
}
