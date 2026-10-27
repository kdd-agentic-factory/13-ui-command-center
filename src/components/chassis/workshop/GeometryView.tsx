import {useState} from 'react';
import type {WorkshopPreview} from '../../../domain/chassisWorkshop';
export function GeometryView({preview}:{preview:WorkshopPreview|null}){
 const [chain,setChain]=useState(true),[cog,setCog]=useState(true);
 const pose=preview?.pose;const valid=pose?.status==='available';
 const p=pose?.points??{};const all=Object.values(p);const maxX=Math.max(1,...all.map(v=>v[0])),maxZ=Math.max(1,...all.map(v=>v[1]));const minX=Math.min(-.2,...all.map(v=>v[0]));const scale=Math.min(550/(maxX-minX+.4),320/(maxZ+.3));
 const point=([x,z]:[number,number])=>[45+(x-minX)*scale,370-z*scale];
 const segments={...pose?.segments,...(chain?preview?.chain.segments:{})};
 return <div><div className="workshop-layer-controls"><label><input type="checkbox" checked={chain} onChange={e=>setChain(e.target.checked)}/> Cadena e IFC</label><label><input type="checkbox" checked={cog} onChange={e=>setCog(e.target.checked)}/> CoG</label></div>
 <div className="workshop-drawing">{valid?<svg viewBox="0 0 680 430" role="img" aria-label="Geometría plana de la alternativa calculada"><line className="workshop-ground" x1="20" y1="370" x2="660" y2="370"/>{(['rear','front'] as const).map(side=>{const [x,y]=point(p[`${side}_axle`]);return <circle key={side} className="workshop-wheel" cx={x} cy={y} r={(pose.metrics[`${side}_radius_m`]??0)*scale}/>;})}{Object.entries(segments).map(([id,ends])=>{const a=point(ends[0]),b=point(ends[1]);return <line key={id} className={`workshop-vector ${id==='chain_pull'?'workshop-chain':''}`} x1={a[0]} y1={a[1]} x2={b[0]} y2={b[1]}/>;})}
 {Object.entries({...p,...(chain?preview?.chain.points:{})}).filter(([id,v])=>(cog||id!=='cog')&&v[0]>=minX-.2&&v[0]<=maxX+.2&&v[1]>=0&&v[1]<=maxZ+.2).map(([id,v])=>{const [x,y]=point(v);return <g key={id}><circle className={id==='cog'?'workshop-cog':'workshop-anchor'} cx={x} cy={y} r="4"/>{['cog','ifc','steer_ground','swingarm_pivot'].includes(id)&&<text x={x+8} y={y-9}>{({cog:'CoG',ifc:'IFC',steer_ground:'Avance',swingarm_pivot:'Pivote'} as Record<string,string>)[id]}</text>}</g>;})}</svg>:<div className="workshop-empty"><h3>Pendiente de medidas</h3><p>Completa radios, puntos de chasis y posiciones de suspensión para dibujar la moto a escala.</p><p>El avance estático puede calcularse antes, con radio delantero, dirección y offset.</p></div>}</div>
 <p className="workshop-caption">Moto vertical · plano horizontal · posiciones de suspensión prescritas. Sin equilibrio dinámico ni fuerzas aerodinámicas.</p>
 <p>Anti-squat: <strong>pendiente de contraste independiente</strong>. Un IFC geométrico no valida el porcentaje.</p></div>;
}
