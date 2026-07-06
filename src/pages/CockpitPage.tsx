/**
 * CockpitPage — Adaptive Pit-Wall Cockpit.
 *
 * The operational surface where KDD turns telemetry into track decisions.
 */
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, LayoutGrid, Sparkles, Zap } from 'lucide-react';
import { useNavigate } from '../context/NavContext';
import { getSessionContext } from '../domain/sessionContext';
import { decideCockpit, modeMeta, COCKPIT_SCENARIOS, type CockpitContext, type CockpitMode } from '../domain/cockpit';

type LayoutMode = 'adaptive' | 'manual' | 'hybrid';

function scenarioForSession(): string {
  const mode = getSessionContext().sessionMode;
  if (mode === 'demo') return 'live';
  if (mode === 'pre-gp') return 'pre';
  return 'live';
}

function modeClass(mode: CockpitMode): string {
  return `cockpit-mode--${mode}`;
}

function scoreTone(score: number): 'high' | 'medium' | 'low' {
  if (score >= 80) return 'high';
  if (score >= 60) return 'medium';
  return 'low';
}

function riskTone(risk: string): 'high' | 'medium' | 'low' {
  const normalized = risk.toLowerCase();
  if (normalized.includes('high')) return 'high';
  if (normalized.includes('medium')) return 'medium';
  return 'low';
}

