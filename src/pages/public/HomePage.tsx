import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle2, Layers3, NotebookText, PlayCircle, ShieldCheck } from 'lucide-react';

import { DesignsCanvas } from '../../components/public/DesignsCanvas';
import { KddHeroVisual } from '../../components/public/KddHeroVisual';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useAuth } from '../../context/AuthContext';
import { PrivacyCanvas } from '../../components/public/PrivacyCanvas';
import { WorkflowCanvas } from '../../components/public/WorkflowCanvas';

function SectionTitle({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <p style={{ margin: 0, color: 'var(--color-text-muted, #98a2b3)', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11 }}>
        {eyebrow}
      </p>
      <h2 style={{ margin: '8px 0 8px', fontSize: 'clamp(21px, 3vw, 30px)', lineHeight: 1.08, fontWeight: 650 }}>{title}</h2>
      {body ? (
        <p style={{ margin: 0, color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.7, maxWidth: 700 }}>{body}</p>
      ) : null}
    </div>
  );
}

function Pill({ children }: { children: ReactNode }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(148, 163, 184, 0.2)', background: 'rgba(15, 23, 42, 0.6)', color: 'var(--color-text, #eef1f8)', fontSize: 13 }}>
      {children}
    </span>
  );
}

function ClosingDiagram() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 10, alignItems: 'center', marginTop: 18 }}>
      <div style={{ width: 40, height: 40, borderRadius: 999, background: '#60a5fa', display: 'grid', placeItems: 'center', fontWeight: 800 }}>L</div>
      <div style={{ height: 2, background: 'linear-gradient(90deg, #60a5fa, #8b5cf6, #34d399)' }} />
      <div style={{ width: 40, height: 40, borderRadius: 999, background: '#34d399', display: 'grid', placeItems: 'center', fontWeight: 800 }}>N</div>
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
    <main style={{ minHeight: '100vh', background: 'radial-gradient(circle at top, rgba(59,130,246,0.12), transparent 22%), #070b14', color: 'var(--color-text, #eef1f8)' }}>
      <div style={{ width: 'min(1360px, calc(100% - 40px))', margin: '0 auto', padding: '28px 0 72px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 24, marginBottom: 52, flexWrap: 'wrap' }}>
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
              <a href="/login" style={{ textDecoration: 'none' }}><Pill><PlayCircle size={14} /> {copy.nav.login}</Pill></a>
              <a href="#designs" style={{ textDecoration: 'none' }}><Pill><Layers3 size={14} /> {copy.nav.stack}</Pill></a>
            </nav>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(148,163,184,0.18)', background: 'rgba(15,23,42,0.58)' }}>
              <span style={{ color: 'var(--color-text-muted, #98a2b3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>{copy.nav.language}</span>
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, alignItems: 'stretch' }}>
          <div style={{ borderRadius: 28, padding: '24px clamp(18px, 3.2vw, 32px)', background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(3,7,18,0.52))' }}>
            <p style={{ margin: 0, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 700 }}>{copy.hero.eyebrow}</p>
            <h2 style={{ margin: '14px 0 14px', fontSize: 'clamp(32px, 4.8vw, 54px)', lineHeight: 0.98, maxWidth: 720, fontWeight: 650 }}>{copy.hero.title}</h2>
            <p style={{ margin: '0 0 16px', fontSize: 17, lineHeight: 1.7, color: 'var(--color-text-muted, #98a2b3)', maxWidth: 760 }}>
              {copy.hero.subtitle}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
              {copy.hero.valueProps.map(item => <Pill key={item}>{item}</Pill>)}
            </div>

            <div style={{ display: 'grid', gap: 8, marginBottom: 16 }}>
              {copy.hero.questions.map(question => (
                <div key={question} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text, #eef1f8)', fontSize: 15 }}>
                  <CheckCircle2 size={16} color="#34d399" />
                  <span>{question}</span>
                </div>
              ))}
            </div>

            <p style={{ margin: '0 0 20px', lineHeight: 1.75, color: 'var(--color-text-muted, #98a2b3)', maxWidth: 700 }}>
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
                    padding: cta.primary ? '14px 18px' : '10px 0',
                    borderRadius: cta.primary ? 14 : 0,
                    background: cta.primary ? 'linear-gradient(135deg, #60a5fa, #8b5cf6)' : 'transparent',
                    border: 'none',
                    color: cta.primary ? '#fff' : 'var(--color-text-muted, #98a2b3)',
                    fontWeight: cta.primary ? 700 : 600,
                    borderBottom: cta.primary ? 'none' : '1px solid rgba(148,163,184,0.2)',
                  }}
                >
                  {cta.label} {cta.icon}
                </a>
              ))}
              </div>
            </div>
            <p style={{ margin: '14px 0 0', fontSize: 12, lineHeight: 1.7, color: 'var(--color-text-muted, #98a2b3)', maxWidth: 620 }}>
              {copy.hero.note}
            </p>
          </div>

          <aside id="hero-visual" style={{ display: 'grid', gap: 16 }}>
            <KddHeroVisual subtitle={visual.subtitle} phrase={visual.phrase} />
            <div style={{ borderTop: '1px solid rgba(148,163,184,0.14)', paddingTop: 18 }}>
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

        <section id="designs" style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(148,163,184,0.12)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.25fr) minmax(280px, 0.75fr)', gap: 28, alignItems: 'start' }}>
            <div>
              <SectionTitle eyebrow={copy.designs.eyebrow} title={copy.designs.title} body={copy.designs.body} />
              <DesignsCanvas
                title={copy.designs.title}
                subtitle={copy.designs.body}
                cards={copy.designs.cards}
                networkBody={copy.network.body}
                steps={['Aprendizaje privado', 'Detectar patrones', 'Explicar causa']}
              />
            </div>
            <div style={{ display: 'grid', gap: 18, paddingTop: 56 }}>
              {copy.designs.cards.map(card => (
                <article key={card.title} style={{ paddingTop: 12, borderTop: `1px solid color-mix(in srgb, ${card.accent} 28%, rgba(148,163,184,0.14))` }}>
                  <p style={{ margin: 0, color: card.accent, textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 700 }}>{card.eyebrow}</p>
                  <h3 style={{ margin: '8px 0 6px', fontSize: 18, lineHeight: 1.1 }}>{card.title}</h3>
                  <p style={{ margin: 0, color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.6 }}>{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(148,163,184,0.12)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(300px, 0.85fr)', gap: 28, alignItems: 'start' }}>
            <div>
              <SectionTitle eyebrow={copy.privacy.eyebrow} title={copy.privacy.title} body={copy.privacy.body} />
              <PrivacyCanvas title={copy.privacy.title} subtitle={copy.privacy.body} cards={copy.privacy.cards} principles={copy.privacy.principles} />
            </div>
            <div style={{ display: 'grid', gap: 20, paddingTop: 56 }}>
              {copy.privacy.cards.map((card, index) => (
                <article key={card.title} style={{ paddingTop: 14, borderTop: `1px solid ${index === 0 ? 'rgba(96,165,250,0.35)' : index === 1 ? 'rgba(139,92,246,0.35)' : 'rgba(52,211,153,0.35)'}` }}>
                  <p style={{ margin: 0, color: index === 0 ? '#60a5fa' : index === 1 ? '#8b5cf6' : '#34d399', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 700 }}>{card.title}</p>
                  <p style={{ margin: '8px 0 0', color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.6 }}>{card.body}</p>
                </article>
              ))}
              <div style={{ display: 'grid', gap: 8, paddingTop: 4 }}>
                {copy.privacy.principles.map(item => (
                  <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text, #eef1f8)', fontSize: 15 }}>
                    <CheckCircle2 size={16} color="#34d399" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section style={{ marginTop: 48, paddingTop: 32, borderTop: '1px solid rgba(148,163,184,0.12)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.15fr) minmax(280px, 0.85fr)', gap: 28, alignItems: 'start' }}>
            <div>
              <SectionTitle eyebrow={copy.workflow.eyebrow} title={copy.workflow.title} body={copy.workflow.body} />
              <WorkflowCanvas title={copy.workflow.title} subtitle={copy.workflow.body} steps={copy.workflow.steps} />
            </div>
            <div style={{ display: 'grid', gap: 14, paddingTop: 56 }}>
              {copy.workflow.steps.map((step, index) => (
                <div key={step} style={{ paddingTop: 12, borderTop: '1px solid rgba(148,163,184,0.14)' }}>
                  <div style={{ color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>0{index + 1}</div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{step}</div>
                  <div style={{ color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.5 }}>{index === 0 ? 'Sesiones y contexto' : index === 1 ? 'Señales y eventos' : index === 2 ? 'Lectura causal' : index === 3 ? 'Siguiente acción' : index === 4 ? 'Misión' : 'Validación'}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section style={{ marginTop: 44, paddingTop: 28, borderTop: '1px solid rgba(148,163,184,0.12)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 24, alignItems: 'start' }}>
          <div>
            <SectionTitle eyebrow={copy.access.eyebrow} title={copy.access.title} body={copy.access.body} />
            <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
              <div style={{ paddingTop: 10, borderTop: '1px solid rgba(148,163,184,0.14)' }}>
                <div style={{ color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 11, fontWeight: 700 }}>01</div>
                <div style={{ fontWeight: 700, marginTop: 6 }}>{copy.access.trialCta}</div>
              </div>
              <div style={{ paddingTop: 10, borderTop: '1px solid rgba(148,163,184,0.14)' }}>
                <div style={{ color: '#06b6d4', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 11, fontWeight: 700 }}>02</div>
                <div style={{ fontWeight: 700, marginTop: 6 }}>{copy.access.eyebrow}</div>
              </div>
              <div style={{ paddingTop: 10, borderTop: '1px solid rgba(148,163,184,0.14)' }}>
                <div style={{ color: '#8b5cf6', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 11, fontWeight: 700 }}>03</div>
                <div style={{ fontWeight: 700, marginTop: 6 }}>{copy.access.foundingCta}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <a href="/trial" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 14, background: 'linear-gradient(135deg, #22c55e, #06b6d4)', color: '#fff', fontWeight: 700 }}>
                {copy.access.trialCta} <PlayCircle size={16} />
              </a>
              <a href="/login" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 0', color: 'var(--color-text-muted, #98a2b3)', fontWeight: 600, borderBottom: '1px solid rgba(148,163,184,0.2)' }}>
                {copy.access.foundingCta} <ShieldCheck size={16} />
              </a>
            </div>
          </div>

          <div>
            <p style={{ margin: 0, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 11, fontWeight: 700 }}>{copy.closing.eyebrow}</p>
            <h3 style={{ margin: '12px 0 0', fontSize: 28, lineHeight: 1.1 }}>{copy.closing.title}</h3>
            <p style={{ margin: '16px 0 0', fontSize: 18, lineHeight: 1.65, color: 'var(--color-text-muted, #98a2b3)' }}>{copy.closing.body}</p>
            <ClosingDiagram />
          </div>
        </section>
      </div>
    </main>
  );
}
