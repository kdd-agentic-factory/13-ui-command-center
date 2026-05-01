import { Puzzle } from 'lucide-react';
import type { SkillEntry } from '../services/commandCenterData';
import { PanelHeader } from './PanelHeader';
import { StateTag } from './StateTag';

interface SkillsRegistryViewProps {
  skills: SkillEntry[];
}

export function SkillsRegistryView({ skills }: SkillsRegistryViewProps) {
  return (
    <section className="panel panel--narrow" aria-labelledby="skills-title">
      <PanelHeader
        kicker="Skills"
        title="Registro operativo"
        titleId="skills-title"
        action={<span className="status-pill">{skills.length}</span>}
      />
      <div className="panel__body skill-list">
        {skills.map((skill) => (
          <article className="skill-row" key={skill.name}>
            <div>
              <strong className="agent-card__name">
                <Puzzle size={16} aria-hidden="true" />
                {skill.name}
              </strong>
              <span className="row-subtitle">
                {skill.scope} · v{skill.version} · {skill.lastUsed}
              </span>
            </div>
            <StateTag state={skill.state} />
          </article>
        ))}
      </div>
    </section>
  );
}
