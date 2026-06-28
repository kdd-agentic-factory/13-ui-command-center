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
    <main style={{ minHeight: '100vh', padding: 24, background: 'radial-gradient(circle at top, color-mix(in srgb, var(--purple) 15%, transparent), transparent 28%), var(--bg-base)', color: 'var(--text)' }}>
      <section style={{ width: 'min(920px, 100%)', margin: '0 auto', border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-xl)', padding: '32px clamp(20px, 4vw, 40px)', background: 'var(--bg-surface)', boxShadow: '0 24px 80px rgba(0,0,0,0.32)' }}>
        <p style={{ margin: 0, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.09em', fontSize: 12, fontWeight: 700 }}>{copy.eyebrow}</p>
        <h1 style={{ margin: '10px 0 12px', fontSize: 'clamp(32px, 5vw, 54px)', lineHeight: 1.02, maxWidth: 820 }}>{copy.title}</h1>
        <p style={{ margin: '0 0 24px', color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 760 }}>
          {copy.body}
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
          {copy.steps.map((text, index) => (
            <article key={text} style={{ border: '1px solid var(--border-mid)', borderRadius: 'var(--radius-lg)', padding: 18, background: 'var(--bg-card)' }}>
              <div style={{ fontSize: 12, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.09em', marginBottom: 10 }}>0{index + 1}</div>
              <div style={{ fontWeight: 700, lineHeight: 1.5 }}>{text}</div>
            </article>
          ))}
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginTop: 24 }}>
          <a href="/" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 'var(--radius-lg)', background: 'linear-gradient(135deg, var(--blue), var(--purple))', color: '#fff', fontWeight: 700 }}>
            {copy.home}
          </a>
          <a href="/app" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-bright)', background: 'var(--bg-card)', color: 'var(--text)', fontWeight: 700 }}>
            {copy.app}
          </a>
        </div>
      </section>
    </main>
  );
}
