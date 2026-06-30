/**
 * FederatedPage — Federated Motorsport Intelligence.
 *
 * Privacy-first comparative intelligence: percentiles, lap/corner/technique
 * benchmarks vs an anonymous similar-rider cohort, "riders like you improved
 * by—…", a learning benchmark and the federated Oracle context. In Private mode
 * comparisons are disabled (your data only); raw data is never exposed.
 */
import { useState } from 'react';
import { Network, Lock, Users, Sparkles, TrendingUp } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildFederated, percentileColor, vsColor, BENCHMARK_MODES, BenchmarkMode } from '../domain/federated';

const MONO = 'JetBrains Mono, monospace';

export function FederatedPage() {
  const garage = useGarage();
  const { ctx } = useSessionContext();
  const f = buildFederated(garage.profile.rider.name, `${garage.profile.bike.brand} ${garage.profile.bike.model}`, ctx.circuitName);
  const [mode, setMode] = useState<BenchmarkMode>('federated');
  const comparing = mode !== 'private';

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Network size={18} /> Federated Motorsport Intelligence</h1>
          <p className="page-subtitle">Collective racing intelligence, private by design — {f.combo}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Overall percentile —· conf {f.confidence}%</div>
          <div style={{ fontSize: 26, fontWeight: 800, fontFamily: MONO, color: percentileColor(f.overallPercentile) }}>{comparing ? `${f.overallPercentile}th` : '—'}</div>
        </div>
      </div>

      {/* mode selector */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 12 }}>
        {BENCHMARK_MODES.map(m => (
          <button key={m.id} onClick={() => setMode(m.id)} title={m.desc}
            style={{ fontSize: 10.5, fontFamily: MONO, padding: '4px 10px', borderRadius: 'var(--radius)', cursor: 'pointer',
              background: mode === m.id ? 'rgba(0,183,255,0.12)' : 'transparent', border: `1px solid ${mode === m.id ? 'var(--cyan)' : 'var(--border)'}`, color: mode === m.id ? 'var(--cyan)' : 'var(--text-muted)' }}>{m.label}</button>
        ))}
        <span style={{ fontSize: 10, color: 'var(--text-muted)', alignSelf: 'center', marginLeft: 4 }}>{BENCHMARK_MODES.find(m => m.id === mode)!.desc}</span>
      </div>

      {/* privacy status */}
      <div className="card mb-4" style={{ padding: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
          <Lock size={13} style={{ color: 'var(--green)' }} />
          <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Privacy status</span>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
          {f.privacy.map(p => (
            <span key={p.field} style={{ fontSize: 10.5, fontFamily: MONO }}>
              <span style={{ color: 'var(--text-muted)' }}>{p.field}: </span>
              <span style={{ color: p.private ? 'var(--green)' : 'var(--cyan)' }}>{p.status}</span>
            </span>
          ))}
        </div>
        <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 6 }}>{f.cohortNote}</div>
      </div>

      {!comparing ? (
        <div className="card" style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)' }}>
          <Lock size={20} style={{ color: 'var(--green)' }} />
          <div style={{ fontSize: 13, color: 'var(--text)', marginTop: 8 }}>Private mode — comparisons disabled.</div>
          <div style={{ fontSize: 11, marginTop: 4 }}>KDD learns only from your own sessions. Switch to Team, Federated or Academy to benchmark against anonymous similar-rider patterns.</div>
        </div>
      ) : (
        <>
          {/* summary */}
          <div className="card mb-4" style={{ padding: 14 }}>
            <div style={{ fontSize: 10.5, fontFamily: MONO, color: 'var(--text-muted)' }}>Benchmark group: <span style={{ color: 'var(--text)' }}>{f.group}</span></div>
            <div style={{ display: 'flex', gap: 24, marginTop: 8, fontSize: 11.5, flexWrap: 'wrap' }}>
              <span><span style={{ color: 'var(--text-muted)' }}>Strengths: </span><span style={{ color: 'var(--green)' }}>{f.strengths.join(', ')}</span></span>
              <span><span style={{ color: 'var(--text-muted)' }}>Weaknesses: </span><span style={{ color: 'var(--accent)' }}>{f.weaknesses.join(', ')}</span></span>
            </div>
            <div style={{ fontSize: 11.5, marginTop: 6 }}><span style={{ color: 'var(--text-muted)' }}>Main opportunity: </span><b style={{ color: 'var(--text)' }}>{f.mainOpportunity}</b> —· est. gain to top 20%: <span style={{ color: 'var(--green)', fontFamily: MONO }}>{f.gainToTop20}</span></div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>
            {/* percentiles */}
            <div className="card" style={{ padding: 16 }}>
              <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 12 }}>Performance percentiles</div>
              {f.percentiles.map(p => (
                <div key={p.metric} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ width: 130, fontSize: 11, color: 'var(--text)' }}>{p.metric}</span>
                  <div style={{ flex: 1, height: 6, borderRadius: 3, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                    <div style={{ width: `${p.percentile}%`, height: '100%', background: percentileColor(p.percentile) }} />
                  </div>
                  <span style={{ width: 34, textAlign: 'right', fontSize: 10.5, fontFamily: MONO, color: percentileColor(p.percentile) }}>{p.percentile}th</span>
                </div>
              ))}
            </div>

            {/* technique + lap */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="card" style={{ padding: 16 }}>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Lap benchmark</div>
                <div style={{ display: 'flex', gap: 18, fontSize: 12 }}>
                  <span><div style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)' }}>YOU</div><span style={{ fontFamily: MONO, color: 'var(--text)' }}>{f.lap.yourBest}</span></span>
                  <span><div style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)' }}>MEDIAN</div><span style={{ fontFamily: MONO, color: 'var(--text-muted)' }}>{f.lap.groupMedian}</span></span>
                  <span><div style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)' }}>TOP 20%</div><span style={{ fontFamily: MONO, color: 'var(--green)' }}>{f.lap.top20}</span></span>
                </div>
                <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 6 }}>Main difference: {f.lap.mainDiff}</div>
              </div>
              <div className="card" style={{ padding: 16 }}>
                <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>Technique benchmark</div>
                {f.technique.map(t => (
                  <div key={t.skill} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 4 }}>
                    <span style={{ flex: 1, color: 'var(--text)' }}>{t.skill}</span>
                    <span style={{ fontFamily: MONO, color: 'var(--text)' }}>{t.score}</span>
                    <span style={{ fontSize: 9.5, fontFamily: MONO, color: vsColor(t.vs), width: 56, textAlign: 'right' }}>{t.vs}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* corner benchmark */}
          <div className="card" style={{ padding: 16, marginTop: 14 }}>
            <div style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 10 }}>Corner benchmark —· exit speed</div>
            {f.corners.map(c => {
              const span = Math.max(1, c.top20 - Math.min(c.yours, c.median) + 4);
              const at = (v: number) => `${((v - (Math.min(c.yours, c.median) - 2)) / span) * 100}%`;
              return (
                <div key={c.corner} style={{ marginBottom: 10 }}>
                  <div style={{ display: 'flex', gap: 8, fontSize: 11 }}>
                    <span style={{ fontWeight: 700, color: 'var(--text)', flex: 1 }}>{c.corner}</span>
                    <span style={{ fontFamily: MONO, color: 'var(--text)' }}>you {c.yours}</span>
                    <span style={{ fontFamily: MONO, color: 'var(--text-muted)' }}>med {c.median}</span>
                    <span style={{ fontFamily: MONO, color: 'var(--green)' }}>top {c.top20} {c.unit}</span>
                  </div>
                  <div style={{ position: 'relative', height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', marginTop: 3 }}>
                    <span style={{ position: 'absolute', left: at(c.median), top: -1, bottom: -1, width: 1, background: 'var(--text-muted)' }} />
                    <span style={{ position: 'absolute', left: at(c.top20), top: -1, bottom: -1, width: 2, background: 'var(--green)' }} />
                    <span style={{ position: 'absolute', left: at(c.yours), top: -2, width: 9, height: 9, borderRadius: 999, background: 'var(--cyan)', transform: 'translateX(-4px)' }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{c.limiter}</div>
                </div>
              );
            })}
          </div>

          {/* riders like you + learning */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 14 }}>
            <div className="card" style={{ padding: 16,
 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <Users size={13} style={{ color: 'var(--green)' }} />
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Riders like you improved by</span>
              </div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{f.ridersLikeYou.action}</div>
              <div style={{ display: 'flex', gap: 16, marginTop: 6, fontSize: 11 }}>
                <span><span style={{ color: 'var(--text-muted)' }}>Avg gain: </span><span style={{ color: 'var(--green)', fontFamily: MONO }}>{f.ridersLikeYou.avgGain}</span></span>
                <span><span style={{ color: 'var(--text-muted)' }}>Risk: </span><span style={{ color: 'var(--green)' }}>{f.ridersLikeYou.riskImpact}</span></span>
                <span><span style={{ color: 'var(--text-muted)' }}>Conf: </span>{f.ridersLikeYou.confidence}</span>
              </div>
              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{f.ridersLikeYou.corners.join(' —· ')} —· based on anonymous aggregated sessions.</div>
            </div>
            <div className="card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <TrendingUp size={13} style={{ color: 'var(--cyan)' }} />
                <span style={{ fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Learning benchmark —· {f.learning.block}</span>
              </div>
              <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                <span>you <b style={{ color: 'var(--green)' }}>{f.learning.yourProgress}</b></span>
                <span style={{ color: 'var(--text-muted)' }}>similar {f.learning.similar}</span>
              </div>
              <div style={{ fontSize: 11.5, color: 'var(--green)', marginTop: 4 }}>{f.learning.status}</div>
              <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginTop: 4 }}>{f.learning.nextStep}</div>
            </div>
          </div>

          {/* federated oracle */}
          <div className="card" style={{ padding: 16, marginTop: 14, background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.3)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
              <Sparkles size={14} style={{ color: 'var(--violet)' }} />
              <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--violet)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Oracle federated context —· {f.confidence}%</span>
            </div>
            <div style={{ fontSize: 12, color: 'var(--text)', lineHeight: 1.55 }}>{f.oracleContext}</div>
            <div style={{ fontSize: 11.5, color: 'var(--green)', marginTop: 6 }}>Recommended mission: {f.recommendedMission}</div>
          </div>
        </>
      )}
    </div>
  );
}

export default FederatedPage;
