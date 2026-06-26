/**
 * LeanAngleHUD (engineer report v2 Â§6) â€” lean is the identity metric of a
 * motorcycle, so it gets its own HUD: a semicircular gauge with the live lean,
 * the session max, the best-lap max, the apex target window, and a left/right
 * corner-average comparison (asymmetry tells you which side you trust less).
 * Risk is shown with colour + an explicit label (WCAG).
 *
 * KEY DESIGN DECISION: "Apex target" must specify APEX (52-55Â°) because the
 * lean value OUTSIDE a corner (approach, straight) is naturally much lower.
 * A target without context creates false alarms.
 */

interface LeanAngleHUDProps {
  lean: number;         // signed degrees: + = right, âˆ’ = left
  maxLean?: number;     // session max (magnitude)
  bestMax?: number;     // best-lap max (magnitude)
  targetLo?: number;
  targetHi?: number;
  leftAvg?: number;
  rightAvg?: number;
  phase?: string;       // current corner phase: 'approach' | 'braking' | 'apex' | 'exit' | 'straight'
  rearTemp?: number;    // for AI note context (pass rear tyre temp)
}

const MAXÎ¸ = 64;
const CX = 110, CY = 122, R = 94;
const rad = (d: number) => (d * Math.PI) / 180;
const pt = (deg: number, r: number) => [CX + r * Math.sin(rad(deg)), CY - r * Math.cos(rad(deg))];

function arc(a: number, b: number, r: number): string {
  const [x1, y1] = pt(a, r);
  const [x2, y2] = pt(b, r);
  const large = Math.abs(b - a) > 180 ? 1 : 0;
  return `M ${x1.toFixed(1)} ${y1.toFixed(1)} A ${r} ${r} 0 ${large} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}`;
}

