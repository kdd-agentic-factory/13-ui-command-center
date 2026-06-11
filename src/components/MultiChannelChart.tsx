/**
 * MultiChannelChart — AiM RaceStudio3-inspired stacked multi-channel telemetry chart.
 *
 * Each channel renders in its own horizontal panel with:
 *  - Color-coded SVG trace
 *  - Y-axis labels (min / mid / max)
 *  - Shared X-axis (sample index or distance)
 *  - Interactive crosshair cursor: hover to read values at any point
 *  - Statistics row below (min / max / avg per channel)
 *
 * Usage:
 *   <MultiChannelChart channels={channels} />
 */
import { useRef, useState, useCallback, useEffect } from 'react';

// ── Types ──────────────────────────────────────────────────────────────────────

export interface Channel {
  id: string;
  name: string;
  unit: string;
  color: string;
  /** Raw data array — same length across all channels */
  data: number[];
  /** [minY, maxY] for the Y-axis scale */
  range: [number, number];
  /** Height in pixels for this channel's panel */
  panelHeight: number;
}

export type XAxisMode = 'samples' | 'time' | 'distance' | 'trackPos';
export type ScaleMode = 'auto' | 'manual';

interface Props {
  channels: Channel[];
  /** Optional X-axis labels. Defaults to sample index. */
  xLabels?: string[];
  /** X-axis display mode */
  xAxisMode?: XAxisMode;
  /** Y-axis scaling mode */
  scaleMode?: ScaleMode;
  /** Track length in meters (for distance mode) */
  trackLength?: number;
  /** Callback when cursor position changes */
  onCursorChange?: (cursor: { index: number; values: Record<string, number> } | null) => void;
  /** Pixel width; used for viewBox (component itself is 100% wide). */
  svgWidth?: number;
}

// ── Layout constants ──────────────────────────────────────────────────────────

const PAD = { left: 52, right: 16, top: 2, xAxis: 22 };

// ── Component ─────────────────────────────────────────────────────────────────

