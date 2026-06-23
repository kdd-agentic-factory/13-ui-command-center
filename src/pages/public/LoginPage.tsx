export function LoginPage() {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#070b14', color: 'var(--color-text, #eef1f8)' }}>
      <section style={{ width: 'min(760px, 100%)', border: '1px solid rgba(148,163,184,0.18)', borderRadius: 18, padding: 28, background: 'rgba(15,23,42,0.74)' }}>
        <p style={{ margin: 0, color: 'var(--color-text-muted, #98a2b3)', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 11 }}>Solicitar demo personalizada</p>
        <h1 style={{ margin: '8px 0 12px', fontSize: 'clamp(30px, 5vw, 42px)' }}>Acceso guiado para tu academia, equipo o proyecto</h1>
        <p style={{ margin: '0 0 20px', color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.65, maxWidth: 620 }}>
          Si no tienes acceso todavía, usa esta vía para pedir una demo adaptada a tu contexto. También puedes volver a la prueba pública o entrar al dashboard.
        </p>
        <nav style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          <a href="/" style={{ color: 'inherit' }}>Home</a>
          <a href="/trial" style={{ color: 'inherit' }}>Entrar a la prueba</a>
          <a href="/app" style={{ color: 'inherit' }}>Dashboard</a>
        </nav>
      </section>
    </main>
  );
}
