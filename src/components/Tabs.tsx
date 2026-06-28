interface TabsProps {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}

/** Minimal accessible tab bar. */
export function Tabs({ tabs, active, onChange }: TabsProps) {
  return (
    <div role="tablist" className="tabs-bar" style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid var(--border, #222)' }}>
      {tabs.map((t) => {
        const sel = t.id === active;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={sel}
            onClick={() => onChange(t.id)}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              border: 'none',
              borderBottom: sel ? '2px solid var(--accent)' : '2px solid transparent',
              color: sel ? 'var(--text)' : 'var(--text-dim)',
              fontWeight: sel ? 700 : 500,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            {t.label}
          </button>
        );
      })}
    </div>
  );
}
