import type { PipelineStage } from '../services/commandCenterData';
import { PanelHeader } from './PanelHeader';
import { StateTag } from './StateTag';

interface KDDPipelineViewProps {
  stages: PipelineStage[];
}

export function KDDPipelineView({ stages }: KDDPipelineViewProps) {
  const averageProgress = Math.round(
    stages.reduce((total, stage) => total + stage.progress, 0) / Math.max(stages.length, 1)
  );

  return (
    <section className="panel panel--narrow" aria-labelledby="kdd-pipeline-title">
      <PanelHeader
        kicker="KDD"
        title="Pipeline de conocimiento"
        titleId="kdd-pipeline-title"
        action={<span className="status-pill">{averageProgress}%</span>}
      />
      <div className="panel__body pipeline">
        {stages.map((stage) => (
          <article className="stage" key={stage.id}>
            <div>
              <span className="stage__name">{stage.name}</span>
              <span className="stage__owner">{stage.owner}</span>
            </div>
            <div className="progress" aria-label={`${stage.name} al ${stage.progress}%`}>
              <div className={`progress__bar state-${stage.state}`} style={{ width: `${stage.progress}%` }} />
            </div>
            <div className="stage__time">
              <StateTag state={stage.state} />
              <span className="stage__owner">{stage.lastRun}</span>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
