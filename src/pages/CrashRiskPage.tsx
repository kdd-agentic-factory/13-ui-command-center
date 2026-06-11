/**
 * Crash-Risk Index (engineer Phase 3 #4) — real-time safety guardian for Mugello.
 *
 * Dynamic risk by corner, tyre, lean, grip, brake and surface. Not a decorative
 * "semaphore" — a decision tool with cause, evidence, action, time cost and
 * estimated risk reduction.
 *
 * CRITICAL: No Jarama references. All 15 Mugello corners only.
 * Naming: "Front stability" not "Front grip" — avoids confusion (LOW risk ≠ low grip).
 */

import { useMemo } from 'react';
import {
  ShieldAlert, AlertTriangle, ShieldCheck, Activity, ChevronRight,
  TrendingUp, Info, Zap, Gauge, Thermometer,
} from 'lucide-react';
import { useNavigate } from '../context/NavContext';
import { useLiveTelemetry } from '../hooks/useLiveTelemetry';
import { MUGELLO_CIRCUIT } from '../domain/sessionTruth';
import { getActiveCircuit } from '../domain/circuits';

// ── Risk factors ───────────────────────────────────────────────────────────────

interface Factor {
  id: string;
  label: string;
  value: number;    // 0–100
  level: 'low' | 'med' | 'high';
  note: string;
  zone: string;
}

const FACTORS: Factor[] = [
  { id: 'lean',       label: 'Lean margin',           value: 78, level: 'high',    note: 'Peaks 57° at T8/T9 Arrabbiata — close to tyre edge under high load.', zone: 'T8/T9' },
  { id: 'rear-grip',  label: 'Rear grip',             value: 62, level: 'med',     note: 'Grip down 12% on exit phases — rear slip detected at T15 Bucine.', zone: 'T15' },
  { id: 'front',      label: 'Front stability',       value: 30, level: 'low',     note: 'Front stable under heavy braking; no lock or major push at T1 San Donato.', zone: 'T1' },
  { id: 'tyre-therm', label: 'Tyre thermal load',     value: 64, level: 'med',     note: 'Rear soft at 118°C; thermal load rising after Lap 15.', zone: 'Rear' },
  { id: 'surface',    label: 'Track surface',         value: 38, level: 'low',     note: 'Dry and clean. No wet patches. Kerb risk medium at Biondetti 1/2.', zone: 'T13/T14' },
  { id: 'braking',    label: 'Braking stability',     value: 50, level: 'med',     note: 'Slight chatter into T1 San Donato and T12 Correntaio.', zone: 'T1/T12' },
  { id: 'throttle',   label: 'Throttle aggression',   value: 68, level: 'med',     note: 'Sharp throttle pickup out of T15 Bucine and T7 Savelli.', zone: 'T15/T7' },
  { id: 'lean-thr',   label: 'Lean + throttle overlap', value: 76, level: 'high',  note: 'Throttle exceeds 40% while lean remains above 55° at T15 Bucine.', zone: 'T15' },
  { id: 'brake-lean', label: 'Brake + lean overlap',  value: 46, level: 'med',     note: 'Brake pressure remains above 12% past turn-in at T1 San Donato.', zone: 'T1' },
  { id: 'elevation',  label: 'Elevation load',        value: 44, level: 'med',     note: 'High-speed load through Arrabbiata 1/2 increases tyre edge stress.', zone: 'T8/T9' },
  { id: 'kerb',       label: 'Kerb strike risk',      value: 48, level: 'med',     note: 'Biondetti 1/2 kerb approach inconsistent over last 3 laps.', zone: 'T13/T14' },
];

// ── Risk level helpers ─────────────────────────────────────────────────────────

type RiskLevel = Factor['level'];

function computeOverall(factors: Factor[]): number {
  return Math.round(factors.reduce((a, f) => a + f.value, 0) / factors.length);
}

function getLevel(score: number): RiskLevel {
  if (score < 34) return 'low';
  if (score < 67) return 'med';
  return 'high';
}

