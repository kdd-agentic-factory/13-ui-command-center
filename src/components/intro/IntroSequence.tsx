/**
 * IntroSequence Ã¢â‚¬â€ "the telemetry lap": the award entry of KDD Moto Intelligence.
 *
 * Beat chain (~4.5s, declarative CSS timings):
 *   0.25s  the cyan racing line draws the real Mugello silhouette while a
 *          rider dot laps it (offset-path on the same deterministic geometry
 *          the circuit cards use) and live telemetry numbers count up
 *   2.15s  KDD MOTO INTELLIGENCE sweeps in through a mask, red underline
 *   2.85s  positioning line fades in
 *   3.05s  capability chips arrive staggered
 *   4.6s   fades out into role selection
 *
 * Respectful by design: Skip is available from the first second, it plays
 * once per browser session (sessionStorage), and prefers-reduced-motion
 * resolves instantly.
 */
import { useEffect, useRef, useState } from 'react';
import { miniTrackPath } from '../MiniTrackMap';

const SEEN_KEY = 'kdd-intro-seen';
const MONO = 'JetBrains Mono, monospace';

function useCountUp(target: number, durationMs: number, startDelayMs: number): number {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now() + startDelayMs;
    const tick = (now: number) => {
      const p = Math.min(1, Math.max(0, (now - t0) / durationMs));
      setValue(Math.round(target * (1 - Math.pow(1 - p, 3)))); // ease-out cubic
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, startDelayMs]);
  return value;
}

export function IntroSequence({ onDone }: { onDone?: () => void }) {
  const [phase, setPhase] = useState<'playing' | 'fading' | 'gone'>(
    () => (typeof sessionStorage !== 'undefined' && sessionStorage.getItem(SEEN_KEY) ? 'gone' : 'playing'),
  );
  const fadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const d = miniTrackPath('mugello');

  const speed = useCountUp(312, 2000, 350);
  const lean = useCountUp(57, 2000, 600);
  const grip = useCountUp(94, 2000, 850);

  function finish() {
    try { sessionStorage.setItem(SEEN_KEY, '1'); } catch { /* private mode */ }
    setPhase('fading');
    // Own ref: the phase-effect cleanup must NOT clear this one, or onDone
    // would never fire after the fade.
    fadeTimer.current = setTimeout(() => { setPhase('gone'); onDone?.(); }, 620);
  }

  // Auto-finish (its cleanup clears only its own timer).
  useEffect(() => {
    if (phase !== 'playing') return;
    const reduced = typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches;
    const auto = setTimeout(finish, reduced ? 350 : 4600);
    return () => clearTimeout(auto);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  // Unmount-only: clear the pending fade.
  useEffect(() => () => { if (fadeTimer.current) clearTimeout(fadeTimer.current); }, []);

  if (phase === 'gone') return null;

  return (
    <div className={`iseq-root${phase === 'fading' ? ' iseq-done' : ''}`} data-testid="intro-sequence" aria-label="Intro">
      <div className="iseq-streak" />

      <div style={{ width: 'min(560px, 86vw)', textAlign: 'center', position: 'relative' }}>
        {/* The lap */}
        <svg className="iseq-track" viewBox="0 0 64 64" style={{ width: 'min(300px, 52vw)', margin: '0 auto', display: 'block', overflow: 'visible' }} aria-hidden>
          <path className="iseq-line" d={d} fill="none" stroke="#00B7FF" strokeWidth="1.4"
            strokeLinecap="round" strokeLinejoin="round"
            style={{ filter: 'drop-shadow(0 0 6px rgba(0,183,255,0.45))' }} />
          <circle className="iseq-rider" r="1.7" fill="#E10600"
            style={{ offsetPath: `path("${d}")`, filter: 'drop-shadow(0 0 5px rgba(225,6,0,0.8))' }} />
        </svg>

        {/* Live numbers under the lap */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 26, margin: '6px 0 18px', fontFamily: MONO, fontSize: 11.5 }} aria-hidden>
          <span style={{ color: 'var(--cyan)' }} className="metric-num">{speed} km/h</span>
          <span style={{ color: 'var(--yellow)' }} className="metric-num">{lean}Ã‚Â° lean</span>
          <span style={{ color: 'var(--grip)' }} className="metric-num">{grip}% grip</span>
        </div>

        {/* Title reveal */}
        <span className="iseq-title-mask">
          <span className="display-xxl" style={{ color: 'var(--text)' }}>KDD MOTO INTELLIGENCE</span>
        </span>
        <div className="iseq-underline" style={{ width: 120, margin: '10px auto 0' }} />
        <div className="iseq-sub" style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 12, lineHeight: 1.55 }}>
          Digital pit-wall for motorcycle telemetry, rider performance and race simulation.
        </div>

        {/* Capability chips */}
        <div className="iseq-chips" style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: 8, marginTop: 16 }}>
          {['LIVE TELEMETRY', 'CIRCUIT INTELLIGENCE', 'DIGITAL TWIN', 'ORACLE PIT-WALL'].map(c => (
            <span key={c} style={{ fontFamily: MONO, fontSize: 9.5, letterSpacing: '0.1em', color: 'var(--cyan)', border: '1px solid rgba(0,183,255,0.35)', borderRadius: 999, padding: '4px 12px' }}>
              {c}
            </span>
          ))}
        </div>
      </div>

      <button className="iseq-skip" onClick={finish}
        style={{
          position: 'absolute', right: 22, bottom: 20, cursor: 'pointer',
          fontFamily: MONO, fontSize: 10.5, letterSpacing: '0.08em',
          color: 'var(--text-muted)', background: 'rgba(255,255,255,0.04)',
          border: '1px solid var(--border)', borderRadius: 999, padding: '6px 14px',
        }}>
        SKIP INTRO →
      </button>
    </div>
  );
}
