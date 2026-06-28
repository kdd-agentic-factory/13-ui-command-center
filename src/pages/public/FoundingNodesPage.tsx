import { ArrowRight, CheckCircle2, Sparkles, Users, ShieldCheck, NotebookText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const segments = [
  ['public.foundingNodes.segments.pilots.title', 'public.foundingNodes.segments.pilots.body'],
  ['public.foundingNodes.segments.coaches.title', 'public.foundingNodes.segments.coaches.body'],
  ['public.foundingNodes.segments.academies.title', 'public.foundingNodes.segments.academies.body'],
  ['public.foundingNodes.segments.universities.title', 'public.foundingNodes.segments.universities.body'],
] as const;

export function FoundingNodesPage() {
  const { t } = useTranslation();
  const copy = t('public.foundingNodes', { returnObjects: true }) as {
    eyebrow: string;
    title: string;
    body: string;
    primaryCta: string;
    secondaryCta: string;
    nodeBenefits: { eyebrow: string; title: string; items: string[] };
    privacy: { eyebrow: string; title: string; items: string[] };
    offer: { eyebrow: string; title: string; body: string; cta: string; home: string };
  };

  return (
    <main style={{ minHeight: '100vh', padding: 24, background: 'var(--bg-base)', color: 'var(--text)' }}>
      <section style={{ width: 'min(1160px, 100%)', margin: '0 auto', display: 'grid', gap: 20 }}>
        <div style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: '30px clamp(20px, 4vw, 42px)', background: 'var(--bg-card)', boxShadow: 'var(--shadow)' }}>
          <p style={{ margin: 0, color: 'var(--purple)', textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: 11, fontWeight: 700 }}>{copy.eyebrow}</p>
          <h1 style={{ margin: '12px 0 14px', fontSize: 'clamp(34px, 6vw, 64px)', lineHeight: 0.96, maxWidth: 900 }}>{copy.title}</h1>
          <p style={{ margin: '0 0 18px', fontSize: 18, lineHeight: 1.7, color: 'var(--text-dim)', maxWidth: 860 }}>
            {copy.body}
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, marginBottom: 22 }}>
            <a href="/trial" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 'var(--radius-xl)', background: 'var(--blue)', color: 'var(--white)', fontWeight: 700 }}>
              {copy.primaryCta} <ArrowRight size={16} />
            </a>
            <a href="/login" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border-mid)', background: 'var(--surface-faint)', color: 'var(--text)', fontWeight: 700 }}>
              {copy.secondaryCta} <Sparkles size={16} />
            </a>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {segments.map(([titleKey, bodyKey]) => (
              <article key={titleKey} style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 18, background: 'var(--bg-surface)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <Users size={16} color="var(--blue)" />
                  <h3 style={{ margin: 0, fontSize: 18 }}>{t(titleKey)}</h3>
                </div>
                <p style={{ margin: 0, color: 'var(--text-dim)', lineHeight: 1.55 }}>{t(bodyKey)}</p>
              </article>
            ))}
          </div>
        </div>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          <article style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 24, background: 'var(--bg-card)' }}>
            <p style={{ margin: 0, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 700 }}>{copy.nodeBenefits.eyebrow}</p>
            <h2 style={{ margin: '10px 0 12px', fontSize: 28, lineHeight: 1.08 }}>{copy.nodeBenefits.title}</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              {copy.nodeBenefits.items.map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)' }}>
                  <CheckCircle2 size={16} color="var(--green)" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>

          <article style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 24, background: 'var(--bg-card)' }}>
            <p style={{ margin: 0, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 700 }}>{copy.privacy.eyebrow}</p>
            <h2 style={{ margin: '10px 0 12px', fontSize: 28, lineHeight: 1.08 }}>{copy.privacy.title}</h2>
            <div style={{ display: 'grid', gap: 10 }}>
              {copy.privacy.items.map(item => (
                <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--text)' }}>
                  <ShieldCheck size={16} color="var(--purple)" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section style={{ border: '1px solid var(--border)', borderRadius: 'var(--radius-xl)', padding: 24, background: 'var(--bg-card)' }}>
          <p style={{ margin: 0, color: 'var(--blue)', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 700 }}>{copy.offer.eyebrow}</p>
          <h2 style={{ margin: '10px 0 12px', fontSize: 28, lineHeight: 1.08 }}>{copy.offer.title}</h2>
          <p style={{ margin: '0 0 16px', color: 'var(--text-dim)', lineHeight: 1.65, maxWidth: 820 }}>
            {copy.offer.body}
          </p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
            <a href="/trial" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 'var(--radius-xl)', background: 'var(--green)', color: 'var(--bg-base)', fontWeight: 700 }}>
              {copy.offer.cta} <NotebookText size={16} />
            </a>
            <a href="/" style={{ color: 'inherit', display: 'inline-flex', alignItems: 'center', gap: 8, alignSelf: 'center' }}>{copy.offer.home}</a>
          </div>
        </section>
      </section>
    </main>
  );
}