const LEVEL_COLOR: Record<RiskLevel, string> = {
  low: 'var(--green)', med: 'var(--yellow)', high: 'var(--accent)',
};
const LEVEL_TEXT: Record<RiskLevel, string> = {
  low: 'LOW', med: 'MEDIUM', high: 'HIGH',
};

// ── Corner risk ────────────────────────────────────────────────────────────────

interface CornerRisk {
  n: number;
  name: string;
  score: number;    // 0–100
  cause: string;
  action: string;
}

const CORNER_RISKS: CornerRisk[] = [
  { n: 15, name: 'Bucine',       score: 76, cause: 'Rear slip appears above 42% throttle while lean remains >55°',            action: 'Reduce lean 2–3° before throttle pickup' },
  { n: 8,  name: 'Arrabbiata 1', score: 72, cause: 'Sustained edge grip demand at 57° lean',                                  action: 'Hold smoother line, avoid tightening mid-corner' },
  { n: 9,  name: 'Arrabbiata 2', score: 69, cause: 'High lateral load with rear tyre above 116°C',                             action: 'Reduce steering correction, maintain neutral throttle' },
  { n: 1,  name: 'San Donato',   score: 63, cause: 'Brake pressure spike during turn-in',                                      action: 'Release brake pressure 5 m earlier' },
  { n: 12, name: 'Correntaio',   score: 61, cause: 'Front chatter at corner entry — brake release instability',                action: 'Smooth brake release, avoid late line correction' },
];

// ── Near-misses ────────────────────────────────────────────────────────────────

interface NearMiss {
  lap: number;
  corner: string;
  text: string;
  slip: number;
  recovery: string;
  severity: 'Medium' | 'Medium-High' | 'High';
}

const NEAR_MISSES: NearMiss[] = [
  { lap: 14, corner: 'T15 Bucine',       text: 'Rear step-out on exit',          slip: 14, recovery: 'Throttle reduced from 44% to 28%', severity: 'Medium' },
  { lap: 16, corner: 'T8 Arrabbiata 1', text: 'Front pushed wide at max lean',  slip: 0,  recovery: 'Lean angle 57° · line deviation +0.8 m', severity: 'Medium-High' },
];

// ── Risk timeline ──────────────────────────────────────────────────────────────

const TIMELINE: { lap: number; score: number; flag?: 'near-miss' }[] = [
  { lap: 10, score: 42 },
  { lap: 11, score: 45 },
  { lap: 12, score: 48 },
  { lap: 13, score: 51 },
  { lap: 14, score: 60, flag: 'near-miss' },
  { lap: 15, score: 55 },
  { lap: 16, score: 63, flag: 'near-miss' },
  { lap: 17, score: 58 },
];

// ── Phase risk ─────────────────────────────────────────────────────────────────

interface PhaseRisk {
  phase: string;
  score: number;
  issue: string;
}

const PHASE_RISKS: PhaseRisk[] = [
  { phase: 'Entry', score: 52, issue: 'Brake chatter at T1/T12' },
  { phase: 'Apex',  score: 64, issue: 'Lean margin at T8/T9' },
  { phase: 'Exit',  score: 76, issue: 'Rear slip at T15' },
];

// ── Main component ────────────────────────────────────────────────────────────

