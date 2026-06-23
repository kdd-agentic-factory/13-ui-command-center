export function TrialHomePage() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#070b14', color: 'var(--color-text, #eef1f8)' }}>
      <section style={{ width: 'min(820px, 100%)', border: '1px solid rgba(148,163,184,0.18)', borderRadius: 18, padding: 28, background: 'rgba(15,23,42,0.74)' }}>
        <p style={{ margin: 0, color: 'var(--color-text-muted, #98a2b3)', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 11 }}>Entrar a la prueba</p>
        <h1 style={{ margin: '8px 0 12px', fontSize: 'clamp(30px, 5vw, 42px)' }}>Demo incluida con sesión realista</h1>
        <p style={{ margin: '0 0 20px', color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.65, maxWidth: 720 }}>
          Circuito Mugello GP · Yamaha R1 · Stint 03 · Replay Telemetry · objetivo: mejorar salida de curva en T15 Bucine.
        </p>
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <a href="/app" style={{ color: 'inherit' }}>Entrar a KDD</a>
          <a href="/login" style={{ color: 'inherit' }}>Solicitar demo personalizada</a>
          <a href="/" style={{ color: 'inherit' }}>Home</a>
        </nav>
      </section>
    </main>
  );
}
