import type {EngineeringReport} from '../../domain/engineeringSession';
import {reportSuspensionEvidence} from '../../domain/chassisReport';
import {FrozenSuspensionEvidence} from './FrozenSuspensionEvidence';
import {engineeringLabel} from './engineeringPresentation';

export function ReportSuspensionEvidence({report}: {report: EngineeringReport}) {
  const evidence = reportSuspensionEvidence(report.snapshot);
  if (!evidence.length) return null;
  const byId = new Map(evidence.map(row => [row.id, row]));
  const proposals = report.proposal?.proposal.items ?? [];
  const sections = report.proposal?.proposal.section_summaries ?? report.synthesis?.report?.section_summaries ?? [];
  const hypotheses = sections.flatMap(section => section.positions.flatMap(position =>
    (position.hypotheses_with_references ?? []).map(hypothesis => ({
      title: engineeringLabel(hypothesis.code),
      references: hypothesis.references.map(reference => reference.evidence_id),
    })),
  ));
  function citations(ids: string[]) {
    const rows = [...new Set(ids)].flatMap(id => {
      const row = byId.get(id);
      return row ? [row] : [];
    });
    if (!rows.length) return null;
    return <details>
      <summary>Ver evidencia congelada</summary>
      <p>Reproducción para ingeniería · sesión r{report.session_revision}
        {report.run && <> · Snapshot <code>{report.run.snapshot_id}</code></>}
      </p>
      <ul>{rows.map(row => <li key={row.id}><FrozenSuspensionEvidence row={row} /></li>)}</ul>
    </details>;
  }
  return <>
    {proposals.length > 0 && <section aria-label="Próximas comprobaciones propuestas">
      <h4>Próximas comprobaciones propuestas</h4>
      <ul>{proposals.map(item => <li key={item.candidate_id}>
        <p>{item.evaluation.description}</p>
        <p>Criterio · {engineeringLabel(item.evaluation.criterion)}</p>
        {item.evaluation.conditions.length > 0 && <p>Condiciones · {item.evaluation.conditions.map(engineeringLabel).join(' · ')}</p>}
        {item.evaluation.limits.length > 0 && <p>Límites · {item.evaluation.limits.map(engineeringLabel).join(' · ')}</p>}
        {citations([
          ...item.evidence_ids,
          ...item.evaluation.measurements.map(reference => reference.evidence_id),
          ...item.parameters.flatMap(parameter => parameter.support.map(reference => reference.evidence_id)),
        ])}
      </li>)}</ul>
    </section>}
    {hypotheses.length > 0 && <details>
      <summary>Hipótesis del informe</summary>
      <ul>{hypotheses.map((hypothesis, index) => <li key={index}>
        {hypothesis.title}
        {citations(hypothesis.references)}
      </li>)}</ul>
    </details>}
    <details>
      <summary>Evidencia de suspensión ({evidence.length})</summary>
      <ul>{evidence.map(row => <li key={row.id}><FrozenSuspensionEvidence row={row} /></li>)}</ul>
    </details>
  </>;
}
