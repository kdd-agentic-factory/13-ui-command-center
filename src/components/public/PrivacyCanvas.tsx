import { useEffect, useId, useRef, useState } from 'react';
import { animate, createScope, stagger } from 'animejs';

type PrivacyCanvasProps = {
  title: string;
  subtitle: string;
  cards: Array<{ title: string; body: string }>;
  principles: string[];
  active?: boolean;
  mode?: 'active' | 'recede';
  selectedId?: string | null;
  reducedMotion?: boolean;
  isActive?: boolean;
  emphasis?: 'active' | 'recede';
};

function wrapSvgText(text: string, maxChars: number, maxLines = 4) {
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

export function PrivacyCanvas({ title, subtitle, cards, principles, active, mode, selectedId, reducedMotion = false, isActive = false, emphasis = 'recede' }: PrivacyCanvasProps) {
  const svgId = useId().replace(/:/g, '');
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [selectedCardId, setSelectedCardId] = useState(() => (cards[0] ? 'card-0' : ''));
  const [focusedCardId, setFocusedCardId] = useState('');
  const isDiagramActive = active ?? isActive;
  const diagramMode = mode ?? emphasis;
  const ids = {
    bg: `pc-bg-${svgId}`,
    line: `pc-line-${svgId}`,
    glow: `pc-glow-${svgId}`,
    grid: `pc-grid-${svgId}`,
    shield: `pc-shield-${svgId}`,
  };

  const slots = [
    { x: 64, y: 182, w: 286, h: 156, stroke: 'rgba(148,163,184,0.2)', accent: '#5f6875', label: 'LOCAL' },
    { x: 850, y: 182, w: 286, h: 156, stroke: 'rgba(143,29,42,0.22)', accent: '#8f1d2a', label: 'TEAM' },
    { x: 376, y: 480, w: 448, h: 142, stroke: 'rgba(199,204,212,0.2)', accent: '#c7ccd4', label: 'FEDERATED' },
  ];

  const nodes = [
    { x: 600, y: 258, r: 96, fill: 'rgba(15,23,42,0.95)' },
    { x: 600, y: 258, r: 138, fill: 'rgba(15,23,42,0)' },
    { x: 600, y: 258, r: 188, fill: 'rgba(15,23,42,0)' },
  ];

  const cardControls = cards.map((card, index) => ({ card, controlId: `card-${index}`, slot: slots[index] }));

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (reducedMotion) return;

    const scope = createScope({ root }).add(() => {
      animate('.privacy-canvas__float', {
        translateY: diagramMode === 'active' ? [0, -10] : [0, -6],
        ease: 'inOutSine',
        duration: diagramMode === 'active' ? 1400 : 2200,
        direction: 'alternate',
        delay: stagger(140),
        loop: true,
      });

      animate('.privacy-canvas__pulse', {
        scale: diagramMode === 'active' ? [1, 1.08] : [1, 1.04],
        opacity: diagramMode === 'active' ? [0.72, 1] : [0.58, 0.84],
        ease: 'inOutSine',
        duration: diagramMode === 'active' ? 1000 : 1500,
        direction: 'alternate',
        loop: true,
      });

      animate('.privacy-canvas__dash', {
        strokeDashoffset: [0, -84],
        ease: 'linear',
        duration: diagramMode === 'active' ? 3000 : 4200,
        loop: true,
      });

      animate('.privacy-canvas__shield', {
        rotate: diagramMode === 'active' ? [0, 6] : [0, 4],
        translateY: diagramMode === 'active' ? [0, -5] : [0, -3],
        ease: 'inOutSine',
        duration: diagramMode === 'active' ? 2200 : 3000,
        direction: 'alternate',
        loop: true,
      });
    });

    return () => scope.revert();
  }, [diagramMode, reducedMotion]);

  return (
    <div
      ref={rootRef}
      className="privacy-canvas"
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
      <svg className="privacy-canvas__svg" viewBox="0 0 1200 640" role="img" aria-labelledby="privacy-canvas-title privacy-canvas-desc" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 28, overflow: 'hidden' }}>
        <style>{`
          .privacy-canvas__float,
          .privacy-canvas__pulse,
          .privacy-canvas__dash {
            transform-box: fill-box;
            transform-origin: center;
          }

          .privacy-canvas__float {
            animation: privacyCanvasFloat 18s ease-in-out infinite;
          }

          .privacy-canvas__pulse {
            animation: privacyCanvasPulse 5.2s ease-in-out infinite;
          }

          .privacy-canvas__dash {
            animation: privacyCanvasDash 16s linear infinite;
          }

          .privacy-canvas[data-active='true'] .privacy-canvas__pulse {
            animation-duration: 3s;
          }

          .privacy-canvas[data-active='true'] .privacy-canvas__dash {
            animation-duration: 9.5s;
          }

          .privacy-canvas[data-reduced-motion='true'] .privacy-canvas__float,
          .privacy-canvas[data-reduced-motion='true'] .privacy-canvas__pulse,
          .privacy-canvas[data-reduced-motion='true'] .privacy-canvas__dash,
          .privacy-canvas[data-reduced-motion='true'] .privacy-canvas__shield {
            animation: none !important;
          }

          @keyframes privacyCanvasFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-9px); }
          }

          @keyframes privacyCanvasPulse {
            0%, 100% { transform: scale(1); opacity: 0.74; }
            50% { transform: scale(1.05); opacity: 1; }
          }

          @keyframes privacyCanvasDash {
            to { stroke-dashoffset: -44; }
          }
        `}</style>
        <title id="privacy-canvas-title">{title}</title>
        <desc id="privacy-canvas-desc">{subtitle}</desc>

        <defs>
          <linearGradient id={ids.bg} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0e121a" />
            <stop offset="100%" stopColor="#070b14" />
          </linearGradient>
          <linearGradient id={ids.line} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#5f6875" />
            <stop offset="50%" stopColor="#8f1d2a" />
            <stop offset="100%" stopColor="#c7ccd4" />
          </linearGradient>
          <radialGradient id={ids.glow} cx="50%" cy="50%" r="60%">
            <stop offset="0%" stopColor="rgba(148,163,184,0.18)" />
            <stop offset="46%" stopColor="rgba(165,180,252,0.1)" />
            <stop offset="100%" stopColor="rgba(148,163,184,0)" />
          </radialGradient>
          <pattern id={ids.grid} width="56" height="56" patternUnits="userSpaceOnUse">
            <path d="M56 0 H0 V56" fill="none" stroke="rgba(148,163,184,0.05)" strokeWidth="1" />
          </pattern>
          <linearGradient id={ids.shield} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="rgba(148,163,184,0.2)" />
            <stop offset="100%" stopColor="rgba(134,239,172,0.08)" />
          </linearGradient>
        </defs>

        <rect width="1200" height="640" fill={`url(#${ids.bg})`} />
        <rect width="1200" height="640" fill={`url(#${ids.grid})`} opacity="0.56" />
        <rect width="1200" height="640" fill={`url(#${ids.glow})`} />

        <g opacity="0.7">
          <circle cx="108" cy="124" r="112" fill="rgba(148,163,184,0.06)" />
          <circle cx="1084" cy="140" r="116" fill="rgba(165,180,252,0.06)" />
          <circle cx="978" cy="520" r="144" fill="rgba(134,239,172,0.06)" />
        </g>

        <g>
          <text x="52" y="62" fill="#cbd5e1" fontSize="18" fontWeight="700" letterSpacing="3">FEDERATED KNOWLEDGE NETWORK</text>
          <text x="52" y="98" fill="#f8fafc" fontSize="40" fontWeight="650">{title}</text>
          <text x="52" y="128" fill="#c7ccd4" fontSize="17">{subtitle}</text>
        </g>

        <g opacity="0.9">
          <rect x="52" y="150" width="156" height="18" rx="9" fill="rgba(148,163,184,0.12)" />
          <rect x="214" y="150" width="110" height="18" rx="9" fill="rgba(165,180,252,0.12)" />
          <rect x="330" y="150" width="146" height="18" rx="9" fill="rgba(134,239,172,0.12)" />
          <rect x="482" y="150" width="128" height="18" rx="9" fill="rgba(226,232,240,0.08)" />
        </g>

        <g>
          {nodes.map((node, index) => (
            <g key={`${node.x}-${node.r}`} className={`privacy-canvas__float ${index === 2 ? 'privacy-canvas__float' : ''}`}>
              <circle cx={node.x} cy={node.y} r={node.r} fill={node.fill} stroke="rgba(255,255,255,0.04)" strokeWidth="1.2" />
            </g>
          ))}
          <circle className="privacy-canvas__pulse" cx="600" cy="258" r="86" fill="rgba(6,12,24,0.96)" stroke="rgba(148,163,184,0.32)" strokeWidth="2.2" />
          <circle cx="600" cy="258" r="128" fill="none" stroke="rgba(148,163,184,0.16)" strokeWidth="1.5" />
          <circle className="privacy-canvas__dash" cx="600" cy="258" r="176" fill="none" stroke="rgba(165,180,252,0.12)" strokeWidth="1.5" strokeDasharray="12 10" />
          <circle cx="600" cy="258" r="212" fill="none" stroke="rgba(134,239,172,0.1)" strokeWidth="1.25" />
          <path className="privacy-canvas__shield" d="M580 240 a20 20 0 0 1 40 0 v12 h-40z" fill="rgba(148,163,184,0.16)" stroke="rgba(148,163,184,0.34)" strokeWidth="1.5" />
          <rect x="566" y="252" width="68" height="44" rx="18" fill={`url(#${ids.shield})`} stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" />
          <rect x="592" y="268" width="16" height="20" rx="8" fill="rgba(15,23,42,0.96)" />
          <text x="600" y="220" textAnchor="middle" fill="#f8fafc" fontSize="28" fontWeight="700">KDD</text>
          <text x="600" y="290" textAnchor="middle" fill="#cbd5e1" fontSize="14" letterSpacing="2">PRIVACY BY DESIGN</text>
          {[
            { x: 600, y: 126, label: 'Private', fill: 'rgba(148,163,184,0.14)', stroke: 'rgba(148,163,184,0.3)' },
            { x: 448, y: 362, label: 'Team', fill: 'rgba(165,180,252,0.14)', stroke: 'rgba(165,180,252,0.3)' },
            { x: 752, y: 362, label: 'Federated', fill: 'rgba(134,239,172,0.14)', stroke: 'rgba(134,239,172,0.3)' },
          ].map(item => (
            <g key={item.label}>
              <path className="privacy-canvas__dash" d={`M 600 258 C ${item.x} ${item.y - 42}, ${item.x} ${item.y - 42}, ${item.x} ${item.y}`} fill="none" stroke={item.stroke} strokeWidth="1.5" strokeDasharray="5 8" />
              <rect x={item.x - 54} y={item.y - 14} width={108} height={28} rx={14} fill={item.fill} stroke={item.stroke} />
              <text x={item.x} y={item.y + 5} textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="700">{item.label}</text>
            </g>
          ))}
        </g>

        <g opacity="0.95">
          <path className="privacy-canvas__dash" d="M 334 258 C 406 258, 462 258, 516 258" fill="none" stroke={`url(#${ids.line})`} strokeWidth="2.5" strokeDasharray="6 8" />
          <path className="privacy-canvas__dash" d="M 866 258 C 794 258, 738 258, 684 258" fill="none" stroke={`url(#${ids.line})`} strokeWidth="2.5" strokeDasharray="6 8" />
          <path className="privacy-canvas__dash" d="M 600 344 C 600 390, 600 424, 600 478" fill="none" stroke={`url(#${ids.line})`} strokeWidth="2.5" strokeDasharray="6 8" />
        </g>

        <g>
          {slots.map((slot, index) => {
            const card = cards[index];
            if (!card) return null;

            const titleLines = wrapSvgText(card.title, index === 2 ? 22 : 18, 2);
            const bodyLines = wrapSvgText(card.body, index === 2 ? 48 : 36, index === 2 ? 4 : 3);
            const isSelected = selectedCardId === `card-${index}`;
            return (
              <g key={card.title}>
                <rect x={slot.x} y={slot.y} width={slot.w} height={slot.h} rx="26" fill="rgba(15,23,42,0.94)" stroke={isSelected ? '#e2e8f0' : slot.stroke} strokeWidth={isSelected ? '2' : '1'} />
                <rect x={slot.x} y={slot.y} width={slot.w} height="7" rx="3.5" fill={slot.accent} opacity="0.78" />
                <circle cx={slot.x + 18} cy={slot.y + 22} r="5" fill={slot.accent} />
                <text x={slot.x + 34} y={slot.y + 25} fill={slot.accent} letterSpacing="3" fontSize="12" fontWeight="700" style={{ textTransform: 'uppercase' }}>{slot.label}</text>
                <text x={slot.x + 20} y={slot.y + 60} fill="#f8fafc" fontSize="20" fontWeight="650">
                  {titleLines.map((line, lineIndex) => (
                    <tspan key={`${line}-${lineIndex}`} x={slot.x + 20} dy={lineIndex === 0 ? 0 : 24}>{line}</tspan>
                  ))}
                </text>
                <text x={slot.x + 20} y={slot.y + 96} fill="#c7ccd4" fontSize="14">
                  {bodyLines.map((line, lineIndex) => (
                    <tspan key={`${line}-${lineIndex}`} x={slot.x + 20} dy={lineIndex === 0 ? 0 : 20}>{line}</tspan>
                  ))}
                </text>
                <g transform={`translate(${slot.x + slot.w - 122}, ${slot.y + slot.h - 34})`}>
                  <rect width="102" height="18" rx="9" fill="rgba(255,255,255,0.04)" stroke="rgba(148,163,184,0.12)" />
                  <text x="51" y="13" textAnchor="middle" fill="#e2e8f0" fontSize="10" fontWeight="700" letterSpacing="1.3">{index === 0 ? 'LOCAL SCOPE' : index === 1 ? 'TEAM SHARE' : 'FEDERATED RULES'}</text>
                </g>
              </g>
            );
          })}
        </g>

        <g>
          <rect x="52" y="562" width="1096" height="40" rx="20" fill="rgba(3,7,18,0.72)" stroke="rgba(148,163,184,0.12)" />
          {principles.map((item, index) => {
            const x = 84 + index * 262;
            const lines = wrapSvgText(item, 28, 2);
            return (
              <g key={item}>
                <circle cx={x} cy={582} r="6" fill={index === 0 ? '#5f6875' : index === 1 ? '#8f1d2a' : '#c7ccd4'} />
                <text x={x + 14} y={578} fill="#c7ccd4" fontSize="11">
                  {lines.map((line, lineIndex) => (
                    <tspan key={`${line}-${lineIndex}`} x={x + 14} dy={lineIndex === 0 ? 0 : 14}>{line}</tspan>
                  ))}
                </text>
              </g>
            );
          })}
          <text x="1110" y="586" textAnchor="end" fill="#e2e8f0" fontSize="11" fontWeight="700">Local-first rules, explicit sharing</text>
        </g>
      </svg>
      <div aria-label="Privacy diagram controls" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
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
                top: `${(slot.y / 640) * 100}%`,
                width: `${(slot.w / 1200) * 100}%`,
                height: `${(slot.h / 640) * 100}%`,
                pointerEvents: 'auto',
                borderRadius: 26,
                border: isPressed ? '1px solid rgba(226,232,240,0.58)' : '1px solid rgba(148,163,184,0.18)',
                background: isPressed ? 'rgba(99,102,241,0.18)' : 'rgba(8,12,20,0.08)',
                color: '#eef1f8',
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
                <span style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--public-accent, #8f1d2a)', fontWeight: 700 }}>{slot.label}</span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{card.title}</span>
                <span style={{ fontSize: 11, color: isPressed ? '#e2e8f0' : '#c7ccd4' }}>{isPressed ? 'Selected' : 'Activate'}</span>
              </span>
            </button>
          );
        })}
      </div>
      </div>
    </div>
  );
}
