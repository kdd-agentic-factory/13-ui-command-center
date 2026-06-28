import { useEffect, useId, useRef, useState } from 'react';
import { animate, createScope, stagger } from 'animejs';

type DesignsCanvasProps = {
  title: string;
  subtitle: string;
  cards: Array<{ eyebrow: string; title: string; body: string; accent: string }>;
  networkBody: string;
  steps: string[];
  active?: boolean;
  mode?: 'active' | 'recede';
  selectedId?: string | null;
  reducedMotion?: boolean;
  isActive?: boolean;
  emphasis?: 'active' | 'recede';
};

function wrapSvgText(text: string, maxChars: number, maxLines = 3) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = '';

  words.forEach(word => {
    const next = current ? `${current} ${word}` : word;
    if (next.length <= maxChars) {
      current = next;
      return;
    }
    if (current) lines.push(current);
    current = word;
  });

  if (current) lines.push(current);
  return lines.slice(0, maxLines);
}

export function DesignsCanvas({ title, subtitle, cards, networkBody, steps, active, mode, selectedId, reducedMotion = false, isActive = false, emphasis = 'recede' }: DesignsCanvasProps) {
  const svgId = useId().replace(/:/g, '');
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [selectedCardId, setSelectedCardId] = useState(() => (cards[0] ? 'card-0' : ''));
  const [focusedCardId, setFocusedCardId] = useState('');
  const isDiagramActive = active ?? isActive;
  const diagramMode = mode ?? emphasis;
  const ids = {
    bg: `dc-bg-${svgId}`,
    mesh: `dc-mesh-${svgId}`,
    glow: `dc-glow-${svgId}`,
    grid: `dc-grid-${svgId}`,
    line: `dc-line-${svgId}`,
    soft: `dc-soft-${svgId}`,
  };

  const cardSlots = [
    { x: 62, y: 186, w: 322, h: 150 },
    { x: 816, y: 186, w: 322, h: 150 },
    { x: 382, y: 500, w: 436, h: 144 },
  ];

  const stepSpacing = steps.length > 1 ? 952 / (steps.length - 1) : 0;
  const stepStart = steps.length > 1 ? 124 : 600;
  const orbitPoints = [
    { x: 524, y: 176, r: 5.5, fill: 'var(--text-muted)' },
    { x: 682, y: 146, r: 5, fill: 'var(--accent)' },
    { x: 728, y: 292, r: 4.8, fill: 'var(--text-dim)' },
    { x: 484, y: 318, r: 4.6, fill: 'var(--text)' },
  ];

  const cardControls = cards.map((card, index) => {
    const controlId = `card-${index}`;
    const slot = cardSlots[index];
    return { card, controlId, slot };
  });

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (reducedMotion) return;

    const scope = createScope({ root }).add(() => {
      animate('.designs-canvas__pulse', {
        scale: diagramMode === 'active' ? [1, 1.08] : [1, 1.04],
        opacity: diagramMode === 'active' ? [0.7, 1] : [0.58, 0.84],
        ease: 'inOutSine',
        duration: diagramMode === 'active' ? 1000 : 1500,
        direction: 'alternate',
        loop: true,
      });

      animate('.designs-canvas__orb', {
        translateY: diagramMode === 'active' ? [0, -14] : [0, -8],
        scale: diagramMode === 'active' ? [1, 1.08] : [1, 1.04],
        ease: 'inOutSine',
        duration: diagramMode === 'active' ? 1200 : 2000,
        direction: 'alternate',
        delay: stagger(120),
        loop: true,
      });

      animate('.designs-canvas__dash', {
        strokeDashoffset: [0, -72],
        ease: 'linear',
        duration: diagramMode === 'active' ? 3000 : 5200,
        loop: true,
      });

      animate('.designs-canvas__orbit-ring', {
        rotate: diagramMode === 'active' ? [0, 14] : [0, 8],
        ease: 'inOutSine',
        duration: diagramMode === 'active' ? 2800 : 4200,
        direction: 'alternate',
        loop: true,
      });
    });

    return () => scope.revert();
  }, [diagramMode, reducedMotion]);

  return (
    <div
      ref={rootRef}
      className="designs-canvas"
      data-active={isDiagramActive ? 'true' : 'false'}
      data-mode={diagramMode}
      data-selected-id={selectedId ?? ''}
      data-selected-item-id={selectedCardId}
      data-reduced-motion={String(reducedMotion)}
      style={{
        borderTop: '1px solid rgba(148,163,184,0.12)',
        paddingTop: 20,
        opacity: diagramMode === 'active' ? 1 : 0.8,
        transform: diagramMode === 'active' ? 'translateY(0) scale(1)' : 'translateY(3px) scale(0.976)',
        transition: 'opacity 180ms ease, transform 180ms ease, filter 180ms ease',
        filter: diagramMode === 'active' ? 'saturate(1.08) brightness(1.03)' : 'saturate(0.88) brightness(0.96)',
      }}
    >
      <div style={{ position: 'relative' }}>
      <svg
        className="designs-canvas__svg"
        viewBox="0 0 1200 760"
        role="img"
        aria-labelledby="designs-canvas-title designs-canvas-desc"
        style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 28, overflow: 'hidden' }}
      >
        <style>{`
          .designs-canvas__orb,
          .designs-canvas__pulse,
          .designs-canvas__drift,
          .designs-canvas__dash {
            transform-box: fill-box;
            transform-origin: center;
          }

          .designs-canvas__orb {
            animation: designsCanvasFloat 16s ease-in-out infinite;
          }

          .designs-canvas__orb--slow {
            animation-duration: 22s;
          }

          .designs-canvas__pulse {
            animation: designsCanvasPulse 4.8s ease-in-out infinite;
          }

          .designs-canvas__dash {
            animation: designsCanvasDash 18s linear infinite;
          }

          .designs-canvas[data-active='true'] .designs-canvas__pulse {
            animation-duration: 3s;
          }

          .designs-canvas[data-active='true'] .designs-canvas__dash {
            animation-duration: 9.5s;
          }

          .designs-canvas[data-active='true'] .designs-canvas__orb {
            animation-duration: 11s;
          }

          .designs-canvas[data-active='true'] .designs-canvas__orb--slow {
            animation-duration: 15s;
          }

          .designs-canvas[data-reduced-motion='true'] .designs-canvas__orb,
          .designs-canvas[data-reduced-motion='true'] .designs-canvas__orb--slow,
          .designs-canvas[data-reduced-motion='true'] .designs-canvas__pulse,
          .designs-canvas[data-reduced-motion='true'] .designs-canvas__dash,
          .designs-canvas[data-reduced-motion='true'] .designs-canvas__orbit-ring {
            animation: none !important;
          }

          @keyframes designsCanvasFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-10px); }
          }

          @keyframes designsCanvasPulse {
            0%, 100% { transform: scale(1); opacity: 0.72; }
            50% { transform: scale(1.05); opacity: 1; }
          }

          @keyframes designsCanvasDash {
            to { stroke-dashoffset: -48; }
          }
        `}</style>
        <title id="designs-canvas-title">{title}</title>
        <desc id="designs-canvas-desc">{subtitle}</desc>

        <defs>
          <linearGradient id={ids.bg} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0e121a" />
            <stop offset="55%" stopColor="#0b1017" />
            <stop offset="100%" stopColor="#070b14" />
          </linearGradient>
          <radialGradient id={ids.glow} cx="50%" cy="32%" r="56%">
            <stop offset="0%" stopColor="rgba(148,163,184,0.18)" />
            <stop offset="34%" stopColor="rgba(165,180,252,0.12)" />
            <stop offset="70%" stopColor="rgba(134,239,172,0.06)" />
            <stop offset="100%" stopColor="rgba(134,239,172,0)" />
          </radialGradient>
          <radialGradient id={ids.soft} cx="50%" cy="52%" r="45%">
            <stop offset="0%" stopColor="rgba(15,23,42,0.22)" />
            <stop offset="100%" stopColor="rgba(15,23,42,0)" />
          </radialGradient>
          <pattern id={ids.grid} width="48" height="48" patternUnits="userSpaceOnUse">
            <path d="M 48 0 L 0 0 0 48" fill="none" stroke="rgba(148,163,184,0.08)" strokeWidth="1" />
          </pattern>
          <pattern id={ids.mesh} width="120" height="120" patternUnits="userSpaceOnUse">
            <path d="M0 60 H120 M60 0 V120" stroke="rgba(148,163,184,0.04)" strokeWidth="1" />
            <circle cx="60" cy="60" r="1.6" fill="rgba(148,163,184,0.1)" />
          </pattern>
          <linearGradient id={ids.line} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#5f6875" />
            <stop offset="50%" stopColor="#8f1d2a" />
            <stop offset="100%" stopColor="#c7ccd4" />
          </linearGradient>
        </defs>

        <rect x="0" y="0" width="1200" height="760" fill={`url(#${ids.bg})`} />
        <rect x="0" y="0" width="1200" height="760" fill={`url(#${ids.mesh})`} opacity="0.42" />
        <rect x="0" y="0" width="1200" height="760" fill={`url(#${ids.grid})`} opacity="0.5" />
        <rect x="0" y="0" width="1200" height="760" fill={`url(#${ids.glow})`} />
        <rect x="0" y="0" width="1200" height="760" fill={`url(#${ids.soft})`} opacity="0.78" />

        <g opacity="0.6">
          <circle cx="122" cy="126" r="110" fill="rgba(148,163,184,0.06)" />
          <circle cx="1076" cy="142" r="120" fill="rgba(165,180,252,0.06)" />
          <circle cx="1004" cy="548" r="150" fill="rgba(134,239,172,0.06)" />
        </g>

        <g opacity="0.92">
          <text x="54" y="62" fill="#cbd5e1" fontSize="18" fontWeight="700" letterSpacing="3">GUIDED CHAPTER FLOW</text>
          <text x="54" y="100" fill="#f8fafc" fontSize="42" fontWeight="650">{title}</text>
          <text x="54" y="132" fill="#c7ccd4" fontSize="18">{subtitle}</text>
        </g>

        <g opacity="0.88">
          <rect x="54" y="164" width="154" height="20" rx="10" fill="rgba(148,163,184,0.12)" />
          <rect x="214" y="164" width="98" height="20" rx="10" fill="rgba(165,180,252,0.12)" />
          <rect x="318" y="164" width="132" height="20" rx="10" fill="rgba(134,239,172,0.12)" />
          <rect x="456" y="164" width="116" height="20" rx="10" fill="rgba(226,232,240,0.08)" />
        </g>

        <g opacity="0.9">
          <path className="designs-canvas__dash" d={`M ${cardSlots[0].x + cardSlots[0].w - 8} ${cardSlots[0].y + 70} C 408 176, 482 170, 520 186`} fill="none" stroke={`url(#${ids.line})`} strokeWidth="2.6" strokeDasharray="7 8" />
          <path className="designs-canvas__dash" d={`M ${cardSlots[1].x + 8} ${cardSlots[1].y + 70} C 792 176, 718 170, 680 186`} fill="none" stroke={`url(#${ids.line})`} strokeWidth="2.6" strokeDasharray="7 8" />
          <path className="designs-canvas__dash" d={`M 600 286 C 600 428, 600 474, 600 500`} fill="none" stroke={`url(#${ids.line})`} strokeWidth="2.6" strokeDasharray="7 8" />
        </g>

        <g>
          <g className="designs-canvas__orbit-ring">
            <circle className="designs-canvas__pulse" cx="600" cy="286" r="88" fill="rgba(15,23,42,0.95)" stroke="rgba(148,163,184,0.32)" strokeWidth="2.2" />
          </g>
          <circle cx="600" cy="286" r="128" fill="none" stroke="rgba(148,163,184,0.16)" strokeWidth="1.5" />
          <circle className="designs-canvas__pulse" cx="600" cy="286" r="166" fill="none" stroke="rgba(165,180,252,0.12)" strokeWidth="1.5" />
          <circle cx="600" cy="286" r="196" fill="none" stroke="rgba(134,239,172,0.09)" strokeWidth="1.25" strokeDasharray="14 10" />
          {orbitPoints.map(point => (
            <g key={`${point.x}-${point.y}`} className={`designs-canvas__orb ${point.x < 600 ? 'designs-canvas__orb--slow' : ''}`}>
              <circle cx={point.x} cy={point.y} r={point.r} fill={point.fill} opacity="0.92" />
            </g>
          ))}
          <text x="600" y="276" textAnchor="middle" fill="#f8fafc" fontSize="28" fontWeight="700">KDD</text>
          <text x="600" y="306" textAnchor="middle" fill="#cbd5e1" fontSize="16" letterSpacing="2">DECISION INTELLIGENCE LAYER</text>
        </g>

        <g>
          {cardSlots.map((slot, index) => {
            const card = cards[index];
            if (!card) return null;

            const titleLines = wrapSvgText(card.title, index === 2 ? 24 : 18, 2);
            const bodyLines = wrapSvgText(card.body, index === 2 ? 48 : 36, index === 2 ? 4 : 3);
            const isSelected = selectedCardId === `card-${index}`;
            const metricLabel = index === 0 ? 'modelo' : index === 1 ? 'contexto' : 'sÃƒÂ­ntesis';
            return (
              <g key={card.title}>
                <rect x={slot.x} y={slot.y} width={slot.w} height={slot.h} rx="26" fill="rgba(15,23,42,0.94)" stroke={isSelected ? '#e2e8f0' : index === 0 ? 'rgba(148,163,184,0.2)' : index === 1 ? 'rgba(165,180,252,0.2)' : 'rgba(134,239,172,0.2)'} strokeWidth={isSelected ? '2' : '1'} />
                <rect x={slot.x} y={slot.y} width={slot.w} height="7" rx="3.5" fill={card.accent} opacity="0.75" />
                <circle cx={slot.x + 18} cy={slot.y + 24} r="5" fill={card.accent} opacity="0.9" />
                <text x={slot.x + 34} y={slot.y + 27} fill={card.accent} letterSpacing="3" fontSize="12" fontWeight="700" style={{ textTransform: 'uppercase' }}>{card.eyebrow}</text>
                <text x={slot.x + 22} y={slot.y + 66} fill="#f8fafc" fontSize={index === 2 ? 26 : 24} fontWeight="650">
                  {titleLines.map((line, lineIndex) => (
                    <tspan key={`${line}-${lineIndex}`} x={slot.x + 22} dy={lineIndex === 0 ? 0 : 28}>{line}</tspan>
                  ))}
                </text>
                <text x={slot.x + 22} y={slot.y + (index === 2 ? 108 : 100)} fill="#c7ccd4" fontSize="14">
                  {bodyLines.map((line, lineIndex) => (
                    <tspan key={`${line}-${lineIndex}`} x={slot.x + 22} dy={lineIndex === 0 ? 0 : 20}>{line}</tspan>
                  ))}
                </text>
                <g transform={`translate(${slot.x + slot.w - 108}, ${slot.y + slot.h - 34})`}>
                  <rect width="90" height="18" rx="9" fill="rgba(255,255,255,0.04)" stroke="rgba(148,163,184,0.12)" />
                  <text x="45" y="13" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="700" letterSpacing="1.4">{metricLabel}</text>
                </g>
                <circle cx={slot.x + slot.w - 24} cy={slot.y + 28} r="8" fill="rgba(255,255,255,0.06)" stroke={card.accent} strokeWidth="1.2" />
              </g>
            );
          })}
        </g>

        <g>
          <rect x="52" y="654" width="1096" height="64" rx="22" fill="rgba(3,7,18,0.72)" stroke="rgba(148,163,184,0.12)" />
          <text x="78" y="689" fill="#f8fafc" fontSize="16" fontWeight="600">{networkBody}</text>
          <text x="78" y="708" fill="#c7ccd4" fontSize="12">Camino compartido entre captura, lectura y sÃƒÂ­ntesis</text>
          {steps.map((item, index) => {
            const x = stepStart + index * stepSpacing;
            return (
              <g key={item}>
                <path d={`M ${x - 18} 675 H ${x + 88} a 12 12 0 0 1 0 24 H ${x - 18} a 12 12 0 0 1 0 -24 Z`} fill={index === 0 ? 'rgba(148,163,184,0.12)' : index === 1 ? 'rgba(165,180,252,0.12)' : 'rgba(134,239,172,0.12)'} stroke="rgba(148,163,184,0.12)" />
                <circle cx={x - 2} cy="687" r="3.6" fill={index === 0 ? 'var(--text-muted)' : index === 1 ? 'var(--accent)' : 'var(--text-dim)'} />
                <text x={x + 43} y="691" textAnchor="middle" fill={index === 0 ? '#e2e8f0' : '#f8fafc'} fontSize="11" fontWeight="700">{item}</text>
              </g>
            );
          })}
        </g>

        <g>
          {steps.map((step, index) => {
            const x = stepStart + index * stepSpacing;
            return (
              <g key={step}>
                <circle cx={x} cy="724" r="9" fill={index === 0 ? 'var(--text-muted)' : index === 1 ? 'var(--accent)' : 'var(--text-dim)'} />
                <text x={x + 18} y="729" fill="#94a3b8" fontSize="13">{step}</text>
              </g>
            );
          })}
        </g>
      </svg>

      <div aria-label="Designs diagram controls" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {cardControls.map(({ card, controlId, slot }) => {
          const isPressed = selectedCardId === controlId;
          const isFocused = focusedCardId === controlId;
          return (
            <button
              key={controlId}
              type="button"
              aria-label={`Select ${card.title}`}
              aria-pressed={isPressed}
              onClick={() => setSelectedCardId(controlId)}
              onKeyDown={event => {
                if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar' && event.key !== 'Space') return;
                event.preventDefault();
                setSelectedCardId(controlId);
              }}
              onFocus={() => setFocusedCardId(controlId)}
              onBlur={() => setFocusedCardId(current => (current === controlId ? '' : current))}
              style={{
                position: 'absolute',
                left: `${(slot.x / 1200) * 100}%`,
                top: `${(slot.y / 760) * 100}%`,
                width: `${(slot.w / 1200) * 100}%`,
                height: `${(slot.h / 760) * 100}%`,
                pointerEvents: 'auto',
                borderRadius: 'var(--radius-xl)',
                border: isPressed ? '1px solid rgba(226,232,240,0.58)' : '1px solid var(--border-bright)',
                background: isPressed ? 'var(--blue-dim)' : 'rgba(8,12,20,0.08)',
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'flex-end',
                justifyContent: 'flex-start',
                padding: '14px 16px',
                boxShadow: isFocused ? '0 0 0 2px rgba(165,180,252,0.8), 0 10px 28px rgba(0,0,0,0.24)' : isPressed ? '0 14px 30px rgba(99,102,241,0.14)' : 'none',
                outline: 'none',
                cursor: 'pointer',
                opacity: isPressed ? 1 : 0.9,
              }}
            >
              <span style={{ display: 'grid', gap: 2, textAlign: 'left' }}>
                <span style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--text-dim)', fontWeight: 700 }}>{card.eyebrow}</span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{card.title}</span>
                <span style={{ fontSize: 11, color: isPressed ? '#e2e8f0' : 'var(--text-dim)' }}>{isPressed ? 'Selected' : 'Activate'}</span>
              </span>
            </button>
          );
        })}
      </div>
      </div>
    </div>
  );
}
