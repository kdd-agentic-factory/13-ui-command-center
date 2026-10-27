import type {MeasuredValue} from '../../../domain/chassisComparison';
import {emptyConfiguration,emptyMechanical,type MechanicalSetup,type PointId,type SettingKey} from '../../../domain/chassisWorkshop';
import type {Draft} from '../SetupEditor';

export function NumericControl({label,value,onChange,unit,step=1}:{label:string;value:number|null|undefined;onChange:(value:number|null)=>void;unit:string;step?:number}){
 return <label className="workshop-control"><span>{label} <small>{unit}</small></span><span className="workshop-number"><button type="button" aria-label={`Reducir ${label}`} disabled={value==null} onClick={()=>onChange(Number(((value??0)-step).toPrecision(12)))}>−</button><input type="number" aria-label={label} step={step} value={value??''} placeholder="Sin medir" onChange={e=>{const n=e.target.value===''?null:Number(e.target.value);if(n===null||Number.isFinite(n))onChange(n);}}/><button type="button" aria-label={`Aumentar ${label}`} disabled={value==null} onClick={()=>onChange(Number(((value??0)+step).toPrecision(12)))}>+</button></span></label>;
}
export function MeasuredControl({label,value,onChange,unit='mm',factor=.001,step=.1}:{label:string;value?:MeasuredValue|null;onChange:(value:MeasuredValue)=>void;unit?:string;factor?:number;step?:number}){
 return <div className="workshop-measure"><NumericControl label={label} value={value?.value==null?null:value.value/factor} unit={unit} step={step} onChange={n=>onChange({value:n===null?null:n*factor,unit:unit==='°'?'rad':unit==='mm'?'m':unit,provenance:value?.provenance??'measured',uncertainty:value?.uncertainty})}/><label className="workshop-assumed"><input type="checkbox" checked={value?.provenance==='assumed'} onChange={e=>onChange({value:value?.value??null,unit:unit==='°'?'rad':unit==='mm'?'m':unit,provenance:e.target.checked?'assumed':'measured',uncertainty:value?.uncertainty})}/> Estimado</label></div>;
}
type MechanicalKey='rear_radius_m'|'swingarm_length_m'|'swingarm_angle_rad'|'steer_axis_body_rad'|'fork_length_m'|'fork_compression_m'|'chain_pitch_m';
export function MechanicalControl({field,label,draft,onChange}:{field:MechanicalKey;label:string;draft:Draft;onChange:(d:Draft)=>void}){
 const m=draft.mechanical??emptyMechanical();const angle=field.endsWith('_rad');
 return <MeasuredControl label={label} value={m[field]} unit={angle?'°':'mm'} factor={angle?Math.PI/180:.001} onChange={v=>onChange({...draft,mechanical:{...m,[field]:v}})}/>;
}
export function SettingControl({setting,label,draft,onChange}:{setting:SettingKey;label:string;draft:Draft;onChange:(d:Draft)=>void}){
 const c=draft.configuration??emptyConfiguration();const clicks=setting.includes('clicks'),rate=setting.endsWith('_n_m');const factor=clicks?1:rate?1000:.001;
 return <NumericControl label={label} value={c.settings[setting]==null?null:c.settings[setting]!/factor} unit={clicks?'clicks':rate?'N/mm':'mm'} step={clicks?1:.1} onChange={v=>{const settings={...c.settings};if(v===null)delete settings[setting];else settings[setting]=v*factor;onChange({...draft,configuration:{...c,settings}});}}/>;
}
export function PointEditor({draft,onChange}:{draft:Draft;onChange:(d:Draft)=>void}){
 const m=draft.mechanical??emptyMechanical();const names:Record<PointId,string>={swingarm_pivot:'Pivote',steer_reference:'Referencia dirección',front_sprocket:'Eje de piñón',cog:'CoG del conjunto'};
 function change(key:PointId,axis:'x'|'z',value:MeasuredValue){const old=m.points[key]??{x:{value:null,unit:'m',provenance:'measured'},z:{value:null,unit:'m',provenance:'measured'}};onChange({...draft,mechanical:{...m,points:{...m.points,[key]:{...old,[axis]:value}}}});}
 return <details className="workshop-details"><summary>Puntos de referencia del chasis</summary><p>Marco solidario al chasis: x hacia delante, z arriba. Todos los puntos deben compartir origen.</p>{(Object.keys(names) as PointId[]).map(k=><fieldset key={k}><legend>{names[k]}</legend>{(['x','z'] as const).map(axis=><MeasuredControl key={axis} label={`${names[k]} ${axis}`} value={m.points[k]?.[axis]} onChange={v=>change(k,axis,v)}/>)}</fieldset>)}</details>;
}
export type {MechanicalSetup};
