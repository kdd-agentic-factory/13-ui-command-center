import { useEffect, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle2, Layers3, NotebookText, PlayCircle, ShieldCheck } from 'lucide-react';

import { DesignsCanvas } from '../../components/public/DesignsCanvas';
import { KddHeroVisual } from '../../components/public/KddHeroVisual';
import { LanguageSwitcher } from '../../components/LanguageSwitcher';
import { useAuth } from '../../context/AuthContext';
import { PrivacyCanvas } from '../../components/public/PrivacyCanvas';
import { WorkflowCanvas } from '../../components/public/WorkflowCanvas';
import { createDiagramSelectionContract, usePrefersReducedMotion } from '../../components/public/landingDiagramState';

type SectionKey = 'designs' | 'privacy' | 'workflow';
type DiagramMode = 'active' | 'recede';

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
  const reducedMotion = usePrefersReducedMotion();
  const sectionRefs = useRef<Record<SectionKey, HTMLElement | null>>({
    designs: null,
    privacy: null,
    workflow: null,
  });
  const [activeSection, setActiveSection] = useState<SectionKey>('designs');
  const [hoveredSection, setHoveredSection] = useState<SectionKey | null>(null);
  const [selectedId, setSelectedId] = useState<SectionKey>('designs');
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
  const currentSection = hoveredSection ?? selectedId ?? activeSection;
  const sectionMode = (section: SectionKey): DiagramMode => (currentSection === section ? 'active' : 'recede');
  const sectionActive = (section: SectionKey) => currentSection === section;
  const sectionSelectionProps = (section: SectionKey) => {
    const selection = createDiagramSelectionContract(section, diagramId => {
      const nextSection = diagramId as SectionKey;
      setSelectedId(nextSection);
      setHoveredSection(nextSection);
    });

    return {
      ...selection,
      onClick: () => {
        setSelectedId(section);
        setHoveredSection(section);
      },
      onFocus: () => setHoveredSection(section),
      onBlur: () => setHoveredSection(null),
    };
  };

  useEffect(() => {
    if (typeof globalThis.IntersectionObserver === 'undefined') return;

    const observer = new globalThis.IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting);
      if (visible.length === 0) return;

      const nextSection = visible
        .sort((left, right) => right.intersectionRatio - left.intersectionRatio)
        .map(entry => (entry.target as HTMLElement).dataset.section as SectionKey | undefined)
        .find((section): section is SectionKey => Boolean(section));

      if (nextSection) setActiveSection(nextSection);
      if (nextSection) setSelectedId(nextSection);
    }, { threshold: 0.4 });

    (Object.keys(sectionRefs.current) as SectionKey[]).forEach(section => {
      const node = sectionRefs.current[section];
      if (node) observer.observe(node);
    });

    return () => observer.disconnect();
  }, []);

  const bindSection = (section: SectionKey) => (node: HTMLElement | null) => {
    sectionRefs.current[section] = node;
  };

  const sectionEvents = (section: SectionKey) => ({
    onMouseEnter: () => setHoveredSection(section),
    onMouseLeave: () => setHoveredSection(null),
    onPointerEnter: () => setHoveredSection(section),
    onPointerLeave: () => setHoveredSection(null),
    onFocusCapture: () => setHoveredSection(section),
    onBlurCapture: () => setHoveredSection(null),
  });

  const sectionFrameStyle = (section: SectionKey) => {
    const isCurrent = currentSection === section;

    return {
      marginTop: 48,
      paddingTop: 32,
      borderTop: `1px solid ${isCurrent ? 'rgba(165,180,252,0.22)' : 'rgba(148,163,184,0.12)'}`,
      background: isCurrent ? 'linear-gradient(180deg, rgba(148,163,184,0.04), transparent)' : 'transparent',
      borderRadius: isCurrent ? 22 : 0,
      boxShadow: isCurrent ? '0 0 0 1px rgba(148,163,184,0.06), 0 24px 60px rgba(0,0,0,0.14)' : 'none',
      outline: isCurrent ? '1px solid rgba(165,180,252,0.16)' : '1px solid transparent',
      outlineOffset: 2,
      transition: 'background 180ms ease, border-color 180ms ease, box-shadow 180ms ease, border-radius 180ms ease',
    };
  };

  const diagramButtonStyle = (isCurrent: boolean, isFocused: boolean) => ({
    appearance: 'none' as const,
    border: `1px solid ${isCurrent ? 'rgba(165,180,252,0.3)' : 'rgba(148,163,184,0.18)'}`,
    background: isCurrent ? 'rgba(99,102,241,0.16)' : 'rgba(255,255,255,0.03)',
    color: isCurrent ? '#f8fafc' : 'var(--color-text-muted, #98a2b3)',
    borderRadius: 999,
    padding: '10px 14px',
    minHeight: 40,
    display: 'inline-flex',
    alignItems: 'center',
    gap: 8,
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
    boxShadow: isCurrent ? '0 10px 30px rgba(99,102,241,0.12)' : 'none',
    outline: isFocused ? '2px solid rgba(165, 180, 252, 0.8)' : 'none',
    outlineOffset: isFocused ? 3 : 0,
  });

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
    <main className="public-home" style={{ minHeight: '100vh', background: 'radial-gradient(circle at top, rgba(148,163,184,0.08), transparent 24%), radial-gradient(circle at 80% 0%, rgba(99,102,241,0.08), transparent 18%), #070b14', color: 'var(--color-text, #eef1f8)' }}>
      <style>{`
        .public-home .public-home__shell { width: min(1320px, calc(100% - 40px)); margin: 0 auto; padding: 28px 0 72px; }
        .public-home .public-home__header { display: flex; justify-content: space-between; align-items: flex-start; gap: 24px; margin-bottom: 42px; flex-wrap: wrap; }
        .public-home .public-home__hero { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 22px; align-items: stretch; }
        .public-home .public-home__split { display: grid; grid-template-columns: minmax(0, 1.18fr) minmax(290px, 0.82fr); gap: 26px; align-items: start; }
        .public-home .public-home__split--privacy { grid-template-columns: minmax(0, 1.12fr) minmax(310px, 0.88fr); }
        .public-home .public-home__split--workflow { grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr); }
        .public-home .public-home__stack { display: grid; gap: 18px; padding-top: 48px; }
        .public-home .public-home__stack--privacy { gap: 18px; }
        .public-home .public-home__stack--workflow { gap: 14px; }
        .public-home .public-home__access { margin-top: 42px; padding-top: 28px; border-top: 1px solid rgba(148,163,184,0.12); display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; align-items: start; }
        .public-home .public-home__card-list { display: flex; flex-wrap: wrap; gap: 10px; }
        .public-home .public-home__hero-aside { display: grid; gap: 16px; }
        @media (max-width: 960px) {
          .public-home .public-home__shell { width: min(100% - 24px, 1360px); padding: 20px 0 56px; }
          .public-home .public-home__header { margin-bottom: 32px; }
          .public-home .public-home__hero,
          .public-home .public-home__split,
          .public-home .public-home__split--privacy,
          .public-home .public-home__split--workflow,
          .public-home .public-home__access { grid-template-columns: 1fr; gap: 20px; }
          .public-home .public-home__stack,
          .public-home .public-home__stack--privacy,
          .public-home .public-home__stack--workflow { padding-top: 0; }
          .public-home .public-home__hero-aside { gap: 12px; }
        }
        @media (max-width: 640px) {
          .public-home .public-home__shell { width: min(100% - 18px, 1360px); padding: 16px 0 44px; }
          .public-home .public-home__header { gap: 16px; margin-bottom: 28px; }
          .public-home .public-home__card-list { gap: 8px; }
          .public-home .public-home__hero > div,
          .public-home .public-home__hero-aside > div,
          .public-home .public-home__stack > article,
          .public-home .public-home__stack--privacy > article,
          .public-home .public-home__stack--workflow > div { min-width: 0; }
        }
      `}</style>
      <div className="public-home__shell">
        <header className="public-home__header">
          <div style={{ display: 'grid', gap: 8 }}>
            <p style={{ margin: 0, textTransform: 'uppercase', letterSpacing: '0.16em', color: 'var(--color-text-muted, #98a2b3)', fontSize: 11 }}>{copy.header.eyebrow}</p>
            <h1 style={{ margin: '6px 0 0', fontSize: 19, fontWeight: 620, letterSpacing: '-0.01em' }}>{copy.header.title}</h1>
            {user ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8, width: 'fit-content', padding: '6px 10px', borderRadius: 999, border: '1px solid rgba(148, 163, 184, 0.22)', background: 'rgba(255,255,255,0.03)', color: '#e2e8f0', fontSize: 12, fontWeight: 650 }}>
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
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(148,163,184,0.18)', background: 'rgba(255,255,255,0.03)' }}>
              <span style={{ color: 'var(--color-text-muted, #98a2b3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>{copy.nav.language}</span>
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        <section className="public-home__hero">
          <div style={{ borderRadius: 30, padding: '24px clamp(18px, 3.2vw, 32px)', background: 'linear-gradient(180deg, rgba(255,255,255,0.03), rgba(255,255,255,0.015))', border: '1px solid rgba(148,163,184,0.12)', boxShadow: '0 24px 80px rgba(0,0,0,0.18)' }}>
            <p style={{ margin: 0, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 700 }}>{copy.hero.eyebrow}</p>
            <h2 style={{ margin: '14px 0 14px', fontSize: 'clamp(34px, 4.8vw, 56px)', lineHeight: 0.94, maxWidth: 720, fontWeight: 680, letterSpacing: '-0.03em' }}>{copy.hero.title}</h2>
            <p style={{ margin: '0 0 18px', fontSize: 17, lineHeight: 1.75, color: 'var(--color-text-muted, #98a2b3)', maxWidth: 760 }}>
              {copy.hero.subtitle}
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
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
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, width: 'fit-content', padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(148, 163, 184, 0.22)', background: 'rgba(255,255,255,0.04)', color: '#e2e8f0', fontSize: 13, fontWeight: 650 }}>
                  <ShieldCheck size={14} />
                  <span>{copy.hero.resumeIndicator}</span>
                </div>
              ) : null}

            <div className="public-home__card-list">
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
                    background: cta.primary ? 'linear-gradient(135deg, #94a3b8, #6366f1)' : 'transparent',
                    border: cta.primary ? '1px solid rgba(255,255,255,0.08)' : 'none',
                    color: cta.primary ? '#fff' : 'var(--color-text-muted, #98a2b3)',
                    fontWeight: cta.primary ? 700 : 600,
                    borderBottom: cta.primary ? 'none' : '1px solid rgba(148,163,184,0.18)',
                    boxShadow: cta.primary ? '0 16px 40px rgba(99,102,241,0.12)' : 'none',
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

          <aside id="hero-visual" className="public-home__hero-aside">
            <KddHeroVisual
              active={sectionActive('designs')}
              mode={sectionMode('designs')}
              emphasis={sectionMode('designs')}
              selectedId={selectedId}
              reducedMotion={reducedMotion}
              subtitle={visual.subtitle}
              phrase={visual.phrase}
            />
            <div style={{ borderTop: '1px solid rgba(148,163,184,0.14)', paddingTop: 18 }}>
              <p style={{ margin: 0, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 700 }}>{copy.foundingPanel.eyebrow}</p>
              <h3 style={{ margin: '12px 0 14px', fontSize: 24, letterSpacing: '-0.02em' }}>{copy.foundingPanel.title}</h3>
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

        <section id="designs" data-section="designs" data-testid="section-designs" ref={bindSection('designs')} {...sectionEvents('designs')} style={sectionFrameStyle('designs')}>
          <div className="public-home__split">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <SectionTitle eyebrow={copy.designs.eyebrow} title={copy.designs.title} body={copy.designs.body} />
                <button type="button" aria-pressed={sectionActive('designs')} aria-label="Activate designs diagram" {...sectionSelectionProps('designs')} style={diagramButtonStyle(sectionActive('designs'), hoveredSection === 'designs')}>
                  Activate designs diagram
                </button>
              </div>
              <DesignsCanvas
                title={copy.designs.title}
                subtitle={copy.designs.body}
                cards={copy.designs.cards}
                networkBody={copy.network.body}
                steps={['Aprendizaje privado', 'Detectar patrones', 'Explicar causa']}
                active={sectionActive('designs')}
                mode={sectionMode('designs')}
                selectedId={selectedId}
                reducedMotion={reducedMotion}
                isActive={sectionActive('designs')}
                emphasis={sectionMode('designs')}
              />
            </div>
            <div className="public-home__stack">
              {copy.designs.cards.map(card => (
                <article key={card.title} style={{ paddingTop: 12, borderTop: `1px solid ${card.accent === '#60a5fa' ? 'rgba(148,163,184,0.24)' : card.accent === '#8b5cf6' ? 'rgba(148,163,184,0.22)' : 'rgba(148,163,184,0.2)'}` }}>
                  <p style={{ margin: 0, color: card.accent === '#60a5fa' ? '#94a3b8' : card.accent === '#8b5cf6' ? '#a5b4fc' : '#86efac', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 700 }}>{card.eyebrow}</p>
                  <h3 style={{ margin: '8px 0 6px', fontSize: 18, lineHeight: 1.15, letterSpacing: '-0.015em' }}>{card.title}</h3>
                  <p style={{ margin: 0, color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.6 }}>{card.body}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section data-section="privacy" data-testid="section-privacy" ref={bindSection('privacy')} {...sectionEvents('privacy')} style={sectionFrameStyle('privacy')}>
          <div className="public-home__split public-home__split--privacy">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <SectionTitle eyebrow={copy.privacy.eyebrow} title={copy.privacy.title} body={copy.privacy.body} />
                <button type="button" aria-pressed={sectionActive('privacy')} aria-label="Activate privacy diagram" {...sectionSelectionProps('privacy')} style={diagramButtonStyle(sectionActive('privacy'), hoveredSection === 'privacy')}>
                  Activate privacy diagram
                </button>
              </div>
              <PrivacyCanvas
                title={copy.privacy.title}
                subtitle={copy.privacy.body}
                cards={copy.privacy.cards}
                principles={copy.privacy.principles}
                active={sectionActive('privacy')}
                mode={sectionMode('privacy')}
                selectedId={selectedId}
                reducedMotion={reducedMotion}
                isActive={sectionActive('privacy')}
                emphasis={sectionMode('privacy')}
              />
            </div>
            <div className="public-home__stack public-home__stack--privacy">
              {copy.privacy.cards.map((card, index) => (
                <article key={card.title} style={{ paddingTop: 14, borderTop: `1px solid ${index === 0 ? 'rgba(148,163,184,0.22)' : index === 1 ? 'rgba(165,180,252,0.24)' : 'rgba(134,239,172,0.22)'}` }}>
                  <p style={{ margin: 0, color: index === 0 ? '#94a3b8' : index === 1 ? '#a5b4fc' : '#86efac', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 700 }}>{card.title}</p>
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

        <section data-section="workflow" data-testid="section-workflow" ref={bindSection('workflow')} {...sectionEvents('workflow')} style={sectionFrameStyle('workflow')}>
          <div className="public-home__split public-home__split--workflow">
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <SectionTitle eyebrow={copy.workflow.eyebrow} title={copy.workflow.title} body={copy.workflow.body} />
                <button type="button" aria-pressed={sectionActive('workflow')} aria-label="Activate workflow diagram" {...sectionSelectionProps('workflow')} style={diagramButtonStyle(sectionActive('workflow'), hoveredSection === 'workflow')}>
                  Activate workflow diagram
                </button>
              </div>
              <WorkflowCanvas
                title={copy.workflow.title}
                subtitle={copy.workflow.body}
                steps={copy.workflow.steps}
                active={sectionActive('workflow')}
                mode={sectionMode('workflow')}
                selectedId={selectedId}
                reducedMotion={reducedMotion}
                isActive={sectionActive('workflow')}
                emphasis={sectionMode('workflow')}
              />
            </div>
            <div className="public-home__stack public-home__stack--workflow">
              {copy.workflow.steps.map((step, index) => (
                <div key={step} style={{ paddingTop: 12, borderTop: '1px solid rgba(148,163,184,0.14)' }}>
                  <div style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 11, fontWeight: 700, marginBottom: 8 }}>0{index + 1}</div>
                  <div style={{ fontWeight: 700, marginBottom: 6 }}>{step}</div>
                  <div style={{ color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.5 }}>{index === 0 ? 'Telemetry and context' : index === 1 ? 'Choose the next decision' : index === 2 ? 'Share what is allowed' : 'Validate the outcome'}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="public-home__access">
          <div>
            <SectionTitle eyebrow={copy.access.eyebrow} title={copy.access.title} body={copy.access.body} />
            <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
              <div style={{ paddingTop: 10, borderTop: '1px solid rgba(148,163,184,0.14)' }}>
                <div style={{ color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 11, fontWeight: 700 }}>01</div>
                <div style={{ fontWeight: 700, marginTop: 6 }}>{copy.access.trialCta}</div>
              </div>
              <div style={{ paddingTop: 10, borderTop: '1px solid rgba(148,163,184,0.14)' }}>
                <div style={{ color: '#a5b4fc', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 11, fontWeight: 700 }}>02</div>
                <div style={{ fontWeight: 700, marginTop: 6 }}>{copy.access.eyebrow}</div>
              </div>
              <div style={{ paddingTop: 10, borderTop: '1px solid rgba(148,163,184,0.14)' }}>
                <div style={{ color: '#86efac', textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 11, fontWeight: 700 }}>03</div>
                <div style={{ fontWeight: 700, marginTop: 6 }}>{copy.access.foundingCta}</div>
              </div>
            </div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <a href="/trial" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 14, background: 'linear-gradient(135deg, #94a3b8, #6366f1)', color: '#fff', fontWeight: 700, boxShadow: '0 16px 40px rgba(99,102,241,0.12)' }}>
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