export function CockpitPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [scenarioId, setScenarioId] = useState(scenarioForSession());
  const [layout, setLayout] = useState<LayoutMode>('adaptive');
  const [pinned, setPinned] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  const scenario = COCKPIT_SCENARIOS.find(s => s.id === scenarioId) ?? COCKPIT_SCENARIOS[0];
  const ctx: CockpitContext = scenario.ctx;
  const layoutOut = decideCockpit(ctx);
  const mm = modeMeta(layoutOut.mode);
  const showSuggestion = layout === 'hybrid' && layoutOut.suggestion && !pinned && !dismissed;
  const modeTone = modeClass(layoutOut.mode);
  const actionRisk = riskTone(layoutOut.nextBestAction.risk);

  return (
    <div className="page cockpit-page">
      <header className="cockpit-hero">
        <div>
          <h1 className="page-title cockpit-title"><LayoutGrid size={18} /> {t('cockpit.title', 'Adaptive Pit-Wall Cockpit')}</h1>
          <p className="page-subtitle">{t('cockpit.subtitle', 'Context-aware dashboard for race decisions — the dashboard adapts to the track, not the other way round')}</p>
        </div>
        <div className="cockpit-layout-switch" aria-label="Cockpit layout mode">
          {(['adaptive', 'hybrid', 'manual'] as LayoutMode[]).map(m => (
            <button
              key={m}
              type="button"
              className={`cockpit-chip${layout === m ? ' cockpit-chip--active' : ''}`}
              aria-pressed={layout === m}
              onClick={() => { setLayout(m); setDismissed(false); setPinned(false); }}
            >
              {m}
            </button>
          ))}
        </div>
      </header>

      <section className="cockpit-context" aria-label="Cockpit preview context">
        <span className="cockpit-label">{t('cockpit.context', 'Context')}</span>
        {COCKPIT_SCENARIOS.map(s => (
          <button
            key={s.id}
            type="button"
            className={`cockpit-chip cockpit-chip--scenario${s.id === scenarioId ? ' cockpit-chip--selected' : ''}`}
            aria-pressed={s.id === scenarioId}
            onClick={() => { setScenarioId(s.id); setDismissed(false); setPinned(false); }}
          >
            {s.label}
          </button>
        ))}
      </section>

      <section className={`cockpit-status card ${modeTone}`} aria-label="Current cockpit state">
        <div className="cockpit-status__main">
          <span className="cockpit-status__mode">{mm.label}</span>
          <span className="cockpit-status__trigger">{layoutOut.trigger}</span>
        </div>
        <blockquote className="cockpit-status__verdict">“{layoutOut.oracleVerdict}”</blockquote>
      </section>

      {showSuggestion && (
        <section className="cockpit-suggestion card" aria-label="Hybrid cockpit suggestion">
          <Sparkles size={15} className="cockpit-suggestion__icon" />
          <span>
            KDD suggests switching to <b>{modeMeta(layoutOut.suggestion!.toMode).label}</b> — {layoutOut.suggestion!.reason}
          </span>
          <div className="cockpit-suggestion__actions">
            <button type="button" className="cockpit-mini-btn cockpit-mini-btn--accept" onClick={() => setLayout('adaptive')}>{t('cockpit.accept', 'Accept')}</button>
            <button type="button" className="cockpit-mini-btn" onClick={() => setDismissed(true)}>{t('cockpit.ignore', 'Ignore')}</button>
            <button type="button" className="cockpit-mini-btn cockpit-mini-btn--pin" onClick={() => setPinned(true)}>{t('cockpit.pinCurrent', 'Pin current')}</button>
          </div>
        </section>
      )}

      <section className="cockpit-grid">
        <div className="cockpit-stack">
          <article className={`card cockpit-primary ${modeTone}`}>
            <span className="cockpit-label">{t('cockpit.primaryPanel', 'Primary panel')}</span>
            <div className="cockpit-primary__row">
              <div>
                <h2>{layoutOut.primary.label}</h2>
                <p>Current operating surface selected by KDD for this session context.</p>
              </div>
              <button type="button" className="cockpit-action-btn" onClick={() => navigate(layoutOut.primary.tab)}>
                {t('cockpit.open', 'Open')} <ArrowRight size={13} />
              </button>
            </div>

            <div className="cockpit-decision-chain" aria-label="Decision chain">
              {['Data', 'Event', 'Cause', 'Recommendation', 'Mission', 'Validation'].map(item => (
                <span key={item}>{item}</span>
              ))}
            </div>

            <span className="cockpit-label cockpit-label--section">{t('cockpit.supportingPanels', 'Supporting panels')}</span>
            <div className="cockpit-supporting">
              {layoutOut.supporting.map(s => (
                <button key={s.tab} type="button" className="cockpit-support-btn" onClick={() => navigate(s.tab)}>
                  {s.label}
                </button>
              ))}
            </div>
          </article>

          <article className={`card cockpit-next cockpit-risk--${actionRisk}`}>
            <div className="cockpit-next__header">
              <Zap size={15} />
              <span>{t('cockpit.nextBestAction', 'Next best action')}</span>
              <strong>{layoutOut.nextBestAction.priority}</strong>
            </div>
            <h2>{layoutOut.nextBestAction.action}</h2>
            <p>{layoutOut.nextBestAction.why}</p>
            <div className="cockpit-next__meta">
              <span><b>{t('cockpit.expected', 'Expected')}</b>{layoutOut.nextBestAction.expectedGain}</span>
              <span><b>{t('cockpit.risk', 'Risk')}</b>{layoutOut.nextBestAction.risk}</span>
            </div>
          </article>
        </div>

        <aside className="card cockpit-priority" aria-label="Priority engine live module scores">
          <div className="cockpit-priority__header">
            <span className="cockpit-label">{t('cockpit.priorityEngine', 'Priority engine')}</span>
            <strong>Live module scores</strong>
          </div>
          <div className="cockpit-priority__list">
            {layoutOut.priorities.slice(0, 9).map((p, index) => {
              const tone = scoreTone(p.score);
              return (
                <button
                  key={p.tab}
                  type="button"
                  className={`cockpit-priority-item cockpit-score--${tone}`}
                  onClick={() => navigate(p.tab)}
                  aria-label={`Open ${p.label}, priority score ${p.score}`}
                >
                  <span className="cockpit-priority-item__rank">{String(index + 1).padStart(2, '0')}</span>
                  <span className="cockpit-priority-item__label">{p.label}</span>
                  <span className="cockpit-priority-item__bar" aria-hidden="true"><span /></span>
                  <span className="cockpit-priority-item__score">{p.score}</span>
                </button>
              );
            })}
          </div>
          <p className="cockpit-priority__note">
            {layout === 'manual'
              ? t('cockpit.manualLayout', 'Manual layout — you pin the modules; the engine only advises.')
              : layout === 'hybrid'
                ? t('cockpit.hybridLayout', 'Hybrid — KDD suggests, you accept or pin.')
                : t('cockpit.adaptiveLayout', 'Adaptive — the cockpit reorganises automatically.')}
          </p>
        </aside>
      </section>
    </div>
  );
}
