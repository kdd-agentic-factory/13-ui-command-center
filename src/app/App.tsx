import { Activity, RefreshCcw, Settings, Wifi, WifiOff } from 'lucide-react';
import { CommandCenterPage } from '../pages/CommandCenterPage';
import { useServiceData, type LiveData } from '../hooks/useServiceData';
import { trackRefreshClicked } from '../lib/analytics';

export function App() {
  const liveData = useServiceData();
  const { servicesUp, servicesTotal, loading, lastUpdated, refresh } = liveData;

  const allUp = servicesUp === servicesTotal;
  const anyUp = servicesUp > 0;
  const pillState = loading ? 'idle' : allUp ? 'healthy' : anyUp ? 'warning' : 'critical';

  const pillLabel = loading
    ? 'conectando…'
    : `${servicesUp}/${servicesTotal} servicios activos`;

  const lastSync = lastUpdated
    ? lastUpdated.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand__eyebrow">13-ui-command-center</span>
          <h1 className="brand__title">KDD Agentic Factory Command Center</h1>
        </div>
        <div className="topbar__actions" aria-label="Acciones globales">
          <span className={`status-pill state-${pillState}`} role="status" aria-live="polite">
            <span className="dot" aria-hidden="true" />
            {pillState === 'healthy' ? (
              <Wifi size={13} aria-hidden="true" />
            ) : (
              <WifiOff size={13} aria-hidden="true" />
            )}
            {pillLabel}
          </span>
          {lastSync && (
            <span className="topbar__timestamp" aria-label={`Última sincronización: ${lastSync}`}>
              {lastSync}
            </span>
          )}
          <button
            className="text-button"
            type="button"
            onClick={() => {
              trackRefreshClicked({ servicesUp, servicesTotal });
              refresh();
            }}
            aria-label="Sincronizar estado de servicios"
          >
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
      <CommandCenterPage liveData={liveData} />
    </div>
  );
}
