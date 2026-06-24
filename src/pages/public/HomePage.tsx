import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowRight, CheckCircle2, Layers3, NotebookText, PlayCircle, Radar, ShieldCheck } from 'lucide-react';

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

function DesignCard({ eyebrow, title, body, chips, accent }: { eyebrow: string; title: string; body: string; chips: string[]; accent: string }) {
  return (
    <article style={{ borderTop: `2px solid color-mix(in srgb, ${accent} 55%, transparent)`, paddingTop: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 8 }}>
        <p style={{ margin: 0, color: accent, textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 11, fontWeight: 700 }}>{eyebrow}</p>
        <span aria-hidden="true" style={{ width: 8, height: 8, borderRadius: 999, background: accent }} />
      </div>
      <h3 style={{ margin: '0 0 8px', fontSize: 20, lineHeight: 1.1 }}>{title}</h3>
      <p style={{ margin: '0 0 14px', color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.6 }}>{body}</p>
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

function BlueprintDiagram({ eyebrow, title, body, nodes }: { eyebrow: string; title: string; body: string; nodes: Array<{ label: string; title: string; body: string; accent: string }> }) {
  return (
    <div style={{ marginBottom: 18, padding: '4px 0 14px' }}>
      <div style={{ display: 'grid', gap: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, alignItems: 'stretch' }}>
          {nodes.slice(0, 2).map((node, index) => (
            <article key={node.label} style={{ borderTop: `2px solid ${node.accent}`, paddingTop: 12 }}>
              <p style={{ margin: 0, color: node.accent, textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 700 }}>{node.label}</p>
              <h3 style={{ margin: '8px 0 8px', fontSize: 18, lineHeight: 1.1 }}>{node.title}</h3>
              <p style={{ margin: 0, color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.55 }}>{node.body}</p>
            </article>
          ))}

          <article style={{ borderRadius: 22, padding: 18, border: '1px solid rgba(96, 165, 250, 0.18)', background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(3,7,18,0.55))', display: 'grid', gap: 12, alignContent: 'center', minHeight: 168 }}>
            <p style={{ margin: 0, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: 11, fontWeight: 700 }}>{eyebrow}</p>
            <h3 style={{ margin: 0, fontSize: 28, lineHeight: 1.05 }}>{title}</h3>
            <p style={{ margin: 0, color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.6 }}>{body}</p>
          </article>

          <article style={{ borderTop: `2px solid ${nodes[2].accent}`, paddingTop: 12 }}>
            <p style={{ margin: 0, color: nodes[2].accent, textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 700 }}>{nodes[2].label}</p>
            <h3 style={{ margin: '8px 0 8px', fontSize: 18, lineHeight: 1.1 }}>{nodes[2].title}</h3>
            <p style={{ margin: 0, color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.55 }}>{nodes[2].body}</p>
          </article>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10 }}>
          {nodes.map(node => (
            <div key={`${node.label}-${node.title}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderTop: '1px solid rgba(148, 163, 184, 0.14)' }}>
              <span aria-hidden="true" style={{ width: 11, height: 11, borderRadius: 999, background: node.accent, boxShadow: `0 0 0 6px color-mix(in srgb, ${node.accent} 14%, transparent)` }} />
              <div>
                <div style={{ color: node.accent, textTransform: 'uppercase', letterSpacing: '0.12em', fontSize: 10, fontWeight: 700 }}>{node.label}</div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{node.title}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
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

function NetworkDiagram({ eyebrow, cards }: { eyebrow: string; cards: Array<{ title: string; body: string }> }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(240px, 1.2fr) minmax(0, 1fr)', gap: 18, marginBottom: 18 }}>
      <article style={{ borderTop: '1px solid rgba(148,163,184,0.14)', paddingTop: 14, display: 'grid', gap: 10, alignContent: 'center' }}>
        <p style={{ margin: 0, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: 11, fontWeight: 700 }}>{eyebrow}</p>
        <h3 style={{ margin: 0, fontSize: 28, lineHeight: 1.05 }}>{cards[0].title}</h3>
        <p style={{ margin: 0, color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.6 }}>{cards[0].body}</p>
      </article>
      <div style={{ display: 'grid', gap: 12, alignContent: 'start', paddingTop: 8 }}>
        {cards.slice(1).map((card, index) => (
          <div key={card.title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start', padding: '12px 0', borderTop: '1px solid rgba(148,163,184,0.14)' }}>
            <span aria-hidden="true" style={{ width: 10, height: 10, marginTop: 5, borderRadius: 999, background: index % 2 === 0 ? '#60a5fa' : '#34d399' }} />
            <div>
              <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>{card.title}</h3>
              <p style={{ margin: 0, color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.55 }}>{card.body}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PrivacyDiagram({ cards, principles }: { cards: Array<{ title: string; body: string }>; principles: string[] }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14, marginBottom: 18 }}>
      {cards.map((card, index) => (
        <article key={card.title} style={{ padding: '12px 0 0', borderTop: `2px solid ${index === 2 ? '#34d399' : index === 1 ? '#8b5cf6' : '#60a5fa'}` }}>
          <p style={{ margin: 0, color: index === 2 ? '#34d399' : index === 1 ? '#8b5cf6' : '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 700 }}>{card.title}</p>
          <p style={{ margin: '8px 0 0', color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.55 }}>{card.body}</p>
        </article>
      ))}
      <article style={{ gridColumn: '1 / -1', paddingTop: 10, borderTop: '1px solid rgba(148,163,184,0.14)' }}>
        <div style={{ display: 'grid', gap: 8 }}>
          {principles.map((item, index) => (
            <div key={item} style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--color-text, #eef1f8)' }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: index === 0 ? '#60a5fa' : index === 1 ? '#8b5cf6' : '#34d399' }} />
              <span style={{ lineHeight: 1.5 }}>{item}</span>
            </div>
          ))}
        </div>
      </article>
    </div>
  );
}

function LevelDiagram({ cards }: { cards: Array<{ title: string; body: string }> }) {
  return (
    <div style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
      {cards.map((card, index) => (
        <div key={card.title} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12, alignItems: 'center', padding: '12px 0', borderTop: '1px solid rgba(148,163,184,0.14)', marginLeft: `${index * 12}px` }}>
          <span style={{ width: 34, height: 34, borderRadius: 999, display: 'grid', placeItems: 'center', background: index === 0 ? '#60a5fa' : index === 1 ? '#8b5cf6' : '#34d399', color: '#fff', fontWeight: 800 }}>{index + 1}</span>
          <div>
            <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>{card.title}</h3>
            <p style={{ margin: 0, color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.55 }}>{card.body}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function WorkflowDiagram({ steps }: { steps: string[] }) {
  return (
    <div style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
      {steps.map((step, index) => (
        <div key={step} style={{ display: 'grid', gridTemplateColumns: 'auto 1fr', gap: 12, alignItems: 'center' }}>
          <div style={{ display: 'grid', justifyItems: 'center', gap: 4 }}>
            <div style={{ width: 34, height: 34, borderRadius: 999, display: 'grid', placeItems: 'center', background: index < 3 ? '#60a5fa' : '#34d399', color: '#fff', fontWeight: 800 }}>{index + 1}</div>
            {index < steps.length - 1 ? <div style={{ width: 2, height: 22, background: 'linear-gradient(180deg, #60a5fa, #34d399)' }} /> : null}
          </div>
          <div style={{ padding: '12px 0 10px', borderTop: '1px solid rgba(148,163,184,0.14)' }}>
            <div style={{ fontWeight: 700 }}>{step}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CapabilityDiagram({ cards }: { cards: Array<{ title: string; body: string }> }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 18 }}>
      {cards.map((card, index) => (
        <article key={card.title} style={{ padding: '12px 0 0', borderTop: `2px solid ${index % 3 === 0 ? '#60a5fa' : index % 3 === 1 ? '#8b5cf6' : '#34d399'}` }}>
          <p style={{ margin: 0, color: index % 3 === 0 ? '#60a5fa' : index % 3 === 1 ? '#8b5cf6' : '#34d399', textTransform: 'uppercase', letterSpacing: '0.14em', fontSize: 11, fontWeight: 700 }}>0{index + 1}</p>
          <h3 style={{ margin: '8px 0 6px', fontSize: 16 }}>{card.title}</h3>
          <p style={{ margin: 0, color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.55 }}>{card.body}</p>
        </article>
      ))}
    </div>
  );
}

function AudienceDiagram({ cards }: { cards: Array<{ title: string; body: string }> }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 10, marginBottom: 18 }}>
      {cards.map((card, index) => (
        <article key={card.title} style={{ padding: '12px 0 0', borderTop: `2px solid ${index % 2 === 0 ? '#60a5fa' : '#8b5cf6'}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <span aria-hidden="true" style={{ width: 12, height: 12, borderRadius: 999, background: index % 2 === 0 ? '#60a5fa' : '#8b5cf6' }} />
            <h3 style={{ margin: 0, fontSize: 16 }}>{card.title}</h3>
          </div>
          <p style={{ margin: 0, color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.55 }}>{card.body}</p>
        </article>
      ))}
    </div>
  );
}

function AccessDiagram({ trialCta, accessLabel, foundingCta }: { trialCta: string; accessLabel: string; foundingCta: string }) {
  return (
    <div style={{ display: 'grid', gap: 10, marginBottom: 18 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 10 }}>
        {[
          { label: '01', title: trialCta, accent: '#22c55e' },
          { label: '02', title: accessLabel, accent: '#06b6d4' },
          { label: '03', title: foundingCta, accent: '#8b5cf6' },
        ].map((item, index) => (
          <div key={item.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderTop: '1px solid rgba(148,163,184,0.14)' }}>
            <span style={{ width: 32, height: 32, borderRadius: 999, display: 'grid', placeItems: 'center', background: item.accent, color: '#fff', fontWeight: 800 }}>{item.label}</span>
            <span style={{ fontWeight: 700, lineHeight: 1.4 }}>{item.title}</span>
          </div>
        ))}
      </div>
    </div>
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
              <a href="/login" style={{ textDecoration: 'none' }}><Pill><PlayCircle size={14} /> {copy.nav.login}</Pill></a>
              <a href="#stack" style={{ textDecoration: 'none' }}><Pill><Layers3 size={14} /> {copy.nav.stack}</Pill></a>
            </nav>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(148,163,184,0.18)', background: 'rgba(15,23,42,0.58)' }}>
              <span style={{ color: 'var(--color-text-muted, #98a2b3)', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>{copy.nav.language}</span>
              <LanguageSwitcher />
            </div>
          </div>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, alignItems: 'stretch' }}>
          <div style={{ borderRadius: 28, padding: '28px clamp(20px, 4vw, 40px)', background: 'linear-gradient(180deg, rgba(255,255,255,0.02), rgba(3,7,18,0.58))' }}>
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
            <p style={{ margin: '14px 0 0', fontSize: 12, lineHeight: 1.6, color: 'var(--color-text-muted, #98a2b3)', maxWidth: 640 }}>
              {copy.hero.note}
            </p>
          </div>

          <aside id="prueba" style={{ display: 'grid', gap: 16 }}>
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

        <section style={{ marginTop: 44, paddingTop: 28, borderTop: '1px solid rgba(148,163,184,0.12)' }}>
          <SectionTitle eyebrow={copy.designs.eyebrow} title={copy.designs.title} body={copy.designs.body} />
          <BlueprintDiagram
            eyebrow={copy.designs.eyebrow}
            title={copy.designs.title}
            body={copy.designs.body}
            nodes={copy.designs.cards.map(card => ({ label: card.eyebrow, title: card.title, body: card.body, accent: card.accent }))}
          />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 16 }}>
            {copy.designs.cards.map(card => <DesignCard key={card.title} eyebrow={card.eyebrow} title={card.title} body={card.body} chips={card.chips} accent={card.accent} />)}
          </div>
        </section>

        <section style={{ marginTop: 44, paddingTop: 28, borderTop: '1px solid rgba(148,163,184,0.12)' }}>
          <SectionTitle eyebrow={copy.network.eyebrow} title={copy.network.title} body={copy.network.body} />
          <NetworkDiagram eyebrow={copy.network.eyebrow} cards={copy.network.cards} />
        </section>

        <section style={{ marginTop: 44, paddingTop: 28, borderTop: '1px solid rgba(148,163,184,0.12)' }}>
          <SectionTitle eyebrow={copy.privacy.eyebrow} title={copy.privacy.title} body={copy.privacy.body} />
          <PrivacyDiagram cards={copy.privacy.cards} principles={copy.privacy.principles} />
        </section>

        <section style={{ marginTop: 44, paddingTop: 28, borderTop: '1px solid rgba(148,163,184,0.12)' }}>
          <SectionTitle eyebrow={copy.levels.eyebrow} title={copy.levels.title} body={copy.levels.body} />
          <LevelDiagram cards={copy.levels.cards} />
        </section>

        <section style={{ marginTop: 44, paddingTop: 28, borderTop: '1px solid rgba(148,163,184,0.12)' }}>
          <SectionTitle eyebrow={copy.workflow.eyebrow} title={copy.workflow.title} body={copy.workflow.body} />
          <WorkflowDiagram steps={copy.workflow.steps} />
        </section>

        <section style={{ marginTop: 44, paddingTop: 28, borderTop: '1px solid rgba(148,163,184,0.12)' }}>
          <SectionTitle eyebrow={copy.capabilities.eyebrow} title={copy.capabilities.title} body={copy.capabilities.body} />
          <CapabilityDiagram cards={copy.capabilities.cards} />
        </section>

        <section style={{ marginTop: 44, paddingTop: 28, borderTop: '1px solid rgba(148,163,184,0.12)' }}>
          <SectionTitle eyebrow={copy.audiences.eyebrow} title={copy.audiences.title} body={copy.audiences.body} />
          <AudienceDiagram cards={copy.audiences.cards} />
        </section>

        <section id="stack" style={{ marginTop: 44, paddingTop: 28, borderTop: '1px solid rgba(148,163,184,0.12)' }}>
          <SectionTitle eyebrow={copy.stack.eyebrow} title={copy.stack.title} body={copy.stack.body} />
          <StackDiagram items={copy.stack.items} />
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
            {copy.stack.items.map(item => (
              <Pill key={item}><Radar size={14} /> {item}</Pill>
            ))}
          </div>
        </section>

        <section style={{ marginTop: 44, paddingTop: 28, borderTop: '1px solid rgba(148,163,184,0.12)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 18, alignItems: 'stretch' }}>
          <div style={{ padding: 0 }}>
            <SectionTitle eyebrow={copy.access.eyebrow} title={copy.access.title} body={copy.access.body} />
            <AccessDiagram trialCta={copy.access.trialCta} accessLabel={copy.access.eyebrow} foundingCta={copy.access.foundingCta} />
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
              <a href="/trial" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 14, background: 'linear-gradient(135deg, #22c55e, #06b6d4)', color: '#fff', fontWeight: 700 }}>
                {copy.access.trialCta} <PlayCircle size={16} />
              </a>
              <a href="/login" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 14, border: '1px solid rgba(148,163,184,0.24)', background: 'rgba(15,23,42,0.6)', color: 'var(--color-text, #eef1f8)', fontWeight: 700 }}>
                {copy.access.foundingCta} <ShieldCheck size={16} />
              </a>
            </div>
          </div>

          <div style={{ padding: 0 }}>
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
