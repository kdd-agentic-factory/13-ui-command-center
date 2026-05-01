import { Activity, RefreshCcw, Settings } from 'lucide-react';
import { CommandCenterPage } from '../pages/CommandCenterPage';

export function App() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand__eyebrow">13-ui-command-center</span>
          <h1 className="brand__title">KDD Agentic Factory Command Center</h1>
        </div>
        <div className="topbar__actions" aria-label="Acciones globales">
          <span className="status-pill state-warning">
            <span className="dot" aria-hidden="true" />
            1 bloqueo operativo
          </span>
          <button className="text-button" type="button">
            <RefreshCcw size={16} aria-hidden="true" />
            Sincronizar
          </button>
          <button className="icon-button" type="button" aria-label="Ver actividad">
            <Activity size={18} aria-hidden="true" />
          </button>
          <button className="icon-button" type="button" aria-label="Configurar centro de mando">
            <Settings size={18} aria-hidden="true" />
          </button>
        </div>
      </header>
      <CommandCenterPage />
    </div>
  );
}
