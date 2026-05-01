import type { Experiment } from '../services/commandCenterData';
import { PanelHeader } from './PanelHeader';
import { StateTag } from './StateTag';

interface ExperimentDashboardProps {
  experiments: Experiment[];
}

export function ExperimentDashboard({ experiments }: ExperimentDashboardProps) {
  return (
    <section className="panel panel--wide" aria-labelledby="experiments-title">
      <PanelHeader
        kicker="Experimentos"
        title="Comparativas en curso"
        titleId="experiments-title"
        action={<StateTag state="healthy" />}
      />
      <div className="panel__body experiment-list">
        {experiments.map((experiment) => (
          <article className="experiment-row" key={experiment.name}>
            <div>
              <strong>{experiment.name}</strong>
              <div className="row-subtitle">
                {experiment.owner} · {experiment.metric} · muestra {experiment.sampleSize}
              </div>
            </div>
            <span className={`delta state-${experiment.state}`}>{experiment.delta}</span>
            <StateTag state={experiment.state} />
          </article>
        ))}
      </div>
    </section>
  );
}
