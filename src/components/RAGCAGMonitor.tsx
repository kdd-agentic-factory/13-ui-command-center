import type { RetrievalMetric } from '../services/commandCenterData';
import { PanelHeader } from './PanelHeader';
import { StateTag } from './StateTag';

interface RAGCAGMonitorProps {
  metrics: RetrievalMetric[];
}

export function RAGCAGMonitor({ metrics }: RAGCAGMonitorProps) {
  return (
    <section className="panel panel--medium" aria-labelledby="rag-cag-title">
      <PanelHeader
        kicker="RAG / CAG"
        title="Memoria, retrieval y cache"
        titleId="rag-cag-title"
        action={<StateTag state="healthy" />}
      />
      <div className="panel__body metric-grid">
        {metrics.map((metric) => (
          <article className="retrieval-metric" key={metric.label}>
            <div className="status-pill">
              <span className={`dot state-${metric.state}`} aria-hidden="true" />
              {metric.label}
            </div>
            <strong className="retrieval-metric__value">{metric.value}</strong>
            <span className="row-subtitle">{metric.detail}</span>
          </article>
        ))}
      </div>
    </section>
  );
}
