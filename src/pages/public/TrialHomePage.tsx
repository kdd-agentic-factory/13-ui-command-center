export function TrialHomePage() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24 }}>
      <section style={{ width: 'min(640px, 100%)', border: '1px solid var(--color-border, #2b2f3a)', borderRadius: 12, padding: 24, background: 'var(--color-surface, #11151d)', color: 'var(--color-text, #eef1f8)' }}>
        <p style={{ margin: 0, color: 'var(--color-text-muted, #98a2b3)', textTransform: 'uppercase', letterSpacing: '0.08em', fontSize: 12 }}>Trial</p>
        <h1 style={{ margin: '8px 0 12px', fontSize: 28 }}>Trial entry</h1>
        <p style={{ margin: '0 0 20px', color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.5 }}>
          Placeholder trial landing page.
        </p>
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <a href="/">Home</a>
          <a href="/login">Login</a>
          <a href="/app">Dashboard</a>
        </nav>
      </section>
    </main>
  );
}
