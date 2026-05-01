import type { ReactNode } from 'react';

interface PanelHeaderProps {
  title: string;
  kicker: string;
  titleId: string;
  action?: ReactNode;
}

export function PanelHeader({ title, kicker, titleId, action }: PanelHeaderProps) {
  return (
    <header className="panel__header">
      <div>
        <span className="panel__kicker">{kicker}</span>
        <h2 className="panel__title" id={titleId}>
          {title}
        </h2>
      </div>
      {action}
    </header>
  );
}
