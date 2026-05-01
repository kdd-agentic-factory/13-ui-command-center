import { stateLabels, type HealthState } from '../services/commandCenterData';

interface StateTagProps {
  state: HealthState;
}

export function StateTag({ state }: StateTagProps) {
  return (
    <span className={`tag state-${state}`}>
      <span className="dot" aria-hidden="true" />
      {stateLabels[state]}
    </span>
  );
}
