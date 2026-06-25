import { useEffect, useId, useRef, useState } from 'react';
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

type NodePoint = { x: number; y: number; r: number; label: string; glow: string };

function fitCanvas(canvas: HTMLCanvasElement, width: number, height: number) {
  const dpr = Math.max(1, Math.min(window.devicePixelRatio || 1, 2));
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  let ctx: CanvasRenderingContext2D | null = null;
  try {
    ctx = canvas.getContext('2d');
  } catch {
    return null;
  }
  if (!ctx) return null;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return ctx;
}

function wavePath(width: number, baseY: number, amp: number, phase: number) {
  const points: Array<[number, number]> = [];
  const steps = 64;
  for (let i = 0; i <= steps; i += 1) {
    const x = (i / steps) * width;
    const wobble = Math.sin(i * 0.42 + phase) * 0.6 + Math.sin(i * 0.12 + phase * 0.7) * 0.4;
    const y = baseY + Math.sin(i * 0.22 + phase) * amp + wobble * (amp * 0.55);
    points.push([x, y]);
  }
  return points;
}

function drawRoundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  const radius = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + w - radius, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
  ctx.lineTo(x + w, y + h - radius);
  ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
  ctx.lineTo(x + radius, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function KddHeroVisual({ subtitle, phrase, active = false, mode = 'recede', emphasis, selectedId, reducedMotion = false }: KddHeroVisualProps) {
  const { t } = useTranslation();
  const copy = t('public.heroVisual', { returnObjects: true }) as {
    subtitle: string;
    phrase: string;
    fallback: string;
    sr: string;
  };
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const [canvasReady, setCanvasReady] = useState(true);
  const srId = useId();
  const diagramMode = emphasis ?? mode;

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;

    const initialCtx = fitCanvas(canvas, wrap.clientWidth, wrap.clientHeight);
    if (!initialCtx) {
      setCanvasReady(false);
      return;
    }

    let frame = 0;
    let raf = 0;
    const ResizeObserverImpl = window.ResizeObserver;

    if (!ResizeObserverImpl) {
      setCanvasReady(false);
      return;
    }

    const telemetryNodes: NodePoint[] = [
      { x: 0.12, y: 0.82, r: 8, label: 'RPM', glow: 'rgba(34,211,238,0.65)' },
      { x: 0.25, y: 0.73, r: 7, label: 'GPS', glow: 'rgba(96,165,250,0.65)' },
      { x: 0.39, y: 0.84, r: 7, label: 'BRK', glow: 'rgba(251,191,36,0.55)' },
      { x: 0.58, y: 0.76, r: 7, label: 'THR', glow: 'rgba(52,211,153,0.55)' },
      { x: 0.74, y: 0.82, r: 8, label: 'LEAN', glow: 'rgba(168,85,247,0.55)' },
      { x: 0.88, y: 0.74, r: 7, label: 'TYRE', glow: 'rgba(244,114,182,0.55)' },
    ];

    const federatedNodes: NodePoint[] = [
      { x: 0.18, y: 0.2, r: 12, label: 'NODE A', glow: 'rgba(96,165,250,0.6)' },
      { x: 0.34, y: 0.13, r: 10, label: 'NODE B', glow: 'rgba(52,211,153,0.55)' },
      { x: 0.52, y: 0.09, r: 11, label: 'NODE C', glow: 'rgba(251,191,36,0.5)' },
      { x: 0.69, y: 0.14, r: 10, label: 'NODE D', glow: 'rgba(244,114,182,0.55)' },
      { x: 0.84, y: 0.22, r: 12, label: 'NODE E', glow: 'rgba(168,85,247,0.55)' },
    ];

    const draw = () => {
      try {
        const width = wrap.clientWidth;
        const height = wrap.clientHeight;
        const ctx = fitCanvas(canvas, width, height);
        if (!ctx) return;

        const t = reducedMotion ? 0 : frame * 0.016;
        const cx = width * 0.5;
        const telemetryY = height * 0.74;
        const networkY = height * 0.28;

      // background
      const bg = ctx.createLinearGradient(0, 0, 0, height);
      bg.addColorStop(0, '#0b1018');
      bg.addColorStop(0.58, '#0a111a');
      bg.addColorStop(1, '#070b14');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, width, height);

      // ambient glows
      const topGlow = ctx.createRadialGradient(cx, height * 0.18, 10, cx, height * 0.18, width * 0.42);
      topGlow.addColorStop(0, 'rgba(148,163,184,0.18)');
      topGlow.addColorStop(1, 'rgba(148,163,184,0)');
      ctx.fillStyle = topGlow;
      ctx.fillRect(0, 0, width, height);

      const lowerGlow = ctx.createRadialGradient(cx, telemetryY, 10, cx, telemetryY, width * 0.45);
      lowerGlow.addColorStop(0, 'rgba(99,102,241,0.12)');
      lowerGlow.addColorStop(1, 'rgba(99,102,241,0)');
      ctx.fillStyle = lowerGlow;
      ctx.fillRect(0, 0, width, height);

      // grid
      ctx.strokeStyle = 'rgba(148,163,184,0.08)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 8; i += 1) {
        const x = (width / 8) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let i = 1; i < 6; i += 1) {
        const y = (height / 6) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // telemetry panel
      ctx.fillStyle = 'rgba(2,6,23,0.56)';
      ctx.fillRect(0, telemetryY - 26, width, height - telemetryY + 26);
      ctx.strokeStyle = 'rgba(148,163,184,0.12)';
      ctx.strokeRect(0.5, telemetryY - 26.5, width - 1, height - telemetryY + 26);

      // telemetry traces
      const traces = [
        { color: '#94a3b8', base: telemetryY + 28, amp: 11, speed: 1.15 },
        { color: '#a5b4fc', base: telemetryY + 50, amp: 10, speed: 0.95 },
        { color: '#86efac', base: telemetryY + 72, amp: 8, speed: 1.35 },
      ];

      traces.forEach((trace, index) => {
        const pts = wavePath(width, trace.base, trace.amp, t * trace.speed + index * 1.4);
        ctx.strokeStyle = trace.color;
        ctx.lineWidth = 2;
        ctx.beginPath();
        pts.forEach(([x, y], i) => {
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        });
        ctx.stroke();

        ctx.strokeStyle = 'rgba(255,255,255,0.06)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, trace.base + trace.amp * 1.9);
        ctx.lineTo(width, trace.base + trace.amp * 1.9);
        ctx.stroke();
      });

      // federated network links and nodes
      const hubY = networkY + 36;
      const hubRadius = Math.min(width, height) * 0.09;
      const hubPulse = 1 + Math.sin(t * 2.4) * 0.08;

      federatedNodes.forEach((node, index) => {
        const x = width * node.x;
        const y = height * node.y;
        const sway = Math.sin(t * 0.9 + index) * 4;
        const dy = y + sway;
        ctx.strokeStyle = 'rgba(148,163,184,0.16)';
        ctx.lineWidth = 1.2;
        ctx.setLineDash([4, 7]);
        ctx.beginPath();
        ctx.moveTo(x, dy + node.r);
        ctx.lineTo(cx, hubY + hubRadius * 0.15);
        ctx.stroke();
        ctx.setLineDash([]);

        ctx.shadowColor = node.glow;
        ctx.shadowBlur = 20;
        ctx.fillStyle = node.glow;
        ctx.beginPath();
        ctx.arc(x, dy, node.r + 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;

        ctx.fillStyle = 'rgba(15,23,42,0.95)';
        ctx.beginPath();
        ctx.arc(x, dy, node.r, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = 'rgba(255,255,255,0.14)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(x, dy, node.r, 0, Math.PI * 2);
        ctx.stroke();

        ctx.fillStyle = 'rgba(226,232,240,0.84)';
        ctx.font = '700 10px Inter, ui-sans-serif, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, x, dy + 24);
      });

      // KDD hub: sitting above telemetry, fed by the network
      const orbY = height * 0.32;
      const orbRadius = Math.min(width, height) * 0.115;
      const orbGlow = ctx.createRadialGradient(cx, orbY, 8, cx, orbY, orbRadius * 2.2);
      orbGlow.addColorStop(0, 'rgba(255,255,255,0.22)');
      orbGlow.addColorStop(0.46, 'rgba(99,102,241,0.18)');
      orbGlow.addColorStop(1, 'rgba(99,102,241,0)');
      ctx.fillStyle = orbGlow;
      ctx.fillRect(cx - orbRadius * 2.4, orbY - orbRadius * 2.4, orbRadius * 4.8, orbRadius * 4.8);

      // vertical data-to-knowledge beam
      const beam = ctx.createLinearGradient(cx, telemetryY - 10, cx, orbY + orbRadius);
      beam.addColorStop(0, 'rgba(148,163,184,0.04)');
      beam.addColorStop(0.42, 'rgba(99,102,241,0.12)');
      beam.addColorStop(0.72, 'rgba(148,163,184,0.16)');
      beam.addColorStop(1, 'rgba(148,163,184,0.02)');
      ctx.fillStyle = beam;
      ctx.fillRect(cx - 24, telemetryY - 10, 48, orbY + orbRadius - (telemetryY - 10));

      // beam pulse
      const pulseY = telemetryY - 6 - ((t * 60) % ((telemetryY - orbY) + 48));
      const pulseGrad = ctx.createRadialGradient(cx, pulseY, 2, cx, pulseY, 22);
      pulseGrad.addColorStop(0, 'rgba(255,255,255,0.95)');
      pulseGrad.addColorStop(0.3, 'rgba(165,180,252,0.9)');
      pulseGrad.addColorStop(1, 'rgba(165,180,252,0)');
      ctx.fillStyle = pulseGrad;
      ctx.beginPath();
      ctx.arc(cx, pulseY, 18, 0, Math.PI * 2);
      ctx.fill();

      // hub core
      ctx.shadowColor = 'rgba(99,102,241,0.28)';
      ctx.shadowBlur = 28;
      ctx.fillStyle = 'rgba(10,16,31,0.96)';
      ctx.beginPath();
      ctx.arc(cx, orbY, orbRadius, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.strokeStyle = 'rgba(255,255,255,0.16)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(cx, orbY, orbRadius, 0, Math.PI * 2);
      ctx.stroke();

      ctx.strokeStyle = 'rgba(148,163,184,0.28)';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.arc(cx, orbY, orbRadius * hubPulse + 12, 0, Math.PI * 2);
      ctx.stroke();

      // internal network glyph
      for (let i = 0; i < 5; i += 1) {
        const angle = (Math.PI * 2 * i) / 5 - Math.PI / 2 + t * 0.2;
        const px = cx + Math.cos(angle) * orbRadius * 0.56;
        const py = orbY + Math.sin(angle) * orbRadius * 0.56;
        ctx.fillStyle = 'rgba(226,232,240,0.88)';
        ctx.beginPath();
        ctx.arc(px, py, 3.4, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = 'rgba(148,163,184,0.18)';
        ctx.beginPath();
        ctx.moveTo(cx, orbY);
        ctx.lineTo(px, py);
        ctx.stroke();
      }

      ctx.fillStyle = 'rgba(239,246,255,0.98)';
      ctx.font = '800 30px Inter, ui-sans-serif, system-ui, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('KDD', cx, orbY + 10);

      ctx.fillStyle = 'rgba(226,232,240,0.7)';
      ctx.font = '700 11px Inter, ui-sans-serif, system-ui, sans-serif';
      ctx.fillText('FEDERATED KNOWLEDGE NETWORK', cx, orbY - orbRadius - 18);

      // subtitle and phrase on-canvas for legibility
      ctx.textAlign = 'left';
      ctx.fillStyle = 'rgba(191,219,254,0.92)';
      ctx.font = '700 11px Inter, ui-sans-serif, system-ui, sans-serif';
      ctx.fillText(subtitle ?? copy.subtitle, 18, 26);
      ctx.fillStyle = 'rgba(241,245,249,0.95)';
      ctx.font = '700 14px Inter, ui-sans-serif, system-ui, sans-serif';
      ctx.fillText(phrase ?? copy.phrase, 18, height - 18);

      // telemetry label
      ctx.fillStyle = 'rgba(226,232,240,0.76)';
      ctx.font = '700 11px Inter, ui-sans-serif, system-ui, sans-serif';
      ctx.fillText('TELEMETRY', 18, telemetryY + 12);

      // moving signal dots between telemetry and KDD
      for (let i = 0; i < telemetryNodes.length; i += 1) {
        const node = telemetryNodes[i];
        const x = width * node.x;
        const y = height * node.y;
        const targetY = orbY + orbRadius * 0.35;
        const mix = (Math.sin(t * 0.9 + i * 0.75) + 1) * 0.5;
        const sy = y - (y - targetY) * mix;
        ctx.shadowColor = node.glow;
        ctx.shadowBlur = 18;
        ctx.fillStyle = node.glow;
        ctx.beginPath();
        ctx.arc(x, sy, 2.4 + mix * 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // telemetry node badges
      telemetryNodes.forEach((node, index) => {
        const x = width * node.x;
        const y = height * node.y;
        const float = Math.sin(t * 1.2 + index) * 3;
        ctx.fillStyle = 'rgba(15,23,42,0.92)';
        ctx.strokeStyle = 'rgba(255,255,255,0.12)';
        ctx.lineWidth = 1;
        drawRoundedRect(ctx, x - 22, y + float - 12, 44, 20, 10);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = 'rgba(226,232,240,0.92)';
        ctx.font = '700 9px Inter, ui-sans-serif, system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.label, x, y + float + 1);
      });

      // top label and orbit ring
      ctx.strokeStyle = 'rgba(148,163,184,0.12)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(cx, orbY, orbRadius * 1.4, orbRadius * 0.7, 0, 0, Math.PI * 2);
      ctx.stroke();

        frame += 1;
        if (!reducedMotion) raf = window.requestAnimationFrame(draw);
      } catch {
        setCanvasReady(false);
      }
    };

    const ro = new ResizeObserverImpl(() => {
      draw();
    });
    ro.observe(wrap);
    if (reducedMotion) {
      draw();
    } else {
      raf = window.requestAnimationFrame(draw);
    }

    return () => {
      window.cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [copy.fallback, copy.phrase, copy.sr, copy.subtitle, phrase, reducedMotion, subtitle]);

  return (
    <div
      ref={wrapRef}
      data-active={String(active)}
      data-mode={diagramMode}
      data-emphasis={diagramMode}
      data-motion-state={reducedMotion ? 'reduced' : 'live'}
      data-selected-id={selectedId ?? ''}
      data-reduced-motion={String(reducedMotion)}
      style={{ position: 'relative', minHeight: 420, borderRadius: 24, overflow: 'hidden', border: '1px solid rgba(148, 163, 184, 0.18)', background: 'linear-gradient(180deg, rgba(8, 15, 28, 0.98), rgba(3, 7, 18, 0.98))', boxShadow: '0 30px 80px rgba(0,0,0,0.35)', opacity: diagramMode === 'active' ? 1 : 0.92, transform: diagramMode === 'active' ? 'translateY(0)' : 'translateY(2px)', filter: reducedMotion ? 'saturate(0.98) brightness(1)' : diagramMode === 'active' ? 'saturate(1.06) brightness(1.03)' : 'saturate(0.92) brightness(0.98)', transition: reducedMotion ? 'none' : 'opacity 180ms ease, transform 180ms ease, filter 180ms ease' }}
    >
      <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at 50% 18%, rgba(96,165,250,0.16), transparent 32%), radial-gradient(circle at 50% 78%, rgba(34,211,238,0.12), transparent 26%)', pointerEvents: 'none' }} />
      {canvasReady ? (
        <canvas ref={canvasRef} aria-labelledby={srId} style={{ display: 'block', width: '100%', height: '100%' }} />
      ) : (
          <div style={{ position: 'absolute', inset: 0, padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', color: 'var(--color-text, #eef1f8)' }}>
          <div>
            <div style={{ color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '0.16em', fontSize: 11, fontWeight: 700 }}>{subtitle ?? copy.subtitle}</div>
            <div style={{ marginTop: 10, fontSize: 30, lineHeight: 1.05, fontWeight: 800 }}>KDD</div>
            <div style={{ marginTop: 8, maxWidth: 360, color: 'var(--color-text-muted, #98a2b3)', lineHeight: 1.5 }}>
              {copy.fallback}
            </div>
          </div>
          <div style={{ fontWeight: 700, color: '#e2e8f0' }}>{phrase ?? copy.phrase}</div>
        </div>
      )}
      <span id={srId} style={{ position: 'absolute', inset: 0, clipPath: 'inset(50%)', width: 1, height: 1, overflow: 'hidden', whiteSpace: 'nowrap' }}>
        {copy.sr}
      </span>
    </div>
  );
}