export function LeanAngleHUD({
  lean, maxLean = 57.2, bestMax = 55.6, targetLo = 52, targetHi = 55,
  leftAvg = 51.2, rightAvg = 48.7, phase, rearTemp,
}: LeanAngleHUDProps) {
  const mag = Math.abs(lean);
  const clamped = Math.max(-MAXÎ¸, Math.min(MAXÎ¸, lean));
  const risk = mag > 56 ? { t: 'HIGH', c: 'var(--accent)' } : mag > 50 ? { t: 'MEDIUM', c: 'var(--yellow)' } : { t: 'LOW', c: 'var(--green)' };
  const [nx, ny] = pt(clamped, R - 14);
  const asym = Math.abs(leftAvg - rightAvg);
  const maxBar = 64;

  const isApproach = phase === 'approach' || phase === 'straight' || phase === 'braking';
  const isApex = phase === 'apex';
  const isExit = phase === 'exit';

  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">Lean Angle</span>
        <span className="badge" style={{ background: `color-mix(in srgb, ${risk.c} 15%, transparent)`, color: risk.c }}>RISK Â· {risk.t}</span>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginTop: 6 }}>
        <svg width="220" height="140" viewBox="0 0 220 140" style={{ flex: 'none' }}>
          {/* background arc */}
          <path d={arc(-MAXÎ¸, MAXÎ¸, R)} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="9" strokeLinecap="round" />
          {/* target window (both sides) */}
          <path d={arc(targetLo, targetHi, R)} fill="none" stroke="var(--green)" strokeWidth="9" strokeLinecap="round" opacity="0.55" />
          <path d={arc(-targetHi, -targetLo, R)} fill="none" stroke="var(--green)" strokeWidth="9" strokeLinecap="round" opacity="0.55" />
          {/* ticks */}
          {[-60, -30, 0, 30, 60].map(d => {
            const [x1, y1] = pt(d, R - 6); const [x2, y2] = pt(d, R + 6);
            return <line key={d} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.25)" strokeWidth="1.5" />;
          })}
          {/* max + best markers */}
          {[{ v: maxLean, c: 'var(--accent)' }, { v: bestMax, c: 'var(--yellow)' }].flatMap(m =>
            [m.v, -m.v].map((s, i) => {
              const [x1, y1] = pt(s, R - 10); const [x2, y2] = pt(s, R + 4);
              return <line key={`${m.c}${i}`} x1={x1} y1={y1} x2={x2} y2={y2} stroke={m.c} strokeWidth="2" />;
            }))}
          {/* needle */}
          <line x1={CX} y1={CY} x2={nx} y2={ny} stroke={risk.c} strokeWidth="3.5" strokeLinecap="round" />
          <circle cx={CX} cy={CY} r="5" fill="#0B0D12" stroke={risk.c} strokeWidth="2" />
          {/* value */}
          <text x={CX} y={CY - 26} textAnchor="middle" fill="var(--text)" fontSize="26" fontWeight="800" fontFamily="var(--font-mono)">{mag.toFixed(1)}Â°</text>
          <text x={CX} y={CY - 12} textAnchor="middle" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)" letterSpacing="1.5">{lean >= 0 ? 'RIGHT' : 'LEFT'}</text>
        </svg>

        <div style={{ flex: 1, minWidth: 160, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {[
              { l: 'Session max', v: `${maxLean.toFixed(1)}Â°`, c: 'var(--accent)' },
              { l: 'Best-lap max', v: `${bestMax.toFixed(1)}Â°`, c: 'var(--yellow)' },
              { l: 'Apex target', v: `${targetLo}â€“${targetHi}Â°`, c: 'var(--green)' },
              { l: 'Current', v: `${mag.toFixed(1)}Â°`, c: risk.c },
            ].map(s => (
              <div key={s.l} className="stat-tile">
                <div className="stat-tile__label">{s.l}</div>
                <span className="stat-tile__value" style={{ fontSize: 16, color: s.c }}>{s.v}</span>
              </div>
            ))}
          </div>

          {/* Left / right asymmetry */}
          <div style={{ marginTop: 2 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>
              <span>LEFT {leftAvg.toFixed(1)}Â°</span>
              <span style={{ color: asym > 2 ? 'var(--yellow)' : 'var(--text-dim)' }}>ASYMMETRY {asym.toFixed(1)}Â°</span>
              <span>RIGHT {rightAvg.toFixed(1)}Â°</span>
            </div>
            <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
              <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)', display: 'flex', justifyContent: 'flex-end' }}>
                <div style={{ width: `${(leftAvg / maxBar) * 100}%`, height: '100%', borderRadius: 4, background: 'var(--blue)' }} />
              </div>
              <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }}>
                <div style={{ width: `${(rightAvg / maxBar) * 100}%`, height: '100%', borderRadius: 4, background: 'var(--purple)' }} />
              </div>
            </div>
          </div>

          {/* Phase & AI note */}
          {phase && (
            <div style={{
              marginTop: 2, padding: '5px 8px', borderRadius: 'var(--radius)',
              background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border)',
              fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                <span>Phase: <strong style={{ color: 'var(--text-muted)', textTransform: 'capitalize' }}>{phase}</strong></span>
                {isApproach && <span style={{ color: 'var(--green)' }}>Low lean normal</span>}
                {isApex && <span style={{ color: 'var(--yellow)' }}>Target window</span>}
                {isExit && <span style={{ color: 'var(--blue)' }}>Pickup phase</span>}
              </div>
              <div style={{ color: 'var(--text-dim)' }}>
                {isApproach && `Current lean is normal for ${phase}. Apex target applies mid-corner only.`}
                {isApex && `Target apex lean: ${targetLo}â€“${targetHi}Â°. Stay within window.`}
                {isExit && `Reduce lean as throttle opens. Risk increases above 55Â° with rear tyre >116Â°C.`}
                {!phase && `Apex target applies in mid-corner; lower values are normal on straights.`}
                {rearTemp && rearTemp > 116 && <span style={{ color: 'var(--accent)' }}> Â· Rear tyre thermal risk active</span>}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