export function MultiChannelChart({
  channels, xLabels, xAxisMode = 'samples', scaleMode = 'manual',
  trackLength = 5245, onCursorChange, svgWidth = 880,
}: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [cursorIdx, setCursorIdx] = useState<number | null>(null);

  const activeChannels = channels.filter(c => c.data.length > 1);
  const dataLen = activeChannels[0]?.data.length ?? 1;
  const chartW = svgWidth - PAD.left - PAD.right;

  // Total SVG height
  const totalH = PAD.top + activeChannels.reduce((s, c) => s + c.panelHeight + 1, 0) + PAD.xAxis;

  // Map sample index → X coordinate
  const xOf = (i: number) => PAD.left + (i / (dataLen - 1)) * chartW;

  // ── Mouse interaction ────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: React.MouseEvent<SVGSVGElement>) => {
    const rect = svgRef.current!.getBoundingClientRect();
    const scale = svgWidth / rect.width;
    const rawX = (e.clientX - rect.left) * scale - PAD.left;
    const pct = Math.max(0, Math.min(1, rawX / chartW));
    setCursorIdx(Math.round(pct * (dataLen - 1)));
  }, [svgWidth, chartW, dataLen]);

  const handleMouseLeave = useCallback(() => setCursorIdx(null), []);

  // ── Report cursor to parent ──────────────────────────────────────────────
  useEffect(() => {
    if (!onCursorChange) return;
    if (cursorIdx === null) { onCursorChange(null); return; }
    const values: Record<string, number> = {};
    for (const ch of channels) {
      if (cursorIdx < ch.data.length) {
        values[ch.id] = ch.data[cursorIdx];
      }
    }
    onCursorChange({ index: cursorIdx, values });
  }, [cursorIdx, channels, onCursorChange]);

  if (activeChannels.length === 0) return null;

  // ── Build panels ──────────────────────────────────────────────────────────
  let yOffset = PAD.top;
  const panels = activeChannels.map(ch => {
    const panelTop = yOffset;
    yOffset += ch.panelHeight + 1; // +1 for separator
    const [minV, maxV] = scaleMode === 'auto'
      ? (() => {
          const dMin = Math.min(...ch.data);
          const dMax = Math.max(...ch.data);
          const pad = (dMax - dMin) * 0.08 || 1;
          return [dMin - pad, dMax + pad];
        })()
      : ch.range;
    const span = maxV - minV || 1;
    const innerH = ch.panelHeight - 6; // leave 3px top/bottom padding

    const yOf = (v: number) => panelTop + 3 + innerH - ((v - minV) / span) * innerH;

    // Polyline points
    const pts = ch.data.map((v, i) => `${xOf(i)},${yOf(v)}`).join(' ');

    // Area fill path
    const first = `${xOf(0)},${panelTop + ch.panelHeight - 3}`;
    const last  = `${xOf(ch.data.length - 1)},${panelTop + ch.panelHeight - 3}`;
    const areaPath = `${first} ${pts} ${last}`;

    // Cursor data
    const cVal = cursorIdx !== null ? ch.data[cursorIdx] : null;
    const cX   = cursorIdx !== null ? xOf(cursorIdx) : null;
    const cY   = cVal !== null ? yOf(cVal) : null;

    // Y-axis tick values
    const yTicks = [minV, (minV + maxV) / 2, maxV];

    return { ch, panelTop, pts, areaPath, cVal, cX, cY, yTicks, yOf };
  });

  // Cursor X
  const cX = cursorIdx !== null ? xOf(cursorIdx) : null;

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* ── Main SVG ─────────────────────────────────────────────────── */}
      <svg
        ref={svgRef}
        width="100%"
        height={totalH}
        viewBox={`0 0 ${svgWidth} ${totalH}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ display: 'block', cursor: 'crosshair' }}
      >
        <defs>
          {activeChannels.map(ch => (
            <linearGradient key={ch.id} id={`area-${ch.id}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={ch.color} stopOpacity="0.22" />
              <stop offset="100%" stopColor={ch.color} stopOpacity="0.02" />
            </linearGradient>
          ))}
        </defs>

        {panels.map(({ ch, panelTop, pts, areaPath, cVal, cX: _cX, cY, yTicks, yOf }) => (
          <g key={ch.id}>
            {/* Panel background */}
            <rect
              x={PAD.left}
              y={panelTop}
              width={chartW}
              height={ch.panelHeight}
              fill="rgba(255,255,255,0.015)"
              rx={0}
            />

            {/* Horizontal grid lines at 25/50/75% of range */}
            {[0.25, 0.5, 0.75].map(pct => {
              const gy = panelTop + 3 + (1 - pct) * (ch.panelHeight - 6);
              return (
                <line key={pct}
                  x1={PAD.left} y1={gy} x2={PAD.left + chartW} y2={gy}
                  stroke="rgba(255,255,255,0.04)" strokeWidth="1"
                />
              );
            })}

            {/* Area fill */}
            <polygon points={areaPath} fill={`url(#area-${ch.id})`} />

            {/* Trace */}
            <polyline
              points={pts}
              fill="none"
              stroke={ch.color}
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
              style={{ vectorEffect: 'non-scaling-stroke' }}
            />

            {/* Y-axis labels */}
            {yTicks.map((v, ti) => (
              <text key={ti}
                x={PAD.left - 4}
                y={yOf(v) + 4}
                fill="#535A6E"
                fontSize="8"
                textAnchor="end"
                fontFamily="JetBrains Mono,monospace"
              >
                {Number.isInteger(v) ? v : v.toFixed(1)}
              </text>
            ))}

            {/* Channel label (left side, vertical) */}
            <text
              x={PAD.left - 32}
              y={panelTop + ch.panelHeight / 2}
              fill={ch.color}
              fontSize="9"
              fontWeight="700"
              textAnchor="middle"
              fontFamily="JetBrains Mono,monospace"
              letterSpacing="0.06em"
              transform={`rotate(-90, ${PAD.left - 32}, ${panelTop + ch.panelHeight / 2})`}
            >
              {ch.name}
            </text>

            {/* Panel separator */}
            <line
              x1={PAD.left} y1={panelTop + ch.panelHeight}
              x2={PAD.left + chartW} y2={panelTop + ch.panelHeight}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1"
            />

            {/* Cursor dot */}
            {cX !== null && cY !== null && (
              <circle
                cx={cX}
                cy={cY}
                r="3.5"
                fill={ch.color}
                stroke="#0B0D12"
                strokeWidth="1.5"
              />
            )}

            {/* Cursor value tag */}
            {cX !== null && cVal !== null && (
              <g>
                <rect
                  x={Math.min(cX + 6, PAD.left + chartW - 48)}
                  y={cY! - 10}
                  width={44}
                  height={14}
                  rx={3}
                  fill="rgba(11,13,18,0.9)"
                  stroke={ch.color}
                  strokeWidth="0.5"
                />
                <text
                  x={Math.min(cX + 8, PAD.left + chartW - 46)}
                  y={cY! + 1}
                  fill={ch.color}
                  fontSize="8.5"
                  fontFamily="JetBrains Mono,monospace"
                  fontWeight="700"
                >
                  {cVal.toFixed(ch.unit === 'km/h' || ch.unit === 'rpm' ? 0 : 1)}{ch.unit}
                </text>
              </g>
            )}
          </g>
        ))}

        {/* ── Shared vertical cursor line ───────────────────────────────── */}
        {cX !== null && (
          <line
            x1={cX} y1={PAD.top}
            x2={cX} y2={totalH - PAD.xAxis}
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="1"
            strokeDasharray="3,3"
          />
        )}

        {/* ── X-axis labels ────────────────────────────────────────────── */}
        {(() => {
          const axisY = totalH - PAD.xAxis + 12;
          const tickEvery = Math.max(1, Math.floor(dataLen / 10));
          return Array.from({ length: Math.ceil(dataLen / tickEvery) }, (_, i) => {
            const idx = i * tickEvery;
            const x = xOf(idx);
            let label: string;
            switch (xAxisMode) {
              case 'time':
                label = `${(idx / 10).toFixed(1)}s`;
                break;
              case 'distance':
                label = `${Math.round((idx / (dataLen - 1)) * trackLength)}m`;
                break;
              case 'trackPos':
                label = `${Math.round((idx / (dataLen - 1)) * 100)}%`;
                break;
              default:
                label = xLabels ? xLabels[idx] : `${idx}`;
            }
            return (
              <text key={idx}
                x={x} y={axisY}
                fill="#535A6E"
                fontSize="8.5"
                textAnchor="middle"
                fontFamily="JetBrains Mono,monospace"
              >
                {label}
              </text>
            );
          });
        })()}

        {/* ── Cursor X label ───────────────────────────────────────────── */}
        {cX !== null && cursorIdx !== null && (
          <g>
            <rect
              x={cX - 18}
              y={totalH - PAD.xAxis + 2}
              width={44}
              height={13}
              rx={3}
              fill="rgba(255,255,255,0.1)"
            />
            <text
              x={cX}
              y={totalH - PAD.xAxis + 11}
              fill="#E6EAF4"
              fontSize="8"
              textAnchor="middle"
              fontFamily="JetBrains Mono,monospace"
            >
              {(() => {
                switch (xAxisMode) {
                  case 'time': return `${(cursorIdx / 10).toFixed(1)}s`;
                  case 'distance': return `${Math.round((cursorIdx / (dataLen - 1)) * trackLength)}m`;
                  case 'trackPos': return `${Math.round((cursorIdx / (dataLen - 1)) * 100)}%`;
                  default: return xLabels ? xLabels[cursorIdx] : `#${cursorIdx}`;
                }
              })()}
            </text>
          </g>
        )}
      </svg>

      {/* ── Statistics strip ─────────────────────────────────────────── */}
      <div style={{
        display: 'flex',
        gap: 0,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        background: 'rgba(11,13,18,0.6)',
        overflowX: 'auto',
      }}>
        {activeChannels.map(ch => {
          const vals = ch.data;
          const min = Math.min(...vals);
          const max = Math.max(...vals);
          const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
          const curVal = cursorIdx !== null ? vals[cursorIdx] : null;
          return (
            <div key={ch.id} style={{
              flex: 1,
              minWidth: 120,
              padding: '8px 12px',
              borderRight: '1px solid rgba(255,255,255,0.05)',
            }}>
              <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase', color: ch.color, marginBottom: 6, fontFamily: 'JetBrains Mono,monospace' }}>
                {ch.name}
                {curVal !== null && (
                  <span style={{ color: '#E6EAF4', marginLeft: 6 }}>
                    ← {curVal.toFixed(ch.unit === 'km/h' || ch.unit === 'rpm' ? 0 : 1)}
                  </span>
                )}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 4, fontSize: 10, fontFamily: 'JetBrains Mono,monospace' }}>
                <div>
                  <div style={{ fontSize: 8, color: '#535A6E' }}>MIN</div>
                  <div style={{ color: '#E6EAF4', fontWeight: 600 }}>{min.toFixed(ch.unit === 'km/h' || ch.unit === 'rpm' ? 0 : 1)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 8, color: '#535A6E' }}>MAX</div>
                  <div style={{ color: ch.color, fontWeight: 700 }}>{max.toFixed(ch.unit === 'km/h' || ch.unit === 'rpm' ? 0 : 1)}</div>
                </div>
                <div>
                  <div style={{ fontSize: 8, color: '#535A6E' }}>AVG</div>
                  <div style={{ color: '#8B92A8', fontWeight: 600 }}>{avg.toFixed(ch.unit === 'km/h' || ch.unit === 'rpm' ? 0 : 1)}</div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
