import {engineeringLabel as label,EngineeringIdentifier,shortIdentifier} from './engineeringPresentation';
import type {StoredProposal} from '../../domain/engineeringSession';
import {ContrastPanel,EvidenceLinks,evidenceAnchor} from './ContrastPanel';
const gates={inputs_valid:'Entradas válidas',branches_sealed:'Ramas selladas',independence_checked:'Independencia comprobada',conflicts_resolved:'Conflictos resueltos',domain_valid:'Dominio válido',source_valid:'Fuente válida para el propósito de la acción'};
export function CrewChiefProposal({stored}:{stored:StoredProposal}){
  const p=stored.proposal;const evidence=[...new Set([...p.items.flatMap(i=>[...i.evidence_ids,...i.evaluation.measurements.map(r=>r.evidence_id),...i.parameters.flatMap(v=>v.support.map(r=>r.evidence_id))]),...p.section_summaries.flatMap(s=>s.positions.flatMap(pos=>pos.evidence_ids)),...p.matrix.object_reviews.flatMap(r=>r.references.map(ref=>ref.evidence_id)),...p.resolution?.evidence_ids??[]])];
  return <section className="engineering-proposal" aria-label="Propuesta Crew Chief agente"><h3>Crew Chief · agente de síntesis</h3><p>Propuesta {stored.proposal_id} · revisión {p.revision} · publicación {label(stored.publication_status)}. La decisión corresponde al humano designado.</p><p>Modelo: {p.model_metadata?`${p.model_metadata.name} · ${p.model_metadata.digest??'digest no informado'}`:'Sin modelo acreditado'}. Sin validación externa.</p>
    <details><summary>Identidad de la propuesta completa</summary><p>Digest propuesta: <code>{stored.proposal_digest}</code></p><p>Digest snapshot: <code>{p.snapshot_digest}</code></p><p>Hashes de originales: {p.result_hashes.join(' · ')}</p></details>
    {p.source_status.length>0&&<p role="note">Estado de la fuente: {p.source_status.map(label).join(' · ')}. Una fuente 2D experimental sigue bloqueando actuaciones físicas aunque permita recopilar evidencia.</p>}
    {p.resolution&&<section aria-label="Resolución persistida">
      <h4>Resolución persistida</h4>
      <p>Revisión de referencia: {p.resolution.expected_revision}</p>
      <p>{p.resolution.note}</p>
      {p.resolution.evidence_ids.map(id=><a key={id} className="engineering-reference" href={`#${evidenceAnchor(id)}`}>Evidencia de resolución {id}</a>)}
    </section>}
    <dl className="engineering-gates">{Object.entries(gates).map(([key,label])=><div key={key}><dt>{label}</dt><dd>{stored.eligibility[key as keyof typeof gates]?'Cumple':'Bloqueado'}</dd></div>)}</dl>{stored.eligibility.blocked_reasons.map((b,i)=><p className="engineering-error" key={i}>{b.code}: {b.message}</p>)}
    {p.items.length===0?<p>Sin acciones propuestas.</p>:p.items.map(item=><article className="engineering-proposal-item" key={item.candidate_id}><h4>{label(item.kind)} · {label(item.code)}</h4><EngineeringIdentifier value={item.candidate_id} label="Candidato"/><p>{label(item.reason)}</p><p>{label(item.evaluation.description)}</p><dl><dt>Criterio</dt><dd>{label(item.evaluation.criterion)}</dd><dt>Condiciones</dt><dd>{item.evaluation.conditions.map(label).join(' · ')}</dd><dt>Referencia</dt><dd>{item.evaluation.baseline?`${item.evaluation.baseline.id} · r${item.evaluation.baseline.revision}`:'Sin referencia'}</dd><dt>Alternativa</dt><dd>{item.evaluation.alternative?`${item.evaluation.alternative.id} · r${item.evaluation.alternative.revision}`:'Sin alternativa'}</dd><dt>Límites</dt><dd>{item.evaluation.limits.map(label).join(' · ')}</dd><dt>Contraargumentos</dt><dd>{item.evaluation.counterarguments.map(label).join(' · ')}</dd></dl><EvidenceLinks references={item.evaluation.measurements}/>{item.parameters.map((v,i)=><p key={i}>{v.parameter}: {v.value_si} {v.unit} · setup {v.setup_id} r{v.revision}<EvidenceLinks references={v.support}/></p>)}{item.evidence_ids.map(id=><a key={id} className="engineering-reference" href={`#${evidenceAnchor(id)}`}>Evidencia {shortIdentifier(id)}</a>)}</article>)}
    <ContrastPanel sections={p.section_summaries} matrix={p.matrix}/>
    <details><summary>Índice de evidencias enlazadas</summary>{evidence.map(id=><p id={evidenceAnchor(id)} key={id}><code>{id}</code> · referencia persistida del snapshot, sin señal bruta.</p>)}</details>
    <ul>{p.limitations.map((l,i)=><li key={i}>{label(l)}</li>)}</ul>
  </section>;
}
