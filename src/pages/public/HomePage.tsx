import { Fragment, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle2, Layers3, NotebookText, PlayCircle, Radar, ShieldCheck, Users } from 'lucide-react';

import { KddHeroVisual } from '../../components/public/KddHeroVisual';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useAuth } from '../../context/AuthContext';

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

function DesignCard({ eyebrow, title, body, chips, accent }: { eyebrow: string; title: string; body: string; chips: string[]; accent: string }) {
  return (
    <article style={{ border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 22, padding: 20, background: 'linear-gradient(180deg, rgba(15,23,42,0.86), rgba(3,7,18,0.9))', boxShadow: '0 18px 50px rgba(0,0,0,0.24)' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <p style={{ margin: 0, color: accent, textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 700 }}>{eyebrow}</p>
        <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 999, background: accent, boxShadow: `0 0 0 6px color-mix(in srgb, ${accent} 14%, transparent)` }} />
      </div>
      <h3 style={{ margin: '0 0 10px', fontSize: 22, lineHeight: 1.1 }}>{title}</h3>
      <p style={{ margin: '0 0 16px', color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.6 }}>{body}</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        {chips.map(chip => <Pill key={chip}>{chip}</Pill>)}
      </div>
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

function SequenceDiagram({ items }: { items: Array<{ label: string; title: string; body?: string; accent?: string }> }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, alignItems: 'stretch', marginBottom: 18 }}>
      {items.map((item, index) => (
        <Fragment key={`${item.label}-${item.title}`}>
          <article style={{ flex: '1 1 188px', minWidth: 188, border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 18, padding: 16, background: 'rgba(3, 7, 18, 0.7)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
              <span style={{ color: item.accent ?? '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 700 }}>{item.label}</span>
              <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 999, background: item.accent ?? '#93c5fd', boxShadow: `0 0 0 6px color-mix(in srgb, ${item.accent ?? '#93c5fd'} 14%, transparent)` }} />
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: 18, lineHeight: 1.1 }}>{item.title}</h3>
            {item.body ? <p style={{ margin: 0, color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.55 }}>{item.body}</p> : null}
          </article>
          {index < items.length - 1 ? (
            <div aria-hidden="true" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: 34, color: '#93c5fd', fontSize: 18, fontWeight: 700 }}>
              <ArrowRight size={18} />
            </div>
          ) : null}
        </Fragment>
      ))}
    </div>
  );
}

