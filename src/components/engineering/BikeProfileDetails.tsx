import {useState} from 'react';
import type {BikeProfileInput,BikeComponent,ProfileSource} from '../../domain/bikeTechnicalProfile';
const quantities={front_radius_m:['Radio delantero','m'],rake_rad:['Ángulo de dirección','rad'],offset_m:['Offset','m'],wheelbase_m:['Batalla','m'],mass_kg:['Masa','kg'],front_weight_fraction:['Fracción de peso delantero','1'],cg_height_m:['Altura del CoG','m'],spring_rate_n_m:['Constante de muelle','N/m'],preload_m:['Precarga','m'],motion_ratio:['Relación de movimiento','1'],motion_ratio_slope_per_m:['Pendiente de relación de movimiento','1/m']} as const;
const sections:Record<BikeComponent['section'],string>={chassis:'Chasis',suspension:'Suspensión',brakes:'Frenos',powertrain:'Propulsión',electrical:'Electricidad',aerodynamics:'Aerodinámica',tires:'Neumáticos',ergonomics:'Ergonomía'};
export function BikeProfileDetails({body,onChange,author,disabled}:{body:BikeProfileInput;onChange:(value:BikeProfileInput)=>void;author:string;disabled:boolean}){
 const [quantity,setQuantity]=useState<keyof typeof quantities>('front_radius_m');
 const source=(reference:string,kind:ProfileSource['kind']='team_declaration'):ProfileSource=>({kind,reference,page:null,author_id:author,recorded_at:new Date().toISOString(),verification:'unverified'});
 function component(index:number,patch:Partial<BikeComponent>){onChange({...body,components:body.components.map((c,i)=>i===index?{...c,...patch}:c)});}
 return <fieldset disabled={disabled}><legend>Componentes y medidas del montaje</legend>
  <label>Arquitectura<select value={body.architecture.value} onChange={e=>onChange({...body,architecture:{value:e.target.value as BikeProfileInput['architecture']['value'],source:e.target.value==='unknown'?null:source('Arquitectura declarada por el equipo')}})}>
   <option value="unknown">Pendiente de confirmar</option><option value="scooter_cvt">Scooter / CVT</option><option value="conventional">Convencional</option><option value="other">Otra</option>
  </select></label>
  <h4>Inventario de componentes</h4>
  {body.components.map((c,index)=><div key={c.id}>
   <label>Pieza {index+1}<input value={c.label} maxLength={200} onChange={e=>component(index,{label:e.target.value,status:'pending',source:null})}/></label>
   <label>Sección {index+1}<select value={c.section} onChange={e=>component(index,{section:e.target.value as BikeComponent['section']})}>{Object.entries(sections).map(([key,label])=><option key={key} value={key}>{label}</option>)}</select></label>
   <label>Modelo de pieza {index+1}<input value={c.model??''} onChange={e=>component(index,{model:e.target.value||null,status:'pending',source:null})}/></label>
   <label>Estado de pieza {index+1}<select value={c.status} onChange={e=>component(index,{status:e.target.value as BikeComponent['status'],source:e.target.value==='pending'?null:source('Estado del componente declarado por el equipo')})}><option value="pending">Pendiente</option><option value="installed">Montado (declarado)</option><option value="not_applicable">No aplicable (declarado)</option></select></label>
   <label>Referencia de pieza {index+1}<input value={c.source?.reference??''} placeholder="Manual, página o ficha de inspección" onChange={e=>component(index,{source:e.target.value.trim()?source(e.target.value):null,status:e.target.value.trim()?c.status:'pending'})}/></label>
  </div>)}
  <button type="button" className="btn" disabled={body.components.length>=300} onClick={()=>onChange({...body,components:[...body.components,{id:crypto.randomUUID(),parent_id:null,section:'chassis',label:'Componente pendiente',model:null,status:'pending',source:null}]})}>Añadir componente</button>
  <h4>Medidas y procedencia</h4><p>Introduce las unidades indicadas. Una declaración pendiente de contraste no equivale a una medida verificada.</p>
  {Object.entries(body.measurements).map(([key,m])=><div key={key}>
   <label>{quantities[key as keyof typeof quantities]?.[0]??key} ({m.unit})<input type="number" step="any" value={m.value??''} placeholder="Sin medir" onChange={e=>onChange({...body,measurements:{...body.measurements,[key]:{...m,value:e.target.value===''?null:Number(e.target.value),uncertainty:null,source:e.target.value===''?null:source(m.source?.reference??'Valor declarado por el equipo')}}})}/></label>
   <label>Fuente · {quantities[key as keyof typeof quantities]?.[0]??key}<input value={m.source?.reference??''} placeholder="Referencia del manual o medición" onChange={e=>onChange({...body,measurements:{...body.measurements,[key]:{...m,source:e.target.value.trim()?source(e.target.value,m.source?.kind??'team_declaration'):null}}})}/></label>
   <label>Tipo de fuente · {quantities[key as keyof typeof quantities]?.[0]??key}<select value={m.source?.kind??'team_declaration'} disabled={m.value===null} onChange={e=>onChange({...body,measurements:{...body.measurements,[key]:{...m,source:source(m.source?.reference??'',e.target.value as ProfileSource['kind'])}}})}>
    <option value="team_declaration">Declaración del equipo</option><option value="manufacturer">Documentación del fabricante</option><option value="measurement">Medición del montaje</option><option value="inspection">Inspección</option>
   </select></label>
   <label>Incertidumbre · {quantities[key as keyof typeof quantities]?.[0]??key} ({m.unit})<input type="number" min="0" step="any" disabled={m.value===null} placeholder="Sin determinar" value={m.uncertainty??''} onChange={e=>onChange({...body,measurements:{...body.measurements,[key]:{...m,uncertainty:e.target.value===''?null:Number(e.target.value),source:m.source?{...m.source,verification:'unverified',author_id:author,recorded_at:new Date().toISOString()}:null}}})}/></label>
   <label><input type="checkbox" aria-label={`Confirmo el contraste de ${quantities[key as keyof typeof quantities]?.[0]??key}`} disabled={m.value===null||m.source?.kind!=='measurement'||!m.source.reference.trim()||m.source.reference==='Valor declarado por el equipo'} checked={m.source?.kind==='measurement'&&m.source.verification==='checked'} onChange={e=>{if(m.source)onChange({...body,measurements:{...body.measurements,[key]:{...m,source:{...m.source,verification:e.target.checked?'checked':'unverified',author_id:author,recorded_at:new Date().toISOString()}}}});}}/>He contrastado la medición del montaje y su referencia.</label>
   <p>{m.value===null?'Pendiente de medición':m.source?.verification==='checked'?'Procedencia contrastada registrada':'Pendiente de contraste'}</p>
  </div>)}
  <label>Magnitud a registrar<select value={quantity} onChange={e=>setQuantity(e.target.value as keyof typeof quantities)}>{Object.entries(quantities).map(([key,[label,unit]])=><option key={key} value={key}>{label} ({unit})</option>)}</select></label>
  <button type="button" className="btn" disabled={!!body.measurements[quantity]} onClick={()=>onChange({...body,measurements:{...body.measurements,[quantity]:{value:null,unit:quantities[quantity][1],uncertainty:null,source:null}}})}>Añadir medida</button>
 </fieldset>;
}
