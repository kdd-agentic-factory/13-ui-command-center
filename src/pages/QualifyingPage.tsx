/**
 * QualifyingPage — KDD Qualifying Lab (the single-lap discipline).
 *
 * The ideal lap reconstructed from your best sectors vs pole, the time left on
 * the table, the tow plan, the tyre prep / out-lap, the track-evolution window
 * and the Q1/Q2 run plan — ending in the lap you already have.
 */
import { Timer, Wind, Circle, TrendingUp, ListChecks, Target } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildQualifying, qualityColor, fmtLap } from '../domain/qualifying';

const MONO = 'JetBrains Mono, monospace';

export function QualifyingPage() {
  const garage = useGarage();
  const { ctx, circuit } = useSessionContext();
  const q = buildQualifying(
    garage.profile.rider.name,
    `${garage.profile.bike.brand} ${garage.profile.bike.model}`,
    ctx.circuitName, circuit.turns, circuit.lengthKm,
  );
  const minGrip = Math.min(...q.evolution.map(e => e.gripPct));
  const maxGrip = Math.max(...q.evolution.map(e => e.gripPct));

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><Timer size={18} /> Qualifying Lab</h1>
          <p className="page-subtitle">The single-lap discipline — {q.combo}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pole probability</div>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: MONO, color: q.poleProb >= 0.4 ? 'var(--green)' : 'var(--yellow)' }}>{Math.round(q.poleProb * 100)}%</div>
        </div>
      </div>

      {/* verdict */}
      <div className="card mb-4" style={{ padding: 14, borderLeft: '3px solid var(--accent)' }}>
        <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>KDD verdict</div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{q.verdict}</div>
        <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, fontStyle: 'italic' }}>{q.punchline}</div>
      </div>

      {/* lap summary */}
      <div className="card mb-4" style={{ padding: 12, display: 'flex', gap: 26, flexWrap: 'wrap', alignItems: 'center' }}>
        {[['Pole ref', fmtLap(q.poleRef)], ['Your best', fmtLap(q.yourBest)], ['Gap to pole', `${q.gapToPole >= 0 ? '+' : ''}${q.gapToPole.toFixed(3)}`], ['Ideal lap', fmtLap(q.theoreticalBest)], ['On the table', `${q.timeOnTable.toFixed(3)}s`]].map(([k, v]) => (
          <div key={k as string}><div style={{ fontSize: 15, fontWeight: 800, fontFamily: MONO, color: k === 'Ideal lap' ? 'var(--green)' : 'var(--text)' }}>{v}</div><div style={{ fontSize: 8.5, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{k}</div></div>
        ))}
        {q.poleInReach && <div style={{ marginLeft: 'auto', fontSize: 10, fontFamily: MONO, color: 'var(--green)', border: '1px solid var(--green)', borderRadius: 4, padding: '3px 8px' }}>POLE IN REACH — IDEAL LAP BEATS POLE</div>}
      </div>

      {/* sectors + tow */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Target size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Sector splits · your best vs pole vs ideal</span></div>
          {q.sectors.map(s => {
            const delta = Math.round((s.yourBest - s.pole) * 1000) / 1000;
            const onTable = Math.round((s.yourBest - s.yourIdeal) * 1000) / 1000;
            return (
              <div key={s.sector} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 6 }}>
                <span style={{ color: 'var(--text)', width: 140 }}>{s.sector}</span>
                <span style={{ fontFamily: MONO, fontSize: 10, color: 'var(--text)', width: 56, textAlign: 'right' }}>{s.yourBest.toFixed(2)}</span>
                <span style={{ fontFamily: MONO, fontSize: 9, color: 'var(--text-muted)', width: 56, textAlign: 'right' }}>P {s.pole.toFixed(2)}</span>
                <span style={{ fontFamily: MONO, fontSize: 10, color: delta <= 0 ? 'var(--green)' : 'var(--accent)', width: 54, textAlign: 'right' }}>{delta >= 0 ? '+' : ''}{delta.toFixed(3)}</span>
                <span style={{ fontFamily: MONO, fontSize: 9, color: onTable > 0 ? 'var(--yellow)' : 'var(--text-muted)', flex: 1, textAlign: 'right' }}>{onTable > 0 ? `−${onTable.toFixed(3)} to find` : 'maxed'}</span>
              </div>
            );
          })}
          <div style={{ fontSize: 9.5, color: 'var(--text-muted)', marginTop: 4 }}>Δ vs pole (green = ahead) · last column = time left vs your own best in that sector.</div>
        </div>
        <div className="card" style={{ padding: 16, borderLeft: `3px solid ${qualityColor(q.tow.risk)}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><Wind size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Tow / slipstream</span></div>
          <div style={{ fontSize: 22, fontWeight: 800, fontFamily: MONO, color: 'var(--green)' }}>−{q.tow.gainS.toFixed(2)}s</div>
          <div style={{ fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)', marginBottom: 4 }}>target on push lap {q.tow.targetLap} · risk {q.tow.risk}</div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{q.tow.note}</div>
        </div>
      </div>

      {/* tyre prep + evolution */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}><Circle size={14} style={{ color: 'var(--violet)' }} /><span style={hdr}>Tyre prep · {q.tyrePrep.pushLaps} push laps</span></div>
          <div style={{ fontSize: 10.5, color: 'var(--text)', marginBottom: 4 }}><b>Out-lap:</b> {q.tyrePrep.outLap}</div>
          <div style={{ fontSize: 10.5, color: 'var(--text)', marginBottom: 4 }}><b>Window:</b> {q.tyrePrep.window}</div>
          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>{q.tyrePrep.note}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><TrendingUp size={14} style={{ color: 'var(--green)' }} /><span style={hdr}>Track evolution · pick the window</span></div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 64 }}>
            {q.evolution.map(e => {
              const h = ((e.gripPct - minGrip) / (maxGrip - minGrip || 1)) * 100;
              const best = e.minute === q.bestWindowMin;
              return (
                <div key={e.minute} title={`min ${e.minute}: ${e.gripPct}% grip`} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: '100%' }}>
                  <span style={{ width: '100%', height: `${Math.max(6, h)}%`, background: best ? 'var(--green)' : 'var(--cyan)', borderRadius: '2px 2px 0 0' }} />
                  <span style={{ fontSize: 8, fontFamily: MONO, color: best ? 'var(--green)' : 'var(--text-muted)', marginTop: 2 }}>{e.minute}'</span>
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 9.5, color: 'var(--green)', marginTop: 4 }}>Best grip window ≈ min {q.bestWindowMin} — time the new-soft run to land here.</div>
        </div>
      </div>

      {/* run plan */}
      <div className="card" style={{ padding: 16, marginTop: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><ListChecks size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Q1 / Q2 run plan</span></div>
        {q.runPlan.map(r => (
          <div key={r.run} style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 11, marginBottom: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: 999, background: qualityColor(r.quality), flexShrink: 0 }} />
            <span style={{ fontWeight: 700, color: 'var(--text)', width: 110 }}>{r.run}</span>
            <span style={{ fontFamily: MONO, fontSize: 9, color: 'var(--text-muted)', width: 50 }}>{r.laps} laps</span>
            <span style={{ fontSize: 9.5, fontFamily: MONO, color: 'var(--violet)', width: 80 }}>{r.tyre}</span>
            <span style={{ color: 'var(--text-muted)', flex: 1 }}>{r.note}</span>
          </div>
        ))}
      </div>

      <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 14, fontStyle: 'italic' }}>
        Representative single-lap model derived from sector splits + circuit shape. Not a live timing-screen feed.
      </div>
    </div>
  );
}

const hdr: React.CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' };
