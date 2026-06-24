import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle2, Layers3, NotebookText, PlayCircle, Radar, ShieldCheck, Users } from 'lucide-react';

import { KddHeroVisual } from '../../components/public/KddHeroVisual';

function SectionTitle({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ margin: 0, color: 'var(--color-text-muted, #98a2b3)', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11 }}>
        {eyebrow}
      </p>
      <h2 style={{ margin: '8px 0 8px', fontSize: 'clamp(24px, 4vw, 38px)', lineHeight: 1.05 }}>{title}</h2>
      {body ? (
        <p style={{ margin: 0, color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.6, maxWidth: 760 }}>{body}</p>
      ) : null}
    </div>
  );
}

function HomeCard({ title, body }: { title: string; body: string }) {
  return (
    <article style={{ border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 18, padding: 18, background: 'rgba(15, 23, 42, 0.5)' }}>
      <h3 style={{ margin: '0 0 8px', fontSize: 18 }}>{title}</h3>
      <p style={{ margin: 0, color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.55 }}>{body}</p>
    </article>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(148, 163, 184, 0.2)', background: 'rgba(15, 23, 42, 0.6)', color: 'var(--color-text, #eef1f8)', fontSize: 13 }}>
      {children}
    </span>
  );
}

export function HomePage() {
  const { t } = useTranslation();
  const copy = t('public.home', { returnObjects: true }) as {
    header: { eyebrow: string; title: string };
    nav: { foundingNodes: string; login: string; stack: string };
    hero: {
      eyebrow: string;
      title: string;
      subtitle: string;
      valueProps: string[];
      questions: string[];
      body: string;
      foundingCta: string;
      loginCta: string;
      note: string;
    };
    foundingPanel: { eyebrow: string; title: string; rows: Array<{ label: string; value: string }>; body: string };
    network: { eyebrow: string; title: string; body: string; cards: Array<{ title: string; body: string }> };
    privacy: { eyebrow: string; title: string; body: string; cards: Array<{ title: string; body: string }>; principles: string[] };
    levels: { eyebrow: string; title: string; body: string; cards: Array<{ title: string; body: string }> };
    workflow: { eyebrow: string; title: string; body: string; steps: string[] };
    capabilities: { eyebrow: string; title: string; body: string; cards: Array<{ title: string; body: string }> };
    audiences: { eyebrow: string; title: string; body?: string; cards: Array<{ title: string; body: string }> };
    stack: { eyebrow: string; title: string; body: string; items: string[] };
    access: { eyebrow: string; title: string; body: string; trialCta: string; foundingCta: string };
    closing: { eyebrow: string; title: string; body: string };
  };
  const visual = t('public.heroVisual', { returnObjects: true }) as { subtitle: string; phrase: string };

  return (
    <main style={{ minHeight: '100vh', background: 'radial-gradient(circle at top, rgba(59,130,246,0.18), transparent 28%), radial-gradient(circle at 80% 0%, rgba(168,85,247,0.14), transparent 24%), #070b14', color: 'var(--color-text, #eef1f8)' }}>
      <div style={{ width: 'min(1180px, calc(100% - 32px))', margin: '0 auto', padding: '28px 0 56px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, marginBottom: 40, flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--color-text-muted, #98a2b3)', fontSize: 11 }}>{copy.header.eyebrow}</p>
            <h1 style={{ margin: '8px 0 0', fontSize: 20 }}>{copy.header.title}</h1>
          </div>
          <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a href="/founding-nodes" style={{ textDecoration: 'none' }}><Pill><NotebookText size={14} /> {copy.nav.foundingNodes}</Pill></a>
            <a href="#prueba" style={{ textDecoration: 'none' }}><Pill><PlayCircle size={14} /> {copy.nav.login}</Pill></a>
            <a href="#stack" style={{ textDecoration: 'none' }}><Pill><Layers3 size={14} /> {copy.nav.stack}</Pill></a>
          </nav>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, alignItems: 'stretch' }}>
          <div style={{ border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 24, padding: '28px clamp(20px, 4vw, 40px)', background: 'rgba(3, 7, 18, 0.88)', boxShadow: '0 24px 80px rgba(0, 0, 0, 0.38)' }}>
            <p style={{ margin: 0, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 700 }}>{copy.hero.eyebrow}</p>
            <h2 style={{ margin: '14px 0 16px', fontSize: 'clamp(38px, 6vw, 68px)', lineHeight: 0.95, maxWidth: 780 }}>{copy.hero.title}</h2>
            <p style={{ margin: '0 0 18px', fontSize: 18, lineHeight: 1.65, color: 'var(--color-text-muted, #98a2b3)', maxWidth: 820 }}>
              {copy.hero.subtitle}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 18 }}>
              {copy.hero.valueProps.map(item => <Pill key={item}>{item}</Pill>)}
            </div>

            <div style={{ display: 'grid', gap: 8, marginBottom: 18 }}>
              {copy.hero.questions.map(question => (
                <div key={question} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text, #eef1f8)', fontSize: 16 }}>
                  <CheckCircle2 size={16} color="#34d399" />
                  <span>{question}</span>
                </div>
              ))}
            </div>

            <p style={{ margin: '0 0 22px', lineHeight: 1.7, color: 'var(--color-text-muted, #98a2b3)', maxWidth: 760 }}>
              {copy.hero.body}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <a href="/founding-nodes" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 14, background: 'linear-gradient(135deg, #60a5fa, #8b5cf6)', color: '#fff', fontWeight: 700 }}>
                {copy.hero.foundingCta} <ArrowRight size={16} />
              </a>
              <a href="/login" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 14, border: '1px solid rgba(148,163,184,0.24)', background: 'rgba(15,23,42,0.6)', color: 'var(--color-text, #eef1f8)', fontWeight: 700 }}>
                {copy.hero.loginCta} <ArrowRight size={16} />
              </a>
            </div>
            <p style={{ margin: '14px 0 0', fontSize: 12, lineHeight: 1.6, color: 'var(--color-text-muted, #98a2b3)', maxWidth: 640 }}>
              {copy.hero.note}
            </p>
          </div>

          <aside id="prueba" style={{ display: 'grid', gap: 16 }}>
            <KddHeroVisual subtitle={visual.subtitle} phrase={visual.phrase} />
            <div style={{ border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 24, padding: 22, background: 'rgba(15, 23, 42, 0.64)' }}>
              <p style={{ margin: 0, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 700 }}>{copy.foundingPanel.eyebrow}</p>
              <h3 style={{ margin: '12px 0 14px', fontSize: 24 }}>{copy.foundingPanel.title}</h3>
              <div style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
                {copy.foundingPanel.rows.map(row => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, paddingBottom: 10, borderBottom: '1px solid rgba(148,163,184,0.14)' }}>
                    <span style={{ color: 'var(--color-text-muted, #98a2b3)' }}>{row.label}</span>
                    <strong style={{ textAlign: 'right' }}>{row.value}</strong>
                  </div>
                ))}
              </div>
              <p style={{ margin: 0, lineHeight: 1.65, color: 'var(--color-text-muted, #98a2b3)' }}>{copy.foundingPanel.body}</p>
            </div>
          </aside>
        </section>

        <section style={{ marginTop: 28, border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 24, padding: '22px 24px', background: 'rgba(15, 23, 42, 0.55)' }}>
          <SectionTitle eyebrow={copy.network.eyebrow} title={copy.network.title} body={copy.network.body} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {copy.network.cards.map(item => <HomeCard key={item.title} title={item.title} body={item.body} />)}
          </div>
        </section>

        <section style={{ marginTop: 28, border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 24, padding: '22px 24px', background: 'rgba(15, 23, 42, 0.55)' }}>
          <SectionTitle eyebrow={copy.privacy.eyebrow} title={copy.privacy.title} body={copy.privacy.body} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {copy.privacy.cards.map(item => <HomeCard key={item.title} title={item.title} body={item.body} />)}
          </div>
          <div style={{ display: 'grid', gap: 8, marginTop: 16 }}>
            {copy.privacy.principles.map(item => (
              <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text, #eef1f8)', fontSize: 16 }}>
                <CheckCircle2 size={16} color="#34d399" />
                <span>{item}</span>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 28, border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 24, padding: '22px 24px', background: 'rgba(15, 23, 42, 0.55)' }}>
          <SectionTitle eyebrow={copy.levels.eyebrow} title={copy.levels.title} body={copy.levels.body} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {copy.levels.cards.map(item => <HomeCard key={item.title} title={item.title} body={item.body} />)}
          </div>
        </section>

        <section style={{ marginTop: 28, border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 24, padding: '22px 24px', background: 'rgba(15, 23, 42, 0.55)' }}>
          <SectionTitle eyebrow={copy.workflow.eyebrow} title={copy.workflow.title} body={copy.workflow.body} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
            {copy.workflow.steps.map((step, index) => (
              <div key={step} style={{ borderRadius: 18, border: '1px solid rgba(148, 163, 184, 0.18)', padding: 14, background: index % 2 === 0 ? 'rgba(3,7,18,0.65)' : 'rgba(15,23,42,0.65)' }}>
                <div style={{ fontSize: 11, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8 }}>0{index + 1}</div>
                <div style={{ fontWeight: 700 }}>{step}</div>
              </div>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 34 }}>
          <SectionTitle eyebrow={copy.capabilities.eyebrow} title={copy.capabilities.title} body={copy.capabilities.body} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {copy.capabilities.cards.map(item => <HomeCard key={item.title} title={item.title} body={item.body} />)}
          </div>
        </section>

        <section style={{ marginTop: 34 }}>
          <SectionTitle eyebrow={copy.audiences.eyebrow} title={copy.audiences.title} body={copy.audiences.body} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {copy.audiences.cards.map(item => (
              <article key={item.title} style={{ border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 18, padding: 18, background: 'rgba(15, 23, 42, 0.5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <Users size={16} color="#93c5fd" />
                  <h3 style={{ margin: 0, fontSize: 18 }}>{item.title}</h3>
                </div>
                <p style={{ margin: 0, color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.55 }}>{item.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="stack" style={{ marginTop: 34, border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 24, padding: 24, background: 'rgba(3, 7, 18, 0.8)' }}>
          <SectionTitle eyebrow={copy.stack.eyebrow} title={copy.stack.title} body={copy.stack.body} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {copy.stack.items.map(item => (
              <Pill key={item}><Radar size={14} /> {item}</Pill>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 34, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, alignItems: 'stretch' }}>
          <div style={{ border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 24, padding: 24, background: 'rgba(15,23,42,0.55)' }}>
            <SectionTitle eyebrow={copy.access.eyebrow} title={copy.access.title} body={copy.access.body} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <a href="/trial" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 14, background: 'linear-gradient(135deg, #22c55e, #06b6d4)', color: '#fff', fontWeight: 700 }}>
                {copy.access.trialCta} <PlayCircle size={16} />
              </a>
              <a href="/login" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 14, border: '1px solid rgba(148,163,184,0.24)', background: 'rgba(15,23,42,0.6)', color: 'var(--color-text, #eef1f8)', fontWeight: 700 }}>
                {copy.access.foundingCta} <ShieldCheck size={16} />
              </a>
            </div>
          </div>

          <div style={{ border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 24, padding: 24, background: 'linear-gradient(180deg, rgba(59,130,246,0.16), rgba(15,23,42,0.6))' }}>
            <p style={{ margin: 0, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 11, fontWeight: 700 }}>{copy.closing.eyebrow}</p>
            <h3 style={{ margin: '12px 0 0', fontSize: 28, lineHeight: 1.1 }}>{copy.closing.title}</h3>
            <p style={{ margin: '16px 0 0', fontSize: 18, lineHeight: 1.65, color: 'var(--color-text-muted, #98a2b3)' }}>{copy.closing.body}</p>
          </div>
        </section>
      </div>
    </main>
  );
}
