/**
 * GateProgress — the entry-workflow strip shown on every gate screen:
 *   Circuit → Mode → Data → Launch
 * Makes the pit-wall boot sequence legible from the first second.
 */
const STEPS = ['Circuit', 'Mode', 'Data', 'Launch'] as const;

export function GateProgress({ step }: { step: 0 | 1 | 2 | 3 }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
      {STEPS.map((label, i) => (
        <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '4px 12px', borderRadius: 999,
            background: i === step ? 'rgba(224,55,55,0.12)' : i < step ? 'rgba(0,230,118,0.08)' : 'rgba(255,255,255,0.03)',
            border: `1px solid ${i === step ? 'var(--accent)' : i < step ? 'var(--green)' : 'var(--border)'}`,
          }}>
            <span style={{
              fontSize: 9, fontFamily: 'JetBrains Mono, monospace', fontWeight: 700,
              color: i === step ? 'var(--accent)' : i < step ? 'var(--green)' : 'var(--text-muted)',
            }}>
              {i < step ? '✓' : `0${i + 1}`}
            </span>
            <span style={{
              fontSize: 11, fontWeight: i === step ? 800 : 500, letterSpacing: '0.04em',
              color: i <= step ? 'var(--text)' : 'var(--text-muted)',
            }}>
              {label}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <span style={{ width: 18, height: 1, background: i < step ? 'var(--green)' : 'var(--border)' }} />
          )}
        </div>
      ))}
    </div>
  );
}
