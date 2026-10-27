import type { Draft } from './SetupEditor';
import type { LinkageCurve } from '../../domain/chassisComparison';

export function LinkageCurveEditor({draft,onChange}:{draft:Draft;onChange:(draft:Draft)=>void}) {
  const enabled=draft.curveEnabled ?? Boolean(draft.curve);
  const text=draft.curveText ?? draft.curve?.points.map(p=>`${Number((p.wheel_m*1000).toPrecision(12))};${Number((p.shock_m*1000).toPrecision(12))}`).join('\n') ?? '';
  const source=draft.curveSource ?? draft.curve?.source ?? '';
  const provenance=draft.curveProvenance ?? draft.curve?.provenance ?? 'measured';
  const reference=draft.curveReferenceConfirmed ?? Boolean(draft.curve?.reference==='full_extension');
  function update(patch:Partial<Draft>) {
    const next:Draft={...draft,curveEnabled:enabled,curveText:text,curveSource:source,curveProvenance:provenance,curveReferenceConfirmed:reference,...patch};
    if (!next.curveEnabled) {next.curve=null;next.curveError=undefined;onChange(next);return;}
    try {
      const rows=(next.curveText??'').trim().split(/\r?\n/).filter(r=>r.trim());
      if(rows.length<3||rows.length>500) throw new Error('Introduce entre 3 y 500 pares rueda; amortiguador, en mm.');
      const points=rows.map(row=>{const cells=row.trim().split(/[;\t ]+/);if(cells.length!==2||cells.some(c=>!c.trim()))throw new Error('Cada fila debe contener dos números separados por punto y coma o tabulador.');const [wheel,shock]=cells.map(c=>Number(c.replace(',','.')));if(!Number.isFinite(wheel)||!Number.isFinite(shock)||wheel<0||wheel>2000||shock<0||shock>1000)throw new Error('Cotas fuera de dominio: rueda 0–2000 mm, amortiguador 0–1000 mm.');return{wheel_m:wheel*.001,shock_m:shock*.001};});
      if(points[0].wheel_m!==0||points[0].shock_m!==0)throw new Error('La curva debe comenzar en 0;0 a extensión completa.');
      if(points.some((p,i)=>i>0&&(p.wheel_m<=points[i-1].wheel_m||p.shock_m<=points[i-1].shock_m)))throw new Error('Ambos recorridos deben ser estrictamente crecientes, sin duplicados.');
      if((next.curveSource??'').trim().length<3)throw new Error('Indica la referencia de las mediciones de la curva.');
      if(!next.curveReferenceConfirmed)throw new Error('Confirma que el cero corresponde a extensión completa.');
      next.curve={points,provenance:next.curveProvenance!,source:next.curveSource!.trim(),reference:'full_extension'} satisfies LinkageCurve;
      next.curveError=undefined;
    }catch(e){next.curveError=e instanceof Error?e.message:'Curva inválida';}
    onChange(next);
  }
  return <details className="chassis-linkage"><summary>Curva de suspensión progresiva</summary>
    <label><input type="checkbox" aria-label="Usar curva progresiva" checked={enabled} onChange={e=>update({curveEnabled:e.target.checked})}/> Usar curva progresiva</label>
    {enabled&&<><p>Rueda frente a amortiguador. Cotas en mm, una pareja por fila, separada por «;» o tabulador. Se conserva cada punto; no se extrapola.</p>
      <label>Puntos rueda; amortiguador (mm)<textarea aria-label="Puntos rueda; amortiguador (mm)" rows={7} value={text} onChange={e=>update({curveText:e.target.value})}/></label>
      <label>Referencia de la curva<input aria-label="Referencia de la curva" value={source} onChange={e=>update({curveSource:e.target.value})}/></label>
      <label>Procedencia de curva<select value={provenance} onChange={e=>update({curveProvenance:e.target.value as 'measured'|'assumed'})}><option value="measured">Medidas del operador</option><option value="assumed">Estimación · pendiente de medir</option></select></label>
      <label><input type="checkbox" checked={reference} onChange={e=>update({curveReferenceConfirmed:e.target.checked})}/> Referencia: extensión completa</label>
      {draft.curveError&&<p role="alert">{draft.curveError}</p>}
      {!draft.curveError&&draft.curve&&<><svg viewBox="0 0 320 160" role="img" aria-label="Puntos de la curva de suspensión"><path d="M25 10V140H310" fill="none" stroke="var(--text-dim)"/><polyline fill="none" stroke="var(--cyan)" strokeWidth="2" points={draft.curve.points.map(p=>`${25+p.wheel_m/draft.curve!.points[draft.curve!.points.length-1].wheel_m*280},${140-p.shock_m/draft.curve!.points[draft.curve!.points.length-1].shock_m*120}`).join(' ')}/></svg><p>{draft.curve.points.length} puntos · rueda horizontal, amortiguador vertical. La interpolación y la física se calculan en el backend.</p></>}
    </>}
  </details>;
}