function StackDiagram({ items }: { items: string[] }) {
  const rows = [items.slice(0, 4), items.slice(4, 8), items.slice(8, 12)].filter(row => row.length > 0);

  return (
    <div style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
      {rows.map((row, rowIndex) => (
        <div key={row.join('-')} style={{ display: 'grid', gridTemplateColumns: `repeat(${row.length}, minmax(0, 1fr))`, gap: 10, marginLeft: `${rowIndex * 12}px` }}>
          {row.map((item, index) => (
            <div key={item} style={{ padding: '12px 14px', borderRadius: 16, border: '1px solid rgba(148, 163, 184, 0.18)', background: index % 2 === 0 ? 'rgba(15, 23, 42, 0.82)' : 'rgba(3, 7, 18, 0.78)', color: 'var(--color-text, #eef1f8)', boxShadow: '0 10px 24px rgba(0,0,0,0.14)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Layers3 size={14} color="#93c5fd" />
                <span style={{ fontSize: 13, lineHeight: 1.4 }}>{item}</span>
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export function HomePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const copy = t('public.home', { returnObjects: true }) as {
    header: { eyebrow: string; title: string; signedInCue: string };
    nav: { foundingNodes: string; login: string; stack: string; language: string };
    hero: {
      eyebrow: string;
      title: string;
      subtitle: string;
      valueProps: string[];
      questions: string[];
      body: string;
      resumeIndicator: string;
      foundingCta: string;
      resumeLastSession: string;
      loginCta: string;
      note: string;
    };
    designs: { eyebrow: string; title: string; body: string; cards: Array<{ eyebrow: string; title: string; body: string; chips: string[]; accent: string }> };
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
  const resumeFirst = Boolean(user);
  const heroCtas = resumeFirst
    ? [
        { href: '/app', label: copy.hero.resumeLastSession, icon: <PlayCircle size={16} />, primary: true },
        { href: '/founding-nodes', label: copy.hero.foundingCta, icon: <ArrowRight size={16} />, primary: false },
        { href: '/login', label: copy.hero.loginCta, icon: <ArrowRight size={16} />, primary: false },
      ]
    : [
        { href: '/founding-nodes', label: copy.hero.foundingCta, icon: <ArrowRight size={16} />, primary: true },
        { href: '/app', label: copy.hero.resumeLastSession, icon: <PlayCircle size={16} />, primary: false },
        { href: '/login', label: copy.hero.loginCta, icon: <ArrowRight size={16} />, primary: false },
      ];

  return (
    <main style={{ minHeight: '100vh', background: 'radial-gradient(circle at top, rgba(59,130,246,0.18), transparent 28%), radial-gradient(circle at 80% 0%, rgba(168,85,247,0.14), transparent 24%), #070b14', color: 'var(--color-text, #eef1f8)' }}>
      <div style={{ width: 'min(1360px, calc(100% - 32px))', margin: '0 auto', padding: '28px 0 56px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 20, marginBottom: 40, flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--color-text-muted, #98a2b3)', fontSize: 11 }}>{copy.header.eyebrow}</p>
            <h1 style={{ margin: '8px 0 0', fontSize: 20 }}>{copy.header.title}</h1>
            {user ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, width: 'fit-content', padding: '6px 10px', borderRadius: 999, border: '1px solid rgba(96, 165, 250, 0.28)', background: 'rgba(59, 130, 246, 0.12)', color: '#dbeafe', fontSize: 12, fontWeight: 700 }}>
                <ShieldCheck size={13} />
                <span>{copy.header.signedInCue}</span>
              </span>
            ) : null}
          </div>
          <div style={{ display: 'grid', justifyItems: 'end', gap: 12 }}>
            <nav style={{ display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
              <a href="/founding-nodes" style={{ textDecoration: 'none' }}><Pill><NotebookText size={14} /> {copy.nav.foundingNodes}</Pill></a>
              <a href="#prueba" style={{ textDecoration: 'none' }}><Pill><PlayCircle size={14} /> {copy.nav.login}</Pill></a>
              <a href="#stack" style={{ textDecoration: 'none' }}><Pill><Layers3 size={14} /> {copy.nav.stack}</Pill></a>
            </nav>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(148,163,184,0.18)', background: 'rgba(15,23,42,0.58)' }}>
              <span style={{ color: 'var(--color-text-muted, #98a2b3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>{copy.nav.language}</span>
              <LanguageSwitcher />
            </div>
          </div>
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

            <div style={{ display: 'grid', gap: 12 }}>
              {resumeFirst ? (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, width: 'fit-content', padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(96, 165, 250, 0.35)', background: 'rgba(59, 130, 246, 0.14)', color: '#dbeafe', fontSize: 13, fontWeight: 700 }}>
                  <ShieldCheck size={14} />
                  <span>{copy.hero.resumeIndicator}</span>
                </div>
              ) : null}

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              {heroCtas.map(cta => (
                <a
                  key={cta.href}
                  href={cta.href}
                  style={{
                    textDecoration: 'none',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '14px 18px',
                    borderRadius: 14,
                    background: cta.primary ? 'linear-gradient(135deg, #60a5fa, #8b5cf6)' : 'rgba(15,23,42,0.72)',
                    border: cta.primary ? 'none' : '1px solid rgba(148,163,184,0.24)',
                    color: cta.primary ? '#fff' : 'var(--color-text, #eef1f8)',
                    fontWeight: 700,
                  }}
                >
                  {cta.label} {cta.icon}
                </a>
              ))}
              </div>
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

        <section style={{ marginTop: 28, border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 28, padding: '24px 24px 26px', background: 'linear-gradient(180deg, rgba(15,23,42,0.64), rgba(3,7,18,0.88))' }}>
          <SectionTitle eyebrow={copy.designs.eyebrow} title={copy.designs.title} body={copy.designs.body} />
          <SequenceDiagram
            items={copy.designs.cards.map(card => ({ label: card.eyebrow, title: card.title, body: card.body, accent: card.accent }))}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {copy.designs.cards.map(card => <DesignCard key={card.title} eyebrow={card.eyebrow} title={card.title} body={card.body} chips={card.chips} accent={card.accent} />)}
          </div>
        </section>

        <section style={{ marginTop: 28, border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 24, padding: '22px 24px', background: 'rgba(15, 23, 42, 0.55)' }}>
          <SectionTitle eyebrow={copy.network.eyebrow} title={copy.network.title} body={copy.network.body} />
          <SequenceDiagram
            items={copy.network.cards.map((card, index) => ({ label: `0${index + 1}`, title: card.title, body: card.body, accent: index % 2 === 0 ? '#60a5fa' : '#34d399' }))}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {copy.network.cards.map(item => <HomeCard key={item.title} title={item.title} body={item.body} />)}
          </div>
        </section>

        <section style={{ marginTop: 28, border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 24, padding: '22px 24px', background: 'rgba(15, 23, 42, 0.55)' }}>
          <SectionTitle eyebrow={copy.privacy.eyebrow} title={copy.privacy.title} body={copy.privacy.body} />
          <SequenceDiagram
            items={copy.privacy.cards.map((card, index) => ({ label: `0${index + 1}`, title: card.title, body: card.body, accent: index === 0 ? '#60a5fa' : index === 1 ? '#8b5cf6' : '#34d399' }))}
          />
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
          <SequenceDiagram
            items={copy.levels.cards.map((card, index) => ({ label: `0${index + 1}`, title: card.title, body: card.body, accent: index === 0 ? '#60a5fa' : index === 1 ? '#8b5cf6' : '#34d399' }))}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {copy.levels.cards.map(item => <HomeCard key={item.title} title={item.title} body={item.body} />)}
          </div>
        </section>

        <section style={{ marginTop: 28, border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 24, padding: '22px 24px', background: 'rgba(15, 23, 42, 0.55)' }}>
          <SectionTitle eyebrow={copy.workflow.eyebrow} title={copy.workflow.title} body={copy.workflow.body} />
          <SequenceDiagram
            items={copy.workflow.steps.map((step, index) => ({ label: `0${index + 1}`, title: step, accent: index < 3 ? '#60a5fa' : '#34d399' }))}
          />
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
          <SequenceDiagram
            items={copy.capabilities.cards.map((card, index) => ({ label: `0${index + 1}`, title: card.title, body: card.body, accent: index % 3 === 0 ? '#60a5fa' : index % 3 === 1 ? '#8b5cf6' : '#34d399' }))}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16 }}>
            {copy.capabilities.cards.map(item => <HomeCard key={item.title} title={item.title} body={item.body} />)}
          </div>
        </section>

        <section style={{ marginTop: 34 }}>
          <SectionTitle eyebrow={copy.audiences.eyebrow} title={copy.audiences.title} body={copy.audiences.body} />
          <SequenceDiagram
            items={copy.audiences.cards.map((card, index) => ({ label: `0${index + 1}`, title: card.title, body: card.body, accent: index % 2 === 0 ? '#60a5fa' : '#8b5cf6' }))}
          />
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
          <StackDiagram items={copy.stack.items} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {copy.stack.items.map(item => (
              <Pill key={item}><Radar size={14} /> {item}</Pill>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 34, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, alignItems: 'stretch' }}>
          <div style={{ border: '1px solid rgba(148, 163, 184, 0.18)', borderRadius: 24, padding: 24, background: 'rgba(15,23,42,0.55)' }}>
            <SectionTitle eyebrow={copy.access.eyebrow} title={copy.access.title} body={copy.access.body} />
            <SequenceDiagram
              items={[
                { label: '01', title: 'Request access', body: copy.access.trialCta, accent: '#22c55e' },
                { label: '02', title: 'Choose the mode', body: 'Private / Team / Federated', accent: '#06b6d4' },
                { label: '03', title: 'Enter the app', body: copy.access.foundingCta, accent: '#8b5cf6' },
              ]}
            />
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
            <SequenceDiagram
              items={[
                { label: '01', title: 'Learn', accent: '#60a5fa' },
                { label: '02', title: 'Improve', accent: '#8b5cf6' },
                { label: '03', title: 'Network', accent: '#34d399' },
              ]}
            />
          </div>
        </section>
      </div>
    </main>
  );
}
