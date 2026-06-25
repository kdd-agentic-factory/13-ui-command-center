import { useId } from 'react';
import { useTranslation } from 'react-i18next';

type KddHeroVisualProps = {
  subtitle?: string;
  phrase?: string;
  active?: boolean;
  mode?: 'active' | 'recede';
  emphasis?: 'active' | 'recede';
  selectedId?: string | null;
  reducedMotion?: boolean;
};

export function KddHeroVisual({ subtitle, phrase, active = false, mode = 'recede', emphasis, selectedId, reducedMotion = false }: KddHeroVisualProps) {
  const { t } = useTranslation();
  const copy = t('public.heroVisual', { returnObjects: true }) as {
    subtitle: string;
    phrase: string;
    fallback: string;
    sr: string;
  };
  const srId = useId();
  const diagramMode = emphasis ?? mode;

  return (
    <div
      data-active={String(active)}
      data-mode={diagramMode}
      data-emphasis={diagramMode}
      data-motion-state={reducedMotion ? 'reduced' : 'live'}
      data-selected-id={selectedId ?? ''}
      data-reduced-motion={String(reducedMotion)}
      style={{
        position: 'relative',
        overflow: 'hidden',
        minHeight: 420,
        borderRadius: 24,
        border: '1px solid var(--public-border, rgba(15,23,42,0.12))',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.9), rgba(246,241,234,0.96))',
        boxShadow: '0 28px 60px rgba(15,23,42,0.08)',
        opacity: diagramMode === 'active' ? 1 : 0.94,
        transform: diagramMode === 'active' ? 'translateY(0)' : 'translateY(2px)',
        filter: diagramMode === 'active' ? 'saturate(1.02) brightness(1.01)' : 'saturate(0.98) brightness(0.99)',
        transition: reducedMotion ? 'none' : 'opacity 180ms ease, transform 180ms ease, filter 180ms ease',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 22% 18%, rgba(143,29,42,0.08), transparent 24%), radial-gradient(circle at 72% 22%, rgba(15,23,42,0.06), transparent 22%), radial-gradient(circle at 52% 86%, rgba(15,23,42,0.05), transparent 28%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, padding: 24, display: 'grid', gap: 18 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ display: 'grid', gap: 8, maxWidth: 340 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 10, width: 'fit-content', padding: '7px 11px', borderRadius: 999, border: '1px solid rgba(143,29,42,0.16)', background: 'rgba(143,29,42,0.06)', color: 'var(--public-obsidian, #0b0f14)', fontSize: 11, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
              KDD / Motorsports editorial
            </div>
            <div style={{ display: 'grid', gap: 6 }}>
              <div style={{ fontSize: 44, lineHeight: 0.94, fontWeight: 800, letterSpacing: '-0.05em', color: 'var(--public-obsidian, #0b0f14)' }}>KDD</div>
              <div style={{ maxWidth: 300, fontSize: 15, lineHeight: 1.55, color: 'var(--public-text-muted, #5f6875)' }}>
                {subtitle ?? copy.subtitle}
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 8, textAlign: 'right', marginLeft: 'auto' }}>
            <div style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.16em', fontWeight: 700, color: 'var(--public-text-muted, #5f6875)' }}>Decision intelligence layer</div>
            <div style={{ fontSize: 14, fontWeight: 650, color: 'var(--public-text, #111317)' }}>{phrase ?? copy.phrase}</div>
          </div>
        </div>

        <svg
          role="img"
          aria-labelledby={srId}
          viewBox="0 0 1120 280"
          style={{ width: '100%', height: 'auto', display: 'block' }}
        >
          <style>{`
            .kdd-hero__line,
            .kdd-hero__node,
            .kdd-hero__panel,
            .kdd-hero__ring {
              transform-box: fill-box;
              transform-origin: center;
            }

            .kdd-hero__line {
              animation: kddHeroLine 8s ease-in-out infinite;
            }

            .kdd-hero__node {
              animation: kddHeroNode 6s ease-in-out infinite;
            }

            .kdd-hero__panel {
              animation: kddHeroFloat 10s ease-in-out infinite;
            }

            .kdd-hero__ring {
              animation: kddHeroRing 12s ease-in-out infinite;
            }

            @keyframes kddHeroLine {
              0%, 100% { opacity: 0.58; stroke-dashoffset: 0; }
              50% { opacity: 0.9; stroke-dashoffset: -26; }
            }

            @keyframes kddHeroNode {
              0%, 100% { transform: translateY(0); opacity: 0.72; }
              50% { transform: translateY(-6px); opacity: 1; }
            }

            @keyframes kddHeroFloat {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-5px); }
            }

            @keyframes kddHeroRing {
              0%, 100% { transform: scale(1); }
              50% { transform: scale(1.02); }
            }

            [data-reduced-motion='true'] .kdd-hero__line,
            [data-reduced-motion='true'] .kdd-hero__node,
            [data-reduced-motion='true'] .kdd-hero__panel,
            [data-reduced-motion='true'] .kdd-hero__ring {
              animation: none !important;
            }
          `}</style>

          <defs>
            <linearGradient id="kdd-hero-line" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(15,23,42,0.16)" />
              <stop offset="52%" stopColor="rgba(143,29,42,0.65)" />
              <stop offset="100%" stopColor="rgba(15,23,42,0.18)" />
            </linearGradient>
            <radialGradient id="kdd-hero-glow" cx="50%" cy="42%" r="58%">
              <stop offset="0%" stopColor="rgba(143,29,42,0.12)" />
              <stop offset="56%" stopColor="rgba(15,23,42,0.04)" />
              <stop offset="100%" stopColor="rgba(15,23,42,0)" />
            </radialGradient>
          </defs>

          <rect x="0" y="0" width="1120" height="280" rx="24" fill="url(#kdd-hero-glow)" />
          <rect x="44" y="30" width="1032" height="220" rx="22" fill="rgba(255,255,255,0.68)" stroke="rgba(15,23,42,0.08)" />

          <g>
            <text x="74" y="76" fill="rgba(15,23,42,0.58)" fontSize="12" fontWeight="700" letterSpacing="3">TELEMETRY BELOW</text>
            <text x="74" y="110" fill="rgba(15,23,42,0.88)" fontSize="28" fontWeight="800" letterSpacing="-0.03em">Decision intelligence above telemetry</text>
            <text x="74" y="138" fill="rgba(95,104,117,0.95)" fontSize="15">{phrase ?? copy.fallback}</text>
          </g>

          <g className="kdd-hero__panel">
            <rect x="74" y="166" width="240" height="66" rx="18" fill="rgba(15,23,42,0.04)" stroke="rgba(15,23,42,0.08)" />
            <text x="96" y="196" fill="rgba(15,23,42,0.78)" fontSize="12" fontWeight="800" letterSpacing="2.4">TELEMETRY</text>
            <text x="96" y="220" fill="rgba(95,104,117,0.94)" fontSize="14">Signals stay intact and readable.</text>
          </g>

          <g>
            <path className="kdd-hero__line" d="M 314 199 C 388 199, 442 199, 500 199" fill="none" stroke="url(#kdd-hero-line)" strokeWidth="2.5" strokeDasharray="8 10" />
            <circle className="kdd-hero__node" cx="406" cy="199" r="13" fill="rgba(143,29,42,0.14)" stroke="rgba(143,29,42,0.4)" />
            <circle cx="406" cy="199" r="5.5" fill="rgba(143,29,42,0.9)" />
          </g>

          <g className="kdd-hero__ring">
            <ellipse cx="604" cy="150" rx="152" ry="52" fill="none" stroke="rgba(15,23,42,0.16)" strokeWidth="1.5" />
            <ellipse cx="604" cy="150" rx="202" ry="72" fill="none" stroke="rgba(143,29,42,0.16)" strokeWidth="1.2" strokeDasharray="6 8" />
            <circle cx="604" cy="150" r="46" fill="rgba(143,29,42,0.08)" stroke="rgba(143,29,42,0.28)" />
            <text x="604" y="144" textAnchor="middle" fill="rgba(15,23,42,0.9)" fontSize="20" fontWeight="800">KDD</text>
            <text x="604" y="166" textAnchor="middle" fill="rgba(95,104,117,0.92)" fontSize="10" fontWeight="700" letterSpacing="2.6">LAYER</text>
          </g>

          <g>
            <path className="kdd-hero__line" d="M 682 150 C 756 150, 814 150, 884 150" fill="none" stroke="url(#kdd-hero-line)" strokeWidth="2.5" strokeDasharray="8 10" />
            <circle className="kdd-hero__node" cx="786" cy="150" r="13" fill="rgba(143,29,42,0.14)" stroke="rgba(143,29,42,0.4)" />
            <circle cx="786" cy="150" r="5.5" fill="rgba(143,29,42,0.9)" />
          </g>

          <g className="kdd-hero__panel">
            <rect x="856" y="102" width="180" height="94" rx="20" fill="rgba(15,23,42,0.04)" stroke="rgba(15,23,42,0.08)" />
            <text x="880" y="134" fill="rgba(15,23,42,0.78)" fontSize="12" fontWeight="800" letterSpacing="2.4">FEDERATED</text>
            <text x="880" y="160" fill="rgba(95,104,117,0.94)" fontSize="14">Knowledge moves, data stays put.</text>
          </g>

          <g>
            <rect x="74" y="242" width="214" height="18" rx="9" fill="rgba(143,29,42,0.12)" />
            <rect x="294" y="242" width="174" height="18" rx="9" fill="rgba(15,23,42,0.08)" />
            <rect x="474" y="242" width="238" height="18" rx="9" fill="rgba(15,23,42,0.06)" />
            <rect x="718" y="242" width="154" height="18" rx="9" fill="rgba(143,29,42,0.12)" />
          </g>
        </svg>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', color: 'var(--public-text-muted, #5f6875)', fontSize: 12, lineHeight: 1.6 }}>
          <span>{subtitle ?? copy.subtitle}</span>
          <span style={{ textTransform: 'uppercase', letterSpacing: '0.12em', fontWeight: 700 }}>{reducedMotion ? 'Reduced motion' : 'Editorial motion'}</span>
        </div>
      </div>

      <span id={srId} style={{ position: 'absolute', inset: 0, clipPath: 'inset(50%)', width: 1, height: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>
        {copy.sr}
      </span>
    </div>
  );
}
