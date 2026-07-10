/**
 * FederatedPage — Federated Motorsport Intelligence.
 *
 * Privacy-first comparative intelligence: percentiles, lap/corner/technique
 * benchmarks vs an anonymous similar-rider cohort, "riders like you improved
 * by—…", a learning benchmark and the federated Oracle context. In Private mode
 * comparisons are disabled (your data only); raw data is never exposed.
 */
import { useState, type CSSProperties } from 'react';
import { Network, Lock, Users, Sparkles, TrendingUp } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildFederated, percentileColor, vsColor, BENCHMARK_MODES, BenchmarkMode } from '../domain/federated';

export function FederatedPage() {
  const garage = useGarage();
  const { ctx } = useSessionContext();
  const f = buildFederated(garage.profile.rider.name, `${garage.profile.bike.brand} ${garage.profile.bike.model}`, ctx.circuitName);
  const [mode, setMode] = useState<BenchmarkMode>('federated');
  const comparing = mode !== 'private';
  const activeMode = BENCHMARK_MODES.find((candidate) => candidate.id === mode) ?? BENCHMARK_MODES[0];
  const percentileHeaderStyle = { '--pct-color': percentileColor(f.overallPercentile) } as CSSProperties;

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Network size={18} /> Federation</h1>
          <p className="page-subtitle">Anonymous benchmark layer for rider, bike and circuit decisions — {f.combo}</p>
        </div>
        <div className="federated-percentile-header" style={percentileHeaderStyle}>
          <div className="federated-percentile-header-label">Overall percentile · conf {f.confidence}%</div>
          <div className="federated-percentile-header-value">{comparing ? `${f.overallPercentile}th` : '—'}</div>
        </div>
      </div>

      {/* mode selector */}
      <div className="federated-modes">
        {BENCHMARK_MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} title={m.desc} type="button" aria-pressed={mode === m.id}
            className={`federated-mode-btn${mode === m.id ? ' is-active' : ''}`}>{m.label}</button>
        ))}
        <span className="federated-mode-desc">{activeMode.desc}</span>
      </div>

      {/* privacy status */}
      <div className="card federated-privacy mb-4">
        <div className="federated-privacy-header">
          <Lock size={13} />
          <span className="federated-privacy-label">Privacy status</span>
        </div>
        <div className="federated-privacy-items">
          {f.privacy.map(p => (
            <span key={p.field} className="federated-privacy-field">
              <span className="federated-privacy-key">{p.field}: </span>
              <span className={p.private ? 'federated-privacy-value--private' : 'federated-privacy-value--not-private'}>{p.status}</span>
            </span>
          ))}
        </div>
        <div className="federated-privacy-note">{f.cohortNote}</div>
      </div>

      {!comparing ? (
        <div className="card federated-private">
          <Lock size={20} />
          <div className="federated-private-title">Private mode — comparisons disabled.</div>
          <div className="federated-private-desc">KDD learns only from your own sessions. Choose Team, Federated or Academy above to unlock anonymous benchmark decisions without exposing raw data.</div>
        </div>
      ) : (
        <>
          {/* summary */}
          <div className="card federated-summary mb-4">
            <div className="federated-summary-group">Benchmark group: <span className="federated-summary-group-value">{f.group}</span></div>
            <div className="federated-summary-stats">
              <span><span className="federated-summary-stat-label">Strengths: </span><span className="federated-summary-stat-value--green">{f.strengths.join(', ')}</span></span>
              <span><span className="federated-summary-stat-label">Weaknesses: </span><span className="federated-summary-stat-value--red">{f.weaknesses.join(', ')}</span></span>
            </div>
            <div className="federated-summary-opportunity"><span className="federated-summary-opportunity-label">Main opportunity: </span><span className="federated-summary-opportunity-text">{f.mainOpportunity}</span> —· est. gain to top 20%: <span className="federated-summary-gain">{f.gainToTop20}</span></div>
          </div>

          <div className="grid-2 gap-4 items-start">
            {/* percentiles */}
            <div className="card federated-percentiles">
              <div className="federated-section-label">Performance percentiles</div>
              {f.percentiles.map(p => (
                <div key={p.metric} className="federated-percentile-row" style={{ '--bar-color': percentileColor(p.percentile), '--bar-fill-width': `${p.percentile}%` } as CSSProperties}>
                  <span className="federated-percentile-metric">{p.metric}</span>
                  <div className="federated-percentile-bar-track">
                    <div className="federated-percentile-bar-fill" />
                  </div>
                  <span className="federated-percentile-value">{p.percentile}th</span>
                </div>
              ))}
            </div>

            {/* technique + lap */}
            <div className="flex-col gap-4">
              <div className="card federated-lap">
                <div className="federated-section-label">Lap benchmark</div>
                <div className="federated-lap-grid">
                  <span>
                    <div className="federated-lap-col-label">YOU</div>
                    <span className="federated-lap-col-value federated-lap-your-value">{f.lap.yourBest}</span>
                  </span>
                  <span>
                    <div className="federated-lap-col-label">MEDIAN</div>
                    <span className="federated-lap-col-value federated-lap-median-value">{f.lap.groupMedian}</span>
                  </span>
                  <span>
                    <div className="federated-lap-col-label">TOP 20%</div>
                    <span className="federated-lap-col-value federated-lap-top-value">{f.lap.top20}</span>
                  </span>
                </div>
                <div className="federated-lap-diff">Main difference: {f.lap.mainDiff}</div>
              </div>
              <div className="card federated-technique">
                <div className="federated-section-label">Technique benchmark</div>
                {f.technique.map(t => (
                  <div key={t.skill} className="federated-technique-row" style={{ '--vs-color': vsColor(t.vs) } as CSSProperties}>
                    <span className="federated-technique-skill">{t.skill}</span>
                    <span className="federated-technique-score">{t.score}</span>
                    <span className="federated-technique-vs">{t.vs}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* corner benchmark */}
          <div className="card federated-corners">
            <div className="federated-section-label">Corner benchmark —· exit speed</div>
            {f.corners.map(c => {
              const span = Math.max(1, c.top20 - Math.min(c.yours, c.median) + 4);
              const at = (v: number) => `${((v - (Math.min(c.yours, c.median) - 2)) / span) * 100}%`;
              return (
                <div key={c.corner} className="federated-corner-row">
                  <div className="federated-corner-header">
                    <span className="federated-corner-name">{c.corner}</span>
                    <span className="federated-corner-value federated-corner-value--yours">you {c.yours}</span>
                    <span className="federated-corner-value federated-corner-value--median">med {c.median}</span>
                    <span className="federated-corner-value federated-corner-value--top">top {c.top20} {c.unit}</span>
                  </div>
                  <div className="federated-corner-bar">
                    <span className="federated-corner-marker" style={{ left: at(c.median) }} aria-label="Median marker" />
                    <span className="federated-corner-marker--top" style={{ left: at(c.top20) }} aria-label="Top 20 percent marker" />
                    <span className="federated-corner-dot" style={{ left: at(c.yours) }} aria-label="Your exit speed" />
                  </div>
                  <div className="federated-corner-limiter">{c.limiter}</div>
                </div>
              );
            })}
          </div>

          {/* riders like you + learning */}
          <div className="federated-insight-grid">
            <div className="card federated-insight-card">
              <div className="federated-insight-header federated-insight-header--green">
                <Users size={13} />
                <span className="federated-insight-label">Riders like you improved by</span>
              </div>
              <div className="federated-insight-value">{f.ridersLikeYou.action}</div>
              <div className="federated-insight-stats">
                <span><span className="federated-insight-stat-label">Avg gain: </span><span className="federated-insight-stat-num">{f.ridersLikeYou.avgGain}</span></span>
                <span><span className="federated-insight-stat-label">Risk: </span><span className="federated-insight-stat-num">{f.ridersLikeYou.riskImpact}</span></span>
                <span><span className="federated-insight-stat-label">Conf: </span><span className="federated-insight-stat-conf">{f.ridersLikeYou.confidence}</span></span>
              </div>
              <div className="federated-insight-corners">{f.ridersLikeYou.corners.join(' —· ')} —· based on anonymous aggregated sessions.</div>
            </div>
            <div className="card federated-insight-card">
              <div className="federated-insight-header federated-insight-header--cyan">
                <TrendingUp size={13} />
                <span className="federated-insight-label">Learning benchmark —· {f.learning.block}</span>
              </div>
              <div className="federated-learning-progress">
                <span>you <span className="federated-learning-your">{f.learning.yourProgress}</span></span>
                <span className="federated-learning-similar">similar {f.learning.similar}</span>
              </div>
              <div className="federated-learning-status">{f.learning.status}</div>
              <div className="federated-learning-next">{f.learning.nextStep}</div>
            </div>
          </div>

          {/* federated oracle */}
          <div className="card federated-oracle">
            <div className="federated-oracle-header">
              <Sparkles size={14} />
              <span className="federated-oracle-label">Oracle federated context —· {f.confidence}%</span>
            </div>
            <div className="federated-oracle-body">{f.oracleContext}</div>
            <div className="federated-oracle-mission">Recommended mission: {f.recommendedMission}</div>
          </div>
        </>
      )}
    </div>
  );
}

export default FederatedPage;
