/**
 * ChampionshipPage â€” KDD Championship Command (Season & Title Intelligence).
 *
 * The season altitude: standings with form, the title maths and magic number,
 * the live what-if title scenarios, the MotoGP engine-allocation constraint,
 * the rider penalty-point tally and the concession tiers â€” ending in one call
 * on what the race in front of you does to the championship.
 */
import { Trophy, Cpu, AlertTriangle, Award, TrendingUp } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { buildChampionship, trendColor, engineColor } from '../domain/championship';

const MONO = 'JetBrains Mono, monospace';
const arrow = (t: 'up' | 'flat' | 'down') => t === 'up' ? 'â–²' : t === 'down' ? 'â–¼' : 'â€“';
const posColor = (p: string) => p === '1' ? 'var(--green)' : p === 'DNF' ? 'var(--accent)' : 'var(--text-muted)';

export function ChampionshipPage() {
  const garage = useGarage();
  const c = buildChampionship(garage.profile.rider.name, `${garage.profile.bike.brand} ${garage.profile.bike.model}`);

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Trophy size={18} /> Championship Command</h1>
          <p className="page-subtitle">Round {c.round} of {c.totalRounds} Â· {c.racesRemaining} to go Â· {c.pointsAvailable} pts available â€” {c.combo}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Your position</div>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: MONO, color: c.you.pos === 1 ? 'var(--green)' : 'var(--text)' }}>P{c.you.pos} <span style={{ fontSize: 13, color: trendColor(c.you.trend) }}>{arrow(c.you.trend)}</span></div>
        </div>
      </div>

      {/* verdict */}
      <div className="card mb-4" style={{ padding: 14,
 }}>
        <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>KDD verdict</div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{c.verdict}</div>
        <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, fontStyle: 'italic' }}>{c.punchline}</div>
      </div>

      {/* title maths */}
      <div className="card mb-4" style={{ padding: 12, display: 'flex', gap: 26, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['Pts to leader', c.titleMath.pointsToLeader], ['Max swing / wknd', c.titleMath.maxSwingPerWeekend], ['Magic number', c.titleMath.magicNumber], ['Your points', c.you.points]].map(([k, v]) => (
          <div key={k as string}><div style={{ fontSize: 16, fontWeight: 800, fontFamily: MONO, color: 'var(--text)' }}>{v}</div><div style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{k}</div></div>
        ))}
        <div style={{ marginLeft: 'auto', fontSize: 10, fontFamily: MONO, color: c.titleMath.inControl ? 'var(--green)' : 'var(--yellow)', border: `1px solid ${c.titleMath.inControl ? 'var(--green)' : 'var(--yellow)'}`, borderRadius: 4, padding: '3px 8px' }}>
          {c.titleMath.inControl ? 'IN CONTROL OF YOUR DESTINY' : c.you.inContention ? 'MATHEMATICALLY ALIVE' : 'OUT OF CONTENTION'}
        </div>
      </div>

      {/* standings + scenarios */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Trophy size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Standings Â· last 5</span></div>
          {c.standings.map(s => (
            <div key={s.pos} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 6, padding: s.isYou ? '3px 6px' : '0 6px', background: s.isYou ? 'var(--bg-surface)' : 'transparent', borderRadius: 5, border: s.isYou ? '1px solid var(--border)' : '1px solid transparent' }}>
              <span style={{ fontFamily: MONO, fontSize: 11, color: s.pos === 1 ? 'var(--green)' : 'var(--text-muted)', width: 22 }}>P{s.pos}</span>
              <span style={{ fontWeight: 700, color: s.isYou ? 'var(--accent)' : 'var(--text)', width: 88 }}>{s.rider}{s.isYou && ' â—„'}</span>
              <span style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', width: 58 }}>{s.team}</span>
              <span style={{ fontFamily: MONO, fontSize: 11, color: 'var(--text)', width: 38, textAlign: 'right' }}>{s.points}</span>
              <span style={{ fontFamily: MONO, fontSize: 9, color: 'var(--text-muted)', width: 40, textAlign: 'right' }}>{s.gap === 0 ? 'â€”' : `+${s.gap}`}</span>
              <span style={{ color: trendColor(s.trend), width: 14, textAlign: 'center' }}>{arrow(s.trend)}</span>
              <span style={{ display: 'flex', gap: 3, marginLeft: 'auto' }}>
                {s.form.map((f, i) => <span key={i} style={{ fontSize: 8, fontFamily: MONO, color: posColor(f), width: 18, textAlign: 'center' }}>{f}</span>)}
              </span>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><TrendingUp size={14} style={{ color: 'var(--violet)' }} /><span style={hdr}>Title scenarios</span></div>
          {c.scenarios.map(sc => (
            <div key={sc.label} style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'baseline' }}>
              <span style={{ width: 7, height: 7, borderRadius: 999, background: sc.favourable ? 'var(--green)' : 'var(--accent)', flexShrink: 0, marginTop: 3 }} />
              <div>
                <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)' }}>{sc.label}</div>
                <div style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--text-muted)' }}>{sc.condition}</div>
                <div style={{ fontSize: 10.5, color: sc.favourable ? 'var(--green)' : 'var(--accent)' }}>{sc.result}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* engine + penalties + concessions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16,
 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><Cpu size={14} style={{ color: engineColor(c.engine.status) }} /><span style={hdr}>Engine allocation</span></div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: MONO, color: 'var(--text)' }}>{c.engine.used}<span style={{ fontSize: 14, color: 'var(--text-muted)' }}> / {c.engine.allowed}</span></div>
          <div style={{ display: 'flex', gap: 4, margin: '6px 0' }}>
            {Array.from({ length: c.engine.allowed }, (_, i) => (
              <span key={i} style={{ flex: 1, height: 8, borderRadius: 2, background: i < c.engine.used ? engineColor(c.engine.status) : 'var(--border)' }} />
            ))}
          </div>
          <div style={{ fontSize: 9, fontFamily: MONO, color: engineColor(c.engine.status), textTransform: 'uppercase' }}>{c.engine.status} Â· {c.engine.avgMileageKm} km avg</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>{c.engine.note}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><AlertTriangle size={14} style={{ color: 'var(--yellow)' }} /><span style={hdr}>Penalty points</span></div>
          {c.penalties.map(p => (
            <div key={p.rider} style={{ marginBottom: 7 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11 }}>
                <span style={{ color: 'var(--text)', fontWeight: 600 }}>{p.rider}</span>
                <span style={{ fontFamily: MONO, color: p.points >= p.threshold * 0.5 ? 'var(--accent)' : 'var(--text-muted)' }}>{p.points}/{p.threshold}</span>
              </div>
              <div style={{ height: 5, background: 'var(--border)', borderRadius: 3, marginTop: 2 }}>
                <span style={{ display: 'block', height: '100%', width: `${(p.points / p.threshold) * 100}%`, background: p.points >= p.threshold * 0.5 ? 'var(--accent)' : 'var(--yellow)', borderRadius: 3 }} />
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', marginTop: 1 }}>{p.note}</div>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><Award size={14} style={{ color: 'var(--violet)' }} /><span style={hdr}>Concession tiers</span></div>
          {c.concessions.map(t => (
            <div key={t.tier} style={{ display: 'flex', gap: 8, fontSize: 10, marginBottom: 5, alignItems: 'baseline', opacity: t.isYou ? 1 : 0.7 }}>
              <span style={{ fontFamily: MONO, fontWeight: 800, color: t.isYou ? 'var(--accent)' : 'var(--text-muted)', width: 16 }}>{t.tier}</span>
              <div>
                <div style={{ color: 'var(--text)' }}>{t.testing}{t.isYou && <span style={{ fontSize: 8, fontFamily: MONO, color: 'var(--accent)', marginLeft: 5 }}>YOU</span>}</div>
                <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>{t.engineDev}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 14, fontStyle: 'italic' }}>
        Representative season model Â· 37 pts/weekend (25 GP + 12 Sprint win). Not a live results feed.
      </div>
    </div>
  );
}

const hdr: React.CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' };
