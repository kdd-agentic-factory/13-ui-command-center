interface Props {x:(number|null)[];y:(number|null)[];xLabel:string;yLabel:string;title:string;breakBefore?:boolean[];cursorX?:number;branches?:string[]}
export function SignalPlot({x,y,xLabel,yLabel,title,breakBefore,cursorX,branches}:Props){
 const count=Math.min(x.length,y.length),valid=(i:number)=>x[i]!=null&&y[i]!=null&&Number.isFinite(x[i])&&Number.isFinite(y[i]);
 const ids=Array.from({length:count},(_,i)=>i).filter(valid);
 if(!ids.length)return <p>Sin puntos disponibles para {title}.</p>;
 const minX=Math.min(...ids.map(i=>x[i] as number)),maxX=Math.max(...ids.map(i=>x[i] as number)),minY=Math.min(...ids.map(i=>y[i] as number)),maxY=Math.max(...ids.map(i=>y[i] as number));
 const px=(v:number)=>55+((v-minX)/(maxX-minX||1))*620,point=(i:number)=>`${px(x[i] as number)},${240-(((y[i] as number)-minY)/(maxY-minY||1))*200}`;
 const segments:{indices:number[];branch:string}[]=[];let active:number[]=[];
 for(let i=0;i<count;i++){
  if(!valid(i)){active=[];continue;}
  const branch=branches?.[i]??'';
  if(!active.length||breakBefore?.[i]||(i>0&&branches?.[i]!==branches?.[i-1])){active=[];segments.push({indices:active,branch});}
  active.push(i);
 }
 return <figure className="lab-plot"><figcaption>{title}</figcaption><svg viewBox="0 0 720 290" role="img" aria-label={`${title}. Eje horizontal: ${xLabel}. Eje vertical: ${yLabel}. Los huecos no se unen; tabla disponible debajo.`}><path d="M55 30V240H680" fill="none" stroke="currentColor"/>{segments.map((s,i)=><polyline key={i} data-segment={i} points={s.indices.map(point).join(' ')} fill="none" stroke={s.branch==='extension'?'var(--color-warning, #c99c51)':'var(--color-accent, #5ba9e5)'} strokeWidth="1.5"/>)}{cursorX!=null&&cursorX>=minX&&cursorX<=maxX&&<line aria-label="Cursor compartido" x1={px(cursorX)} x2={px(cursorX)} y1="30" y2="240" stroke="currentColor" strokeDasharray="4 4"/>}<text x="55" y="260">{minX.toPrecision(4)}</text><text x="590" y="260">{maxX.toPrecision(4)}</text><text x="5" y="35">{maxY.toPrecision(4)}</text><text x="5" y="232">{minY.toPrecision(4)}</text><text x="270" y="285">{xLabel}</text><text x="60" y="20">{yLabel}</text></svg>{branches&&<p>Ramas: compresión (azul), extensión (ámbar), detención y muestras ausentes identificadas en tabla.</p>}<details><summary>Tabla de {title}</summary><div className="lab-table-scroll"><table><thead><tr><th>{xLabel}</th><th>{yLabel}</th>{branches&&<th>Dirección</th>}</tr></thead><tbody>{Array.from({length:count},(_,i)=><tr key={i}><td>{x[i]?.toPrecision(7)??'Sin muestra'}</td><td>{y[i]?.toPrecision(7)??'Sin muestra'}</td>{branches&&<td>{({compression:'Compresión',extension:'Extensión',stationary:'Detención',not_available:'Sin muestra'} as Record<string,string>)[branches[i]]??branches[i]}</td>}</tr>)}</tbody></table></div></details></figure>;
}
