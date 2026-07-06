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
    <main className="founding-nodes-page">
      <section className="founding-nodes-container">
        <div className="founding-nodes-hero">
          <p className="founding-nodes-eyebrow">{copy.eyebrow}</p>
          <h1 className="founding-nodes-title">{copy.title}</h1>
          <p className="founding-nodes-body">{copy.body}</p>

          <div className="founding-nodes-actions">
            <a
              href="/trial"
              className="founding-nodes-cta founding-nodes-cta--primary"
              aria-label={copy.primaryCta}
            >
              {copy.primaryCta} <ArrowRight size={16} />
            </a>
            <a
              href="/login"
              className="founding-nodes-cta founding-nodes-cta--secondary"
              aria-label={copy.secondaryCta}
            >
              {copy.secondaryCta} <Sparkles size={16} />
            </a>
          </div>

          <div className="founding-nodes-segments">
            {segments.map(([titleKey, bodyKey]) => (
              <article key={titleKey} className="founding-nodes-segment">
                <div className="founding-nodes-segment-header">
                  <Users size={16} />
                  <h3 className="founding-nodes-segment-title">{t(titleKey)}</h3>
                </div>
                <p className="founding-nodes-segment-body">{t(bodyKey)}</p>
              </article>
            ))}
          </div>
        </div>

        <section className="founding-nodes-grid">
          <article className="founding-nodes-panel">
            <p className="founding-nodes-panel-eyebrow">{copy.nodeBenefits.eyebrow}</p>
            <h2 className="founding-nodes-panel-title">{copy.nodeBenefits.title}</h2>
            <div className="founding-nodes-panel-items">
              {copy.nodeBenefits.items.map(item => (
                <div key={item} className="founding-nodes-item founding-nodes-item--benefit">
                  <CheckCircle2 size={16} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>

          <article className="founding-nodes-panel">
            <p className="founding-nodes-panel-eyebrow">{copy.privacy.eyebrow}</p>
            <h2 className="founding-nodes-panel-title">{copy.privacy.title}</h2>
            <div className="founding-nodes-panel-items">
              {copy.privacy.items.map(item => (
                <div key={item} className="founding-nodes-item founding-nodes-item--privacy">
                  <ShieldCheck size={16} />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="founding-nodes-offer">
          <p className="founding-nodes-offer-eyebrow">{copy.offer.eyebrow}</p>
          <h2 className="founding-nodes-offer-title">{copy.offer.title}</h2>
          <p className="founding-nodes-offer-body">{copy.offer.body}</p>
          <div className="founding-nodes-offer-actions">
            <a
              href="/trial"
              className="founding-nodes-cta--offer"
              aria-label={copy.offer.cta}
            >
              {copy.offer.cta} <NotebookText size={16} />
            </a>
            <a href="/" className="founding-nodes-home-link" aria-label={copy.offer.home}>
              {copy.offer.home}
            </a>
          </div>
        </section>
      </section>
    </main>
  );
}