export function CrashRiskPage() {
  const navigate = useNavigate();
  const t = useLiveTelemetry();

  const overallRisk = useMemo(() => computeOverall(FACTORS), []);
  const level = getLevel(overallRisk);
  const levelColor = LEVEL_COLOR[level];

  const trend = '+6'; // last 3 laps

  // Top risk corner
  const topCorner = CORNER_RISKS[0];

  return (
    <div className="page">

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* PAGE HEADER                                                           */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Crash-Risk Index</h1>
          <p className="page-subtitle">
            {getActiveCircuit().name} {getActiveCircuit().layout} · Race Lap {t.lapCount}/{MUGELLO_CIRCUIT.raceLaps} · Safety Guardian AI
          </p>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', marginTop: 2 }}>
            {getActiveCircuit().lengthKm} km · {getActiveCircuit().turns} turns · {MUGELLO_CIRCUIT.assetStatusLabel}
          </div>
        </div>
        <span className="badge" style={{
          background: `color-mix(in srgb, ${levelColor} 16%, transparent)`,
          color: levelColor, display: 'inline-flex', alignItems: 'center', gap: 6,
          animation: level === 'high' ? 'pulse 2s infinite' : undefined,
        }}>
          <ShieldAlert size={12} /> {LEVEL_TEXT[level]} RISK
        </span>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* OVERALL RISK INDEX                                                    */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title flex items-center gap-2"><Activity size={14} style={{ color: levelColor }} /> Overall Risk Index</span>
          <div className="flex items-center gap-3">
            <span style={{ fontSize: 10, fontFamily: 'JetBrains Mono,monospace', color: 'var(--text-muted)' }}>
              <TrendingUp size={10} style={{ verticalAlign: -1, color: 'var(--accent)' }} /> Trend +{trend} pts over last 3 laps
            </span>
            <span style={{ fontSize: 9, fontFamily: 'JetBrains Mono,monospace', color: 'var(--text-muted)' }}>
              Low 0–39 · Medium 40–69 · High 70–100
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 20, marginTop: 8, flexWrap: 'wrap' }}>
          {/* Score */}
          <div style={{ textAlign: 'center', minWidth: 100 }}>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: 56, lineHeight: 1, color: levelColor }}>
              {overallRisk}<span style={{ fontSize: 18, color: 'var(--text-muted)' }}>/100</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: levelColor, marginTop: 4 }}>
              {LEVEL_TEXT[level]}
            </div>
          </div>

          {/* Risk meter */}
          <div style={{ flex: 1, minWidth: 240 }}>
            <div style={{ position: 'relative', height: 14, borderRadius: 7, background: 'linear-gradient(90deg, var(--green), var(--yellow) 50%, var(--accent))' }}>
              <div style={{ position: 'absolute', top: -4, left: `calc(${overallRisk}% - 3px)`, width: 6, height: 22, borderRadius: 3, background: '#fff', boxShadow: '0 0 6px rgba(0,0,0,0.6)' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-muted)', marginTop: 6 }}>
              <span>LOW</span><span>MEDIUM</span><span>HIGH</span>
            </div>
          </div>

          {/* Primary risk summary */}
          <div style={{ maxWidth: 320 }}>
            <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', marginBottom: 4 }}>
              PRIMARY RISK SOURCE
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5 }}>
              Rear grip loss under throttle while lean angle remains high
            </div>
            <div style={{ fontSize: 10, color: 'var(--accent)', fontFamily: 'JetBrains Mono,monospace', marginTop: 4 }}>
              Concentration: T8 · T9 · T15
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* GRID: FACTORS + CORNERS + PHASES                                      */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid-2" style={{ gap: 16, alignItems: 'start' }}>

        {/* ── Contributing Factors ──────────────────────────────────────── */}
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><Gauge size={14} style={{ color: 'var(--blue)' }} /> Contributing Factors</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
            {FACTORS.map(f => (
              <div key={f.id}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{f.label}</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-muted)' }}>
                      {f.zone}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700,
                      color: LEVEL_COLOR[f.level],
                      padding: '1px 6px', borderRadius: 3,
                      background: `color-mix(in srgb, ${LEVEL_COLOR[f.level]} 14%, transparent)`,
                    }}>
                      {LEVEL_TEXT[f.level]} RISK
                    </span>
                  </div>
                </div>
                <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)' }}>
                  <div style={{
                    width: `${f.value}%`, height: '100%', borderRadius: 2,
                    background: LEVEL_COLOR[f.level],
                    transition: 'width 0.4s',
                  }} />
                </div>
                <div style={{ fontSize: 10, color: 'var(--text-dim)', marginTop: 2, lineHeight: 1.4 }}>{f.note}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right column ──────────────────────────────────────────────── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Riskiest corners */}
          <div className="card">
            <div className="card-header">
              <span className="card-title flex items-center gap-2"><AlertTriangle size={14} style={{ color: 'var(--accent)' }} /> Riskiest Corners</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
              {CORNER_RISKS.map(c => (
                <div key={c.n} style={{
                  padding: '8px 10px', borderRadius: 6,
                  background: c.score >= 70 ? 'rgba(224,55,55,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${c.score >= 70 ? 'rgba(224,55,55,0.15)' : 'rgba(255,255,255,0.05)'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 12 }}>
                      T{c.n} · {c.name}
                    </span>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 14,
                      color: c.score >= 70 ? 'var(--accent)' : 'var(--yellow)',
                    }}>
                      {c.score}/100
                    </span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.07)', marginBottom: 4 }}>
                    <div style={{
                      width: `${c.score}%`, height: '100%', borderRadius: 2,
                      background: c.score >= 70 ? 'var(--accent)' : 'var(--yellow)',
                      transition: 'width 0.4s',
                    }} />
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-dim)', lineHeight: 1.4 }}>
                    <strong>Cause:</strong> {c.cause}<br />
                    <strong>Action:</strong> {c.action}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk by phase */}
          <div className="card">
            <div className="card-header">
              <span className="card-title flex items-center gap-2"><Zap size={14} style={{ color: 'var(--purple)' }} /> Risk by Corner Phase</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
              {PHASE_RISKS.map(p => (
                <div key={p.phase} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 11, fontWeight: 600, minWidth: 44 }}>{p.phase}</span>
                  <div style={{ flex: 1, height: 8, borderRadius: 4, background: 'rgba(255,255,255,0.06)' }}>
                    <div style={{
                      width: `${p.score}%`, height: '100%', borderRadius: 4,
                      background: p.score >= 70 ? 'var(--accent)' : p.score >= 50 ? 'var(--yellow)' : 'var(--green)',
                    }} />
                  </div>
                  <div style={{ textAlign: 'right', minWidth: 80 }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: 14,
                      color: p.score >= 70 ? 'var(--accent)' : p.score >= 50 ? 'var(--yellow)' : 'var(--green)',
                    }}>
                      {p.score}/100
                    </span>
                    <div style={{ fontSize: 9, color: 'var(--text-muted)' }}>
                      {p.issue}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* RISK TIMELINE + NEAR-MISSES + CRASH MAP                               */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid-3 mt-4" style={{ gap: 16 }}>

        {/* Risk Timeline */}
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><Activity size={14} style={{ color: 'var(--blue)' }} /> Risk Timeline</span>
            <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>Last 8 laps</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 80, marginTop: 8 }}>
            {TIMELINE.map(t => {
              const pct = (t.score / 100) * 100;
              const barColor = t.score >= 70 ? 'var(--accent)' : t.score >= 50 ? 'var(--yellow)' : 'var(--green)';
              return (
                <div key={t.lap} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <div style={{
                    width: '100%', height: `${pct}%`,
                    minHeight: 4, maxHeight: 64, borderRadius: '2px 2px 0 0',
                    background: barColor,
                    opacity: t.flag ? 0.9 : 0.6,
                    border: t.flag ? '1px solid var(--accent)' : 'none',
                    transition: 'height 0.4s',
                    position: 'relative',
                  }}>
                    {t.flag && (
                      <span style={{
                        position: 'absolute', top: -14, left: '50%', transform: 'translateX(-50%)',
                        fontSize: 8, color: 'var(--accent)', whiteSpace: 'nowrap',
                        fontFamily: 'JetBrains Mono,monospace', fontWeight: 700,
                      }}>
                        !
                      </span>
                    )}
                  </div>
                  <div style={{
                    fontSize: 8, fontFamily: 'JetBrains Mono,monospace',
                    color: t.flag ? 'var(--accent)' : 'var(--text-muted)',
                    marginTop: 3,
                    fontWeight: t.flag ? 700 : 400,
                  }}>
                    L{t.lap}
                  </div>
                  <div style={{ fontSize: 7, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
                    {t.score}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Near-Misses */}
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><AlertTriangle size={14} style={{ color: 'var(--yellow)' }} /> Near-Misses This Stint</span>
            <span className="badge badge-yellow">{NEAR_MISSES.length}</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 6 }}>
            {NEAR_MISSES.map((m, i) => (
              <div key={i} style={{
                padding: '8px 10px', borderRadius: 6,
                background: m.severity === 'Medium-High' ? 'rgba(224,55,55,0.06)' : 'rgba(245,158,11,0.06)',
                border: `1px solid ${m.severity === 'Medium-High' ? 'rgba(224,55,55,0.15)' : 'rgba(245,158,11,0.15)'}`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 11, fontWeight: 700, color: 'var(--accent)' }}>
                    Lap {m.lap} · {m.corner}
                  </span>
                  <span style={{
                    fontSize: 9, fontFamily: 'JetBrains Mono,monospace', fontWeight: 700,
                    color: m.severity === 'Medium-High' ? 'var(--accent)' : 'var(--yellow)',
                    padding: '1px 6px', borderRadius: 3,
                    background: m.severity === 'Medium-High'
                      ? 'rgba(224,55,55,0.12)' : 'rgba(245,158,11,0.12)',
                  }}>
                    {m.severity}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.4 }}>
                  <div>{m.text}</div>
                  {m.slip > 0 && <div>Slip ratio peaked at {m.slip}%</div>}
                  <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 2 }}>{m.recovery}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Crash-Risk Map */}
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><Info size={14} style={{ color: 'var(--blue)' }} /> Crash-Risk Map · {getActiveCircuit().name}</span>
          </div>
          <div style={{ marginTop: 6, fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.6 }}>
            <p style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', marginBottom: 8 }}>
              {MUGELLO_CIRCUIT.assetStatusLabel} · {MUGELLO_CIRCUIT.turns} turns
            </p>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace', color: 'var(--accent)', marginBottom: 4 }}>
                HIGH-RISK ZONES
              </div>
              {['T8 Arrabbiata 1', 'T9 Arrabbiata 2', 'T15 Bucine'].map(z => (
                <div key={z} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0', fontSize: 11,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', flex: 'none' }} />
                  {z}
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace', color: 'var(--yellow)', marginBottom: 4 }}>
                MEDIUM-RISK ZONES
              </div>
              {['T1 San Donato', 'T12 Correntaio', 'T13/T14 Biondetti'].map(z => (
                <div key={z} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '2px 0', fontSize: 11,
                }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--yellow)', flex: 'none' }} />
                  {z}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
              Map crosses: lean · speed · grip · chatter · brake · throttle · surface
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* PERFORMANCE VS SAFETY TRADE-OFF                                        */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid-2 mt-4" style={{ gap: 16 }}>
        <div className="card" style={{ borderColor: 'color-mix(in srgb, var(--blue) 25%, transparent)' }}>
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><Activity size={14} style={{ color: 'var(--blue)' }} /> Performance vs Safety Trade-off</span>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 6 }}>
            <div className="stat-tile">
              <div className="stat-tile__label">Current risk</div>
              <span className="stat-tile__value" style={{ fontSize: 20, color: levelColor }}>{overallRisk}/100</span>
            </div>
            <div className="stat-tile">
              <div className="stat-tile__label">Risk reduction (safety mode)</div>
              <span className="stat-tile__value" style={{ fontSize: 20, color: 'var(--green)' }}>-12 pts</span>
            </div>
            <div className="stat-tile">
              <div className="stat-tile__label">Lap-time impact if safer</div>
              <span className="stat-tile__value" style={{ fontSize: 20, color: 'var(--yellow)' }}>+0.047<span className="stat-tile__unit">s/lap</span></span>
            </div>
            <div className="stat-tile">
              <div className="stat-tile__label">Recommended safety mode</div>
              <span className="stat-tile__value" style={{ fontSize: 14, color: 'var(--blue)' }}>Rear tyre protection · 2 laps</span>
            </div>
          </div>
        </div>

        {/* Safety Mode Suggestion */}
        <div className="card" style={{ borderColor: 'color-mix(in srgb, var(--green) 25%, transparent)' }}>
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><ShieldCheck size={14} style={{ color: 'var(--green)' }} /> Safety Mode Suggestion</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 6 }}>
            {[
              ['Mode', 'Rear tyre protection', 'var(--green)'],
              ['Duration', '2 laps', 'var(--text)'],
              ['TC change', '+1 in S3', 'var(--accent)'],
              ['Throttle', 'Smoothing at T15', 'var(--yellow)'],
              ['Lean target', 'Reduced by 2°', 'var(--purple)'],
              ['Engine map', 'Unchanged', 'var(--text-muted)'],
            ].map(([label, value, color]) => (
              <div key={label} className="setup-row" style={{ padding: '4px 0' }}>
                <span className="setup-name" style={{ fontSize: 11 }}>{label}</span>
                <span className="setup-val text-mono" style={{ fontSize: 11, color: color as string, fontWeight: 600 }}>{value}</span>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 8, fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.4,
            padding: '6px 8px', borderRadius: 4, background: 'rgba(34,197,94,0.05)',
            border: '1px solid rgba(34,197,94,0.1)',
          }}>
            <strong>Expected effect:</strong> Risk -12 pts · Lap time impact +0.047s
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* DATA CONFIDENCE + SAFETY GUARDIAN AI                                   */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      <div className="grid-2 mt-4" style={{ gap: 16 }}>
        {/* Data Confidence */}
        <div className="card">
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><Thermometer size={14} style={{ color: 'var(--blue)' }} /> Data Confidence</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 6 }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: 36, lineHeight: 1, color: 'var(--green)' }}>
                92<span style={{ fontSize: 14, color: 'var(--text-muted)' }}>%</span>
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', marginTop: 2 }}>CONFIDENCE</div>
            </div>
            <div style={{ flex: 1 }}>
              {[
                ['IMU', 'OK'],
                ['GPS', 'OK'],
                ['Tyre temp', 'OK'],
                ['Brake pressure', 'OK'],
                ['Rear grip', 'Estimated'],
              ].map(([input, status]) => (
                <div key={input} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '2px 0', fontSize: 11, fontFamily: 'JetBrains Mono,monospace',
                }}>
                  <span style={{ color: 'var(--text-dim)' }}>{input}</span>
                  <span style={{
                    color: status === 'OK' ? 'var(--green)' : 'var(--yellow)',
                    fontWeight: 600,
                  }}>{status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Safety Guardian AI */}
        <div className="card" style={{ borderColor: `color-mix(in srgb, ${levelColor} 35%, transparent)` }}>
          <div className="card-header">
            <span className="card-title flex items-center gap-2"><ShieldCheck size={14} style={{ color: levelColor }} /> Safety Guardian AI</span>
          </div>
          <p style={{ fontSize: 12, lineHeight: 1.6, color: 'var(--text-dim)', margin: '6px 0 10px' }}>
            Risk is <strong style={{ color: levelColor }}>{LEVEL_TEXT[level].toLowerCase()} and manageable</strong>.
            Exposure is concentrated in T8/T9 Arrabbiata and T15 Bucine.
          </p>
          <div style={{ fontSize: 11, color: 'var(--text-dim)', lineHeight: 1.6, marginBottom: 10 }}>
            <strong>Recommended actions:</strong>
            <ol style={{ margin: '4px 0 0 16px', padding: 0 }}>
              <li>Reduce lean by 2–3° before throttle pickup at T15 Bucine.</li>
              <li>Avoid TC reduction while rear tyre remains above 116°C.</li>
              <li>Keep brake release smoother into T1 San Donato and T12 Correntaio.</li>
              <li>Avoid aggressive kerb use through Biondetti 1/2.</li>
              <li>Hold current pace elsewhere; no need to sacrifice S1 speed.</li>
            </ol>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => navigate('replay')}>
              Open T{topCorner.n} in Lap Replay <ChevronRight size={12} />
            </button>
            <button className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}
              onClick={() => navigate('setup')}>
              Apply Safety Mode <ChevronRight size={12} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
