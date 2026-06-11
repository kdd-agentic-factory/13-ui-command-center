/**
 * BootSequence — pit-wall boot transition between the Launch Brief and the
 * dashboard: "Oracle preparing context" with progressive checks. Pure
 * theatre (~2s) but it sells the cockpit feeling; skippable by design via
 * the short duration.
 */
import { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Bot } from 'lucide-react';
import type { SessionContext } from '../domain/sessionContext';

const MONO = 'JetBrains Mono, monospace';

interface Props {
  ctx: SessionContext;
  onDone: () => void;
}

export function BootSequence({ ctx, onDone }: Props) {
  const steps = [
    `Loading ${ctx.circuitName} circuit geometry`,
    'Syncing telemetry sources',
    `Arming ${ctx.sessionMode} modules`,
    'Oracle preparing context',
  ];
  const [done, setDone] = useState(0);

  useEffect(() => {
    const timers = steps.map((_, i) =>
      setTimeout(() => setDone(i + 1), 380 * (i + 1)),
    );
    timers.push(setTimeout(onDone, 380 * steps.length + 420));
    return () => timers.forEach(clearTimeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60, background: '#050608', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ minWidth: 360 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Bot size={16} style={{ color: 'var(--violet, #8B5CF6)' }} />
          <span style={{ fontFamily: 'var(--font-display, inherit)', fontSize: 18, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text)' }}>
            OPENING DIGITAL PIT-WALL
          </span>
        </div>
        {steps.map((s, i) => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '5px 0', opacity: i <= done ? 1 : 0.35 }}>
            {i < done
              ? <CheckCircle2 size={13} style={{ color: 'var(--green)' }} />
              : i === done
                ? <Loader2 size={13} className="spin" style={{ color: 'var(--cyan, #00B7FF)' }} />
                : <span style={{ width: 13, height: 13, borderRadius: 999, border: '1px solid var(--border)' }} />}
            <span style={{ fontSize: 12, fontFamily: MONO, color: 'var(--text)' }}>{s}</span>
          </div>
        ))}
        <div style={{ marginTop: 12, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.07)' }}>
          <div style={{ height: '100%', borderRadius: 99, width: `${(done / steps.length) * 100}%`, background: 'var(--cyan, #00B7FF)', transition: 'width 0.3s ease' }} />
        </div>
      </div>
    </div>
  );
}
