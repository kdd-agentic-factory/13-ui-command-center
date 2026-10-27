import { setupFields, type LinkageCurve } from '../../domain/chassisComparison';
import { LinkageCurveEditor } from './LinkageCurveEditor';
export interface Draft { values: Record<string, string>; assumed: Record<string, boolean>; curve?:LinkageCurve|null; curveEnabled?:boolean; curveText?:string; curveSource?:string; curveProvenance?:'measured'|'assumed'; curveReferenceConfirmed?:boolean; curveError?:string;mechanical?:import('../../domain/chassisWorkshop').MechanicalSetup;configuration?:import('../../domain/chassisWorkshop').ComponentConfiguration;specificationRefs?:import('../../domain/chassisWorkshop').SpecificationRef[] }
export function SetupEditor({ side, draft, onChange }: { side: string; draft: Draft; onChange: (draft: Draft) => void }) {
  return <fieldset className="chassis-editor"><legend>Setup {side}</legend>
    <p>Vacío = sin medir. Marca las estimaciones; no se tratarán como mediciones verificadas.</p>
    {setupFields.slice(0, 7).map(field => <div className="chassis-field" key={field.key}>
      <label htmlFor={`setup-${side}-${field.key}`}>{field.label} <span>{field.displayUnit}</span></label>
      <input id={`setup-${side}-${field.key}`} type="number" step="any" value={draft.values[field.key] ?? ''} onChange={e => onChange({ ...draft, values: { ...draft.values, [field.key]: e.target.value } })} />
      <label className="chassis-assumption"><input type="checkbox" checked={!!draft.assumed[field.key]} onChange={e => onChange({ ...draft, assumed: { ...draft.assumed, [field.key]: e.target.checked } })} /> Estimado</label>
    </div>)}
    <details className="chassis-calibration"><summary>Muelle y relación de suspensión medida</summary><p>Solo se usan con un canal calibrado de desplazamiento del amortiguador. No son ajustes de hidráulicos.</p>
      {setupFields.slice(7).map(field => <div className="chassis-field" key={field.key}>
        <label htmlFor={`setup-${side}-${field.key}`}>{field.label} <span>{field.displayUnit}</span></label>
        <input id={`setup-${side}-${field.key}`} type="number" step="any" value={draft.values[field.key] ?? ''} onChange={e => onChange({ ...draft, values: { ...draft.values, [field.key]: e.target.value } })} />
        <label className="chassis-assumption"><input type="checkbox" checked={!!draft.assumed[field.key]} onChange={e => onChange({ ...draft, assumed: { ...draft.assumed, [field.key]: e.target.checked } })} /> Estimado</label>
      </div>)}
    </details>
    <LinkageCurveEditor draft={draft} onChange={onChange}/>
  </fieldset>;
}
