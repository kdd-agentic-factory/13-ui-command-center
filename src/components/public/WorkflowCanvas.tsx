import { useEffect, useId, useRef, useState } from 'react';
import { animate, createScope, stagger } from 'animejs';

type WorkflowCanvasProps = {
  title: string;
  subtitle: string;
  steps: string[];
  active?: boolean;
  mode?: 'active' | 'recede';
  selectedId?: string | null;
  reducedMotion?: boolean;
  isActive?: boolean;
  emphasis?: 'active' | 'recede';
};

function wrapSvgText(text: string, maxChars: number, maxLines = 2) {
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

export function WorkflowCanvas({ title, subtitle, steps, active, mode, selectedId, reducedMotion = false, isActive = false, emphasis = 'recede' }: WorkflowCanvasProps) {
  const svgId = useId().replace(/:/g, '');
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [selectedStepId, setSelectedStepId] = useState(() => (steps[0] ? 'step-0' : ''));
  const [focusedStepId, setFocusedStepId] = useState('');
  const isDiagramActive = active ?? isActive;
  const diagramMode = mode ?? emphasis;
  const ids = {
    bg: `wc-bg-${svgId}`,
    line: `wc-line-${svgId}`,
    grid: `wc-grid-${svgId}`,
    glow: `wc-glow-${svgId}`,
  };

  const startX = 132;
  const endX = 1068;
  const lastIndex = Math.max(steps.length - 1, 1);
  const phaseLabels = ['Sense', 'Decide', 'Federate', 'Validate'];
  const laneYs = [190, 246, 302];
  const stepControls = steps.map((step, index) => ({ step, controlId: `step-${index}` }));

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    if (reducedMotion) return;

    const scope = createScope({ root }).add(() => {
      animate('.workflow-canvas__pulse', {
        scale: diagramMode === 'active' ? [1, 1.09] : [1, 1.04],
        opacity: diagramMode === 'active' ? [0.68, 1] : [0.56, 0.82],
        ease: 'inOutSine',
        duration: diagramMode === 'active' ? 900 : 1400,
        direction: 'alternate',
        loop: true,
      });

      animate('.workflow-canvas__dash', {
        strokeDashoffset: [0, -78],
        ease: 'linear',
        duration: diagramMode === 'active' ? 2600 : 4200,
        loop: true,
      });

      animate('.workflow-canvas__node', {
        translateY: diagramMode === 'active' ? [0, -9] : [0, -5],
        ease: 'inOutSine',
        duration: diagramMode === 'active' ? 1200 : 1800,
        direction: 'alternate',
        delay: stagger(120),
        loop: true,
      });

      animate('.workflow-canvas__lane', {
        translateY: diagramMode === 'active' ? [0, -4] : [0, -2],
        ease: 'inOutSine',
        duration: diagramMode === 'active' ? 2000 : 2800,
        direction: 'alternate',
        loop: true,
      });
    });

    return () => scope.revert();
  }, [diagramMode, reducedMotion]);

  return (
    <div
      ref={rootRef}
      className="workflow-canvas"
      data-active={isDiagramActive ? 'true' : 'false'}
      data-mode={diagramMode}
      data-selected-id={selectedId ?? ''}
      data-selected-item-id={selectedStepId}
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
      <svg className="workflow-canvas__svg" viewBox="0 0 1200 440" role="img" aria-labelledby="workflow-canvas-title workflow-canvas-desc" style={{ width: '100%', height: 'auto', display: 'block', borderRadius: 28, overflow: 'hidden' }}>
        <style>{`
          .workflow-canvas__float,
          .workflow-canvas__pulse,
          .workflow-canvas__dash {
            transform-box: fill-box;
            transform-origin: center;
          }

          .workflow-canvas__float {
            animation: workflowCanvasFloat 14s ease-in-out infinite;
          }

          .workflow-canvas__pulse {
            animation: workflowCanvasPulse 4.4s ease-in-out infinite;
          }

          .workflow-canvas__dash {
            animation: workflowCanvasDash 15s linear infinite;
          }

          .workflow-canvas[data-active='true'] .workflow-canvas__pulse {
            animation-duration: 2.8s;
          }

          .workflow-canvas[data-active='true'] .workflow-canvas__dash {
            animation-duration: 8.8s;
          }

          .workflow-canvas[data-reduced-motion='true'] .workflow-canvas__float,
          .workflow-canvas[data-reduced-motion='true'] .workflow-canvas__pulse,
          .workflow-canvas[data-reduced-motion='true'] .workflow-canvas__dash,
          .workflow-canvas[data-reduced-motion='true'] .workflow-canvas__lane,
          .workflow-canvas[data-reduced-motion='true'] .workflow-canvas__node {
            animation: none !important;
          }

          @keyframes workflowCanvasFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-8px); }
          }

          @keyframes workflowCanvasPulse {
            0%, 100% { transform: scale(1); opacity: 0.7; }
            50% { transform: scale(1.07); opacity: 1; }
          }

          @keyframes workflowCanvasDash {
            to { stroke-dashoffset: -40; }
          }
        `}</style>
        <title id="workflow-canvas-title">{title}</title>
        <desc id="workflow-canvas-desc">{subtitle}</desc>

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
          <pattern id={ids.grid} width="64" height="64" patternUnits="userSpaceOnUse">
            <path d="M64 0 H0 V64" fill="none" stroke="rgba(148,163,184,0.05)" strokeWidth="1" />
          </pattern>
          <radialGradient id={ids.glow} cx="50%" cy="40%" r="58%">
            <stop offset="0%" stopColor="rgba(148,163,184,0.16)" />
            <stop offset="46%" stopColor="rgba(165,180,252,0.1)" />
            <stop offset="100%" stopColor="rgba(148,163,184,0)" />
          </radialGradient>
        </defs>

        <rect width="1200" height="440" fill={`url(#${ids.bg})`} />
        <rect width="1200" height="440" fill={`url(#${ids.grid})`} opacity="0.5" />
        <rect width="1200" height="440" fill={`url(#${ids.glow})`} />

        <g opacity="0.65">
          <circle cx="116" cy="118" r="106" fill="rgba(148,163,184,0.06)" />
          <circle cx="1046" cy="120" r="118" fill="rgba(165,180,252,0.06)" />
          <circle cx="972" cy="344" r="120" fill="rgba(134,239,172,0.06)" />
        </g>

        <g>
          <text x="52" y="62" fill="#cbd5e1" fontSize="18" fontWeight="700" letterSpacing="3">GUIDED CHAPTER FLOW</text>
          <text x="52" y="98" fill="#f8fafc" fontSize="40" fontWeight="650">{title}</text>
          <text x="52" y="128" fill="#c7ccd4" fontSize="17">{subtitle}</text>
        </g>

        <g opacity="0.88">
          <rect x="52" y="148" width="112" height="18" rx="9" fill="rgba(148,163,184,0.12)" />
          <rect x="172" y="148" width="126" height="18" rx="9" fill="rgba(165,180,252,0.12)" />
          <rect x="306" y="148" width="128" height="18" rx="9" fill="rgba(134,239,172,0.12)" />
          <rect x="442" y="148" width="126" height="18" rx="9" fill="rgba(226,232,240,0.08)" />
        </g>

        <g>
          <path className="workflow-canvas__dash" d={`M ${startX} 226 L ${endX} 226`} stroke="rgba(148,163,184,0.16)" strokeWidth="2" />
          <path className="workflow-canvas__dash" d={`M ${startX} 226 C ${startX + 180} 176, ${startX + 300} 176, ${startX + 420} 226`} fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="1.4" strokeDasharray="5 8" />
          <path className="workflow-canvas__dash" d={`M ${startX + 420} 226 C ${startX + 540} 276, ${startX + 660} 276, ${startX + 780} 226`} fill="none" stroke="rgba(148,163,184,0.12)" strokeWidth="1.4" strokeDasharray="5 8" />
          {steps.map((step, index) => {
            const x = startX + (index / lastIndex) * (endX - startX);
            const wrapped = wrapSvgText(step, 14, 2);
            const laneY = laneYs[index % laneYs.length];
            const isSelected = selectedStepId === `step-${index}`;
            return (
              <g key={step} className="workflow-canvas__lane">
                <line className="workflow-canvas__dash" x1={x} y1={laneY} x2={x} y2={226} stroke="rgba(148,163,184,0.14)" strokeWidth="1.4" strokeDasharray="4 8" />
                <circle className="workflow-canvas__pulse workflow-canvas__node" cx={x} cy={226} r="16" fill={isSelected ? '#f8fafc' : index === 0 ? 'var(--text-muted)' : index === 1 ? 'var(--accent)' : index === 2 ? 'var(--text-dim)' : 'var(--text-muted)'} />
                <circle cx={x} cy={226} r="6" fill="#050914" />
                <text x={x} y={271} textAnchor="middle" fill="#f8fafc" fontSize="15" fontWeight="700">
                  {wrapped.map((line, lineIndex) => (
                    <tspan key={`${line}-${lineIndex}`} x={x} dy={lineIndex === 0 ? 0 : 18}>{line}</tspan>
                  ))}
                </text>
                <text x={x} y={300} textAnchor="middle" fill="#c7ccd4" fontSize="12">{phaseLabels[index] ?? phaseLabels[phaseLabels.length - 1]}</text>
              </g>
            );
          })}
        </g>

        <g>
          {steps.map((step, index) => {
            if (index === steps.length - 1) return null;
            const x1 = startX + (index / lastIndex) * (endX - startX);
            const x2 = startX + ((index + 1) / lastIndex) * (endX - startX);
            const mid = x1 + (x2 - x1) * 0.5;
            return <path key={`bridge-${index}`} d={`M ${x1} 226 C ${mid} 176, ${mid} 176, ${x2} 226`} fill="none" stroke={`url(#${ids.line})`} strokeWidth="2.5" strokeDasharray="7 8" />;
          })}
        </g>

        <g>
          <rect x="52" y="332" width="1096" height="56" rx="20" fill="rgba(3,7,18,0.72)" stroke="rgba(148,163,184,0.12)" />
          <text x="78" y="362" fill="#f8fafc" fontSize="16" fontWeight="600">KDD converts telemetry into decisions, then validates the next chapter.</text>
          <text x="78" y="382" fill="#c7ccd4" fontSize="12">Sense ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Decide ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Federate ÃƒÂ¢Ã¢â‚¬Â Ã¢â‚¬â„¢ Validate</text>
          <g>
            {['Sense', 'Decide', 'Federate'].map((item, index) => (
              <g key={item} transform={`translate(${778 + index * 112}, 347)`}>
                <rect width="100" height="24" rx="12" fill={index === 0 ? 'rgba(148,163,184,0.12)' : index === 1 ? 'rgba(165,180,252,0.12)' : 'rgba(134,239,172,0.12)'} stroke="rgba(148,163,184,0.12)" />
                <text x="50" y="16" textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="700">{item}</text>
              </g>
            ))}
          </g>
        </g>
      </svg>
      <div aria-label="Workflow diagram controls" style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {stepControls.map(({ step, controlId }, index) => {
          const x = startX + (index / lastIndex) * (endX - startX);
          const isPressed = selectedStepId === controlId;
          const isFocused = focusedStepId === controlId;
          return (
            <button
              key={controlId}
              type="button"
              aria-label={`Select ${step}`}
              aria-pressed={isPressed}
              onClick={() => setSelectedStepId(controlId)}
              onKeyDown={event => {
                if (event.key !== 'Enter' && event.key !== ' ' && event.key !== 'Spacebar' && event.key !== 'Space') return;
                event.preventDefault();
                setSelectedStepId(controlId);
              }}
              onFocus={() => setFocusedStepId(controlId)}
              onBlur={() => setFocusedStepId(current => (current === controlId ? '' : current))}
              style={{
                position: 'absolute',
                left: `${((x - 58) / 1200) * 100}%`,
                top: '43%',
                width: `${(116 / 1200) * 100}%`,
                height: '26%',
                pointerEvents: 'auto',
                borderRadius: 'var(--radius-xl)',
                border: isPressed ? '1px solid rgba(226,232,240,0.58)' : '1px solid rgba(148,163,184,0.18)',
                background: isPressed ? 'rgba(99,102,241,0.18)' : 'rgba(8,12,20,0.08)',
                color: 'var(--text)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '8px 10px',
                boxShadow: isFocused ? '0 0 0 2px rgba(165,180,252,0.8), 0 10px 28px rgba(0,0,0,0.24)' : isPressed ? '0 14px 30px rgba(99,102,241,0.14)' : 'none',
                outline: 'none',
                cursor: 'pointer',
                opacity: isPressed ? 1 : 0.9,
              }}
            >
              <span style={{ display: 'grid', gap: 2, textAlign: 'center' }}>
                <span style={{ fontSize: 12, letterSpacing: '0.14em', textTransform: 'uppercase', color: 'var(--public-accent, #8f1d2a)', fontWeight: 700 }}>Step {index + 1}</span>
                <span style={{ fontSize: 14, fontWeight: 700 }}>{step}</span>
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
