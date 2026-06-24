import { useTranslation } from 'react-i18next';

export function ThanksPage() {
  const { t } = useTranslation();
  const copy = t('public.thanks', { returnObjects: true }) as {
    eyebrow: string;
    title: string;
    body: string;
    steps: string[];
    home: string;
    app: string;
  };

  return (
    <main style={{ minHeight: '100vh', padding: 24, background: 'radial-gradient(circle at top, rgba(168,85,247,0.15), transparent 28%), #070b14', color: 'var(--color-text, #eef1f8)' }}>
      <section style={{ width: 'min(920px, 100%)', margin: '0 auto', border: '1px solid rgba(148,163,184,0.18)', borderRadius: 24, padding: '32px clamp(20px, 4vw, 40px)', background: 'rgba(15,23,42,0.76)', boxShadow: '0 24px 80px rgba(0,0,0,0.32)' }}>
        <p style={{ margin: 0, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 700 }}>{copy.eyebrow}</p>
        <h1 style={{ margin: '10px 0 12px', fontSize: 'clamp(32px, 5vw, 54px)', lineHeight: 1.02, maxWidth: 820 }}>{copy.title}</h1>
        <p style={{ margin: '0 0 24px', color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.7, maxWidth: 760 }}>
          {copy.body}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {copy.steps.map((text, index) => (
            <article key={text} style={{ border: '1px solid rgba(148,163,184,0.18)', borderRadius: 18, padding: 18, background: 'rgba(3,7,18,0.55)' }}>
              <div style={{ fontSize: 11, color: '#c4b5fd', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 10 }}>0{index + 1}</div>
              <div style={{ fontWeight: 700, lineHeight: 1.5 }}>{text}</div>
            </article>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 24 }}>
          <a href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 14, background: 'linear-gradient(135deg, #60a5fa, #8b5cf6)', color: '#fff', fontWeight: 700 }}>
            {copy.home}
          </a>
          <a href="/app" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 14, border: '1px solid rgba(148,163,184,0.24)', background: 'rgba(15,23,42,0.6)', color: 'var(--color-text, #eef1f8)', fontWeight: 700 }}>
            {copy.app}
          </a>
        </div>
      </section>
    </main>
  );
}
