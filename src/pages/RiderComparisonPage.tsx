/**
 * Rider Comparison (engineer Phase 3 #1) — head-to-head, corner-by-corner
 * comparison against another rider or your own best lap at Mugello.
 *
 * Surfaces where you gain and lose: entry speed, apex speed, exit speed,
 * brake point, throttle pickup, lean angle, rear grip, sector splits.
 *
 * Built on the —10 Rival Intelligence model with real Mugello geometry.
 * CRITICAL: No Jarama references — all 15 Mugello corners only.
 */

import { useMemo, useState } from 'react';
import {
  Users, TrendingUp, TrendingDown, Trophy, ChevronRight,
  AlertTriangle, ShieldCheck, Info, Zap, MapPin,
  ChevronDown,
} from 'lucide-react';
import { useNavigate } from '../context/NavContext';
import { useLiveTelemetry } from '../hooks/useLiveTelemetry';
import { MUGELLO_CIRCUIT, validRaceLap } from '../domain/sessionTruth';
import { getActiveCircuit } from '../domain/circuits';

// ──── Mugello constants (from sessionTruth) ────

const FUEL_CRITICAL_THRESHOLD = 2.5;
const MAIN_STRAIGHT_M = MUGELLO_CIRCUIT.mainStraightKm * 1000;

// ──── Mugello corner data ────

interface CornerPhase {
  entryKmh: number;
  apexKmh: number;
  exitKmh: number;
  brakeDelta: number;   // m later than reference
  throttlePickup: number; // s late
  leanAngle: number;    // —°
  rearGrip: number;     // %
}

interface MugelloCorner {
  n: number;
  name: string;
  sector: 1 | 2 | 3;
  type: 'left' | 'right' | 'kink';
  you: CornerPhase;
  rival: CornerPhase;
  delta: number;        // s, + = you slower
}

const MUGELLO_CORNERS: MugelloCorner[] = [
  { n: 1,  name: 'San Donato',     sector: 1, type: 'right',  delta: 0.041,  you: { entryKmh: 162, apexKmh: 85,  exitKmh: 178, brakeDelta: 7,  throttlePickup: 0.25, leanAngle: 56, rearGrip: 86 }, rival: { entryKmh: 165, apexKmh: 88,  exitKmh: 182, brakeDelta: 5,  throttlePickup: 0.20, leanAngle: 54, rearGrip: 90 } },
  { n: 2,  name: 'Luco',           sector: 1, type: 'left',   delta: -0.030, you: { entryKmh: 130, apexKmh: 118, exitKmh: 155, brakeDelta: 3,  throttlePickup: 0.15, leanAngle: 48, rearGrip: 91 }, rival: { entryKmh: 128, apexKmh: 117, exitKmh: 153, brakeDelta: 4,  throttlePickup: 0.18, leanAngle: 49, rearGrip: 90 } },
  { n: 3,  name: 'Poggio Secco',   sector: 1, type: 'right',  delta: 0.118,  you: { entryKmh: 115, apexKmh: 95,  exitKmh: 142, brakeDelta: 6,  throttlePickup: 0.38, leanAngle: 58, rearGrip: 74 }, rival: { entryKmh: 120, apexKmh: 101, exitKmh: 150, brakeDelta: 4,  throttlePickup: 0.22, leanAngle: 55, rearGrip: 82 } },
  { n: 4,  name: 'Materassi',      sector: 2, type: 'left',   delta: -0.052, you: { entryKmh: 145, apexKmh: 132, exitKmh: 165, brakeDelta: 2,  throttlePickup: 0.10, leanAngle: 45, rearGrip: 93 }, rival: { entryKmh: 147, apexKmh: 130, exitKmh: 162, brakeDelta: 4,  throttlePickup: 0.15, leanAngle: 47, rearGrip: 91 } },
  { n: 5,  name: 'B. San Lorenzo', sector: 2, type: 'right',  delta: 0.090,  you: { entryKmh: 150, apexKmh: 136, exitKmh: 168, brakeDelta: 5,  throttlePickup: 0.30, leanAngle: 55, rearGrip: 80 }, rival: { entryKmh: 154, apexKmh: 140, exitKmh: 174, brakeDelta: 3,  throttlePickup: 0.20, leanAngle: 53, rearGrip: 86 } },
  { n: 6,  name: 'Casanova',       sector: 2, type: 'left',   delta: -0.061, you: { entryKmh: 168, apexKmh: 154, exitKmh: 180, brakeDelta: 3,  throttlePickup: 0.12, leanAngle: 46, rearGrip: 90 }, rival: { entryKmh: 165, apexKmh: 151, exitKmh: 177, brakeDelta: 4,  throttlePickup: 0.16, leanAngle: 48, rearGrip: 88 } },
  { n: 7,  name: 'Savelli',        sector: 2, type: 'right',  delta: 0.074,  you: { entryKmh: 170, apexKmh: 152, exitKmh: 176, brakeDelta: 4,  throttlePickup: 0.28, leanAngle: 54, rearGrip: 82 }, rival: { entryKmh: 174, apexKmh: 158, exitKmh: 182, brakeDelta: 2,  throttlePickup: 0.18, leanAngle: 52, rearGrip: 87 } },
  { n: 8,  name: 'Arrabbiata 1',   sector: 2, type: 'left',   delta: -0.044, you: { entryKmh: 200, apexKmh: 188, exitKmh: 210, brakeDelta: 2,  throttlePickup: 0.08, leanAngle: 43, rearGrip: 94 }, rival: { entryKmh: 196, apexKmh: 185, exitKmh: 206, brakeDelta: 4,  throttlePickup: 0.12, leanAngle: 45, rearGrip: 92 } },
  { n: 9,  name: 'Arrabbiata 2',   sector: 2, type: 'right',  delta: 0.072,  you: { entryKmh: 195, apexKmh: 183, exitKmh: 205, brakeDelta: 5,  throttlePickup: 0.22, leanAngle: 52, rearGrip: 83 }, rival: { entryKmh: 199, apexKmh: 186, exitKmh: 208, brakeDelta: 2,  throttlePickup: 0.14, leanAngle: 50, rearGrip: 88 } },
  { n: 10, name: 'Scarperia',      sector: 3, type: 'left',   delta: -0.038, you: { entryKmh: 155, apexKmh: 142, exitKmh: 170, brakeDelta: 2,  throttlePickup: 0.10, leanAngle: 47, rearGrip: 92 }, rival: { entryKmh: 153, apexKmh: 140, exitKmh: 168, brakeDelta: 3,  throttlePickup: 0.14, leanAngle: 49, rearGrip: 90 } },
  { n: 11, name: 'Palagio',        sector: 3, type: 'right',  delta: 0.032,  you: { entryKmh: 162, apexKmh: 151, exitKmh: 175, brakeDelta: 4,  throttlePickup: 0.20, leanAngle: 51, rearGrip: 86 }, rival: { entryKmh: 165, apexKmh: 153, exitKmh: 177, brakeDelta: 2,  throttlePickup: 0.15, leanAngle: 49, rearGrip: 89 } },
  { n: 12, name: 'Correntaio',     sector: 3, type: 'left',   delta: 0.058,  you: { entryKmh: 120, apexKmh: 103, exitKmh: 148, brakeDelta: 6,  throttlePickup: 0.32, leanAngle: 57, rearGrip: 76 }, rival: { entryKmh: 124, apexKmh: 106, exitKmh: 152, brakeDelta: 4,  throttlePickup: 0.22, leanAngle: 54, rearGrip: 82 } },
  { n: 13, name: 'Biondetti 1',    sector: 3, type: 'right',  delta: -0.021, you: { entryKmh: 185, apexKmh: 176, exitKmh: 195, brakeDelta: 3,  throttlePickup: 0.12, leanAngle: 46, rearGrip: 91 }, rival: { entryKmh: 183, apexKmh: 174, exitKmh: 193, brakeDelta: 4,  throttlePickup: 0.15, leanAngle: 48, rearGrip: 89 } },
  { n: 14, name: 'Biondetti 2',    sector: 3, type: 'right',  delta: 0.031,  you: { entryKmh: 180, apexKmh: 168, exitKmh: 190, brakeDelta: 4,  throttlePickup: 0.18, leanAngle: 50, rearGrip: 87 }, rival: { entryKmh: 183, apexKmh: 171, exitKmh: 193, brakeDelta: 2,  throttlePickup: 0.12, leanAngle: 48, rearGrip: 90 } },
  { n: 15, name: 'Bucine',         sector: 3, type: 'right',  delta: 0.184,  you: { entryKmh: 159, apexKmh: 91,  exitKmh: 184, brakeDelta: 7,  throttlePickup: 0.40, leanAngle: 57, rearGrip: 78 }, rival: { entryKmh: 162, apexKmh: 99,  exitKmh: 194, brakeDelta: 3,  throttlePickup: 0.18, leanAngle: 54, rearGrip: 86 } },
];

type ComparisonTarget = 'P1' | 'P2' | 'P4' | 'Best Lap' | 'Ideal Lap';
const TARGETS: { id: ComparisonTarget; label: string; rider: string }[] = [
  { id: 'P1', label: 'Pace Benchmark', rider: 'M. Marquez' },
  { id: 'P2', label: 'Attack Target',  rider: 'P. Espargaro' },
  { id: 'P4', label: 'Defensive Threat', rider: 'J. Martin' },
  { id: 'Best Lap', label: 'Your Best Lap', rider: 'Best' },
  { id: 'Ideal Lap', label: 'Theoretical Ideal', rider: 'Ideal' },
];

// ──── Helpers ────

function deltaColor(d: number): string {
  if (d <= -0.02) return 'var(--green)';
  if (d >= 0.02)  return 'var(--accent)';
  return 'var(--text-dim)';
}

// ──── Sector labels for Mugello ────

const SECTOR_LABELS: Record<number, { name: string; from: string; to: string }> = {
  1: { name: 'S1', from: 'Start/Finish', to: 'Poggio Secco' },
  2: { name: 'S2', from: 'Materassi',    to: 'Arrabbiata 2' },
  3: { name: 'S3', from: 'Scarperia',    to: 'Bucine' },
};

// ──── Corner types ────

type LossPhase = 'entry' | 'apex' | 'exit' | 'brake' | 'throttle' | 'setup';
type CornerStatus = 'loss' | 'gain' | 'neutral';

function getLossPhase(c: MugelloCorner): LossPhase {
  const entryDiff = c.rival.entryKmh - c.you.entryKmh;
  const apexDiff  = c.rival.apexKmh  - c.you.apexKmh;
  const exitDiff  = c.rival.exitKmh  - c.you.exitKmh;
  const phases: [number, LossPhase][] = [
    [Math.abs(entryDiff), 'entry'],
    [Math.abs(apexDiff),  'apex'],
    [Math.abs(exitDiff),  'exit'],
    [Math.abs(c.you.brakeDelta - c.rival.brakeDelta) * 0.3, 'brake'],
    [Math.abs(c.you.throttlePickup - c.rival.throttlePickup) * 0.3, 'throttle'],
  ];
  return phases.sort((a, b) => b[0] - a[0])[0][1];
}

function getStatus(d: number): CornerStatus {
  if (d <= -0.02) return 'gain';
  if (d >= 0.02)  return 'loss';
  return 'neutral';
}

// ──── Race Header Component ────

function RaceHeader({
  lap, totalLaps, pos, gap, speed, fuel, fuelValid,
}: {
  lap: number; totalLaps: number; pos: number; gap: string;
  speed: number; fuel: number; fuelValid: boolean;
}) {
  const fuelCritical = fuel <= FUEL_CRITICAL_THRESHOLD;
  const fuelInvalid  = !fuelValid || (fuel < 1.0 && speed > 50);
  const fuelRange    = fuelInvalid ? 0 : Math.max(0, +(fuel / MUGELLO_CIRCUIT.fuelBurnKgPerLap).toFixed(1));

  return (
    <div className="card mb-4" style={{
      background: fuelInvalid
        ? 'linear-gradient(135deg, rgba(224,55,55,0.15) 0%, rgba(11,13,18,0.8) 100%)'
        : 'linear-gradient(135deg, rgba(224,55,55,0.08) 0%, rgba(11,13,18,0.8) 100%)',
      border: fuelInvalid ? '1px solid rgba(224,55,55,0.4)' : '1px solid rgba(224,55,55,0.2)',
    }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'auto 1fr auto', gap: 12, alignItems: 'center' }}>
        {/* Left: Session info */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', color: 'var(--accent)', fontFamily: 'JetBrains Mono,monospace', textTransform: 'uppercase' }}>RACE</div>
          <div style={{ fontSize: 12, fontFamily: 'JetBrains Mono,monospace', color: 'var(--text)' }}>
            GP {getActiveCircuit().name} —· {getActiveCircuit().country} —· Round 7/20 —· 2026
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', marginTop: 2 }}>
            {MUGELLO_CIRCUIT.lengthKm} km —· {MUGELLO_CIRCUIT.turns} turns —· main straight {MAIN_STRAIGHT_M} m
          </div>
        </div>

        {/* Center: Key metrics */}
        <div style={{ display: 'flex', gap: 20, justifyContent: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', letterSpacing: '0.06em' }}>LAP</div>
            <div className="text-mono" style={{ fontSize: 22, fontWeight: 700, color: !validRaceLap(lap) ? 'var(--accent)' : 'var(--text)', lineHeight: 1.1 }}>
              {!validRaceLap(lap) ? (
                <span style={{ color: 'var(--accent)', animation: 'pulse 1.5s infinite' }}>INVALID</span>
              ) : (
                <>{lap}<span style={{ fontSize: 14, color: 'var(--text-muted)' }}>/{totalLaps}</span></>
              )}
            </div>
            {!validRaceLap(lap) && (
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent)', marginTop: 1 }}>
                Lap {lap} exceeds race length {totalLaps}
              </div>
            )}
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', letterSpacing: '0.06em' }}>POSITION</div>
            <div className="text-mono" style={{ fontSize: 22, fontWeight: 700, color: 'var(--yellow)', lineHeight: 1.1 }}>P{pos}</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', letterSpacing: '0.06em' }}>GAP</div>
            <div className="text-mono" style={{ fontSize: 16, fontWeight: 700, color: gap.includes('leader') ? 'var(--green)' : gap.startsWith('——œ') ? 'var(--green)' : 'var(--accent)', lineHeight: 1.1 }}>
              {gap.includes('leader') ? 'LEADER' : `${gap}s`}
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', letterSpacing: '0.06em' }}>SPEED</div>
            <div className="text-mono" style={{ fontSize: 16, fontWeight: 700, color: speed > 300 ? 'var(--accent)' : 'var(--text)', lineHeight: 1.1 }}>
              {speed}<span style={{ fontSize: 11, color: 'var(--text-muted)' }}> km/h</span>
            </div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', letterSpacing: '0.06em' }}>FUEL</div>
            {fuelInvalid ? (
              <>
                <div className="text-mono" style={{ fontSize: 16, fontWeight: 700, color: 'var(--accent)', lineHeight: 1.1 }}>
                  {fuel.toFixed(1)}<span style={{ fontSize: 11, color: 'var(--text-muted)' }}> kg</span>
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent)', fontFamily: 'JetBrains Mono,monospace', animation: 'pulse 1.5s ease-in-out infinite' }}>
                  DATA ERROR —· sensor
                </div>
              </>
            ) : (
              <>
                <div className="text-mono" style={{ fontSize: 16, fontWeight: 700, color: fuelCritical ? 'var(--accent)' : 'var(--orange)', lineHeight: 1.1 }}>
                  {fuel.toFixed(1)}<span style={{ fontSize: 11, color: 'var(--text-muted)' }}> kg</span>
                </div>
                {fuelCritical ? (
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--accent)', fontFamily: 'JetBrains Mono,monospace', animation: 'pulse 1.5s ease-in-out infinite' }}>
                    CRITICAL —· {fuelRange} lap range
                  </div>
                ) : (
                  <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
                    Target OK —· ~{fuelRange} laps
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Right: Track status */}
        <div style={{ textAlign: 'right' }}>
          <div style={{
            display: 'inline-block', padding: '3px 10px', borderRadius: 4,
            background: fuelInvalid ? 'rgba(224,55,55,0.15)' : 'rgba(34,197,94,0.15)',
            border: `1px solid ${fuelInvalid ? 'rgba(224,55,55,0.3)' : 'rgba(34,197,94,0.3)'}`,
            fontSize: 10, fontWeight: 700, letterSpacing: '0.08em',
            color: fuelInvalid ? 'var(--accent)' : 'var(--green)',
            fontFamily: 'JetBrains Mono,monospace',
          }}>
            {fuelInvalid ? 'DATA ERROR' : 'GREEN FLAG'}
          </div>
          <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', marginTop: 4 }}>
            {fuelInvalid ? 'Sensor validation required' : 'All sectors clear'}
          </div>
        </div>
      </div>

      {/* Fuel invalid banner */}
      {fuelInvalid && (
        <div style={{
          marginTop: 8, padding: '6px 12px', borderRadius: 'var(--radius)',
          background: 'rgba(224,55,55,0.12)',
          border: '1px solid rgba(224,55,55,0.25)',
          fontSize: 12, color: 'var(--accent)', fontFamily: 'JetBrains Mono,monospace',
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <AlertTriangle size={14} />
          {fuel < 1.0 && speed > 50
            ? `FUEL DATA ERROR — Fuel reads ${fuel.toFixed(1)} kg while bike is moving at ${speed} km/h. Sensor validation required.`
            : `FUEL DATA ERROR — Fuel sensor reading ${fuel.toFixed(1)} kg is outside valid range.`}
        </div>
      )}
    </div>
  );
}

// ──── Corner Detail Card ────

function CornerDetailCard({ corner, isOpen, onToggle }: {
  corner: MugelloCorner;
  isOpen: boolean;
  onToggle: () => void;
}) {
  const status = getStatus(corner.delta);
  const phase = getLossPhase(corner);
  const entryDiff = corner.rival.entryKmh - corner.you.entryKmh;
  const apexDiff  = corner.rival.apexKmh  - corner.you.apexKmh;
  const exitDiff  = corner.rival.exitKmh  - corner.you.exitKmh;

  return (
    <div className="card" style={{
      borderColor: status === 'loss'
        ? 'var(--accent-dim)'
        : status === 'gain'
          ? 'var(--green-dim)'
          : 'var(--border)',
    }}>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}
        onClick={onToggle}
      >
        <div style={{
          width: 28, height: 28, borderRadius: 'var(--radius)', flex: 'none',
          display: 'grid', placeItems: 'center',
          background: status === 'loss'
            ? 'var(--accent-dim)' : status === 'gain'
              ? 'var(--green-dim)' : 'rgba(255,255,255,0.05)',
          color: status === 'loss' ? 'var(--accent)' : status === 'gain' ? 'var(--green)' : 'var(--text-dim)',
          fontSize: 11, fontWeight: 700, fontFamily: 'JetBrains Mono,monospace',
        }}>
          {corner.n}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 700 }}>{corner.name}</div>
          <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'JetBrains Mono,monospace' }}>
            {corner.type === 'kink' ? 'kink' : `${corner.type} —· ${SECTOR_LABELS[corner.sector].name}`}
          </div>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          fontFamily: 'JetBrains Mono,monospace', fontWeight: 800, fontSize: 14,
          color: deltaColor(-corner.delta),
        }}>
          {corner.delta <= -0.02 ? <TrendingUp size={13} /> : corner.delta >= 0.02 ? <TrendingDown size={13} /> : <Info size={13} />}
          {corner.delta <= -0.02 ? '—†—™' : '+'}{Math.abs(corner.delta).toFixed(3)}s
        </div>
        <ChevronDown size={14} style={{
          color: 'var(--text-muted)', flex: 'none',
          transform: isOpen ? 'rotate(180deg)' : 'none',
          transition: 'transform 0.2s',
        }} />
      </div>

      {isOpen && (
        <div style={{ marginTop: 12, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
          {/* Three-phase speed comparison */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 12 }}>
            {[
              { label: 'Entry', you: corner.you.entryKmh, rival: corner.rival.entryKmh, diff: entryDiff },
              { label: 'Apex',  you: corner.you.apexKmh,  rival: corner.rival.apexKmh,  diff: apexDiff },
              { label: 'Exit',  you: corner.you.exitKmh,  rival: corner.rival.exitKmh,  diff: exitDiff },
            ].map(p => (
              <div key={p.label} style={{
                padding: '8px 10px',
                background: 'rgba(255,255,255,0.03)',
                borderRadius: 'var(--radius)',
                textAlign: 'center',
              }}>
                <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', letterSpacing: '0.06em', marginBottom: 4 }}>{p.label}</div>
                <div style={{ display: 'flex', justifyContent: 'center', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 13, fontWeight: 700, color: 'var(--accent)' }}>{p.you}</span>
                  <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>vs</span>
                  <span style={{ fontFamily: 'JetBrains Mono,monospace', fontSize: 13, fontWeight: 700, color: 'var(--blue)' }}>{p.rival}</span>
                </div>
                {p.diff !== 0 && (
                  <div style={{
                    fontSize: 11, fontFamily: 'JetBrains Mono,monospace', fontWeight: 700, marginTop: 4,
                    color: p.diff < 0 ? 'var(--green)' : 'var(--accent)',
                  }}>
                    {p.diff > 0 ? '-' : '+'}{Math.abs(p.diff)} km/h
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Detailed telemetry */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
            {[
              { label: 'Brake point', you: `${corner.you.brakeDelta}m late`, rival: `${corner.rival.brakeDelta}m late`, better: corner.you.brakeDelta <= corner.rival.brakeDelta },
              { label: 'Throttle pickup', you: `${corner.you.throttlePickup.toFixed(2)}s`, rival: `${corner.rival.throttlePickup.toFixed(2)}s`, better: corner.you.throttlePickup <= corner.rival.throttlePickup },
              { label: 'Lean angle', you: `${corner.you.leanAngle}—°`, rival: `${corner.rival.leanAngle}—°`, better: corner.you.leanAngle <= corner.rival.leanAngle },
              { label: 'Rear grip', you: `${corner.you.rearGrip}%`, rival: `${corner.rival.rearGrip}%`, better: corner.you.rearGrip >= corner.rival.rearGrip },
            ].map(r => (
              <div key={r.label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '6px 8px', borderRadius: 4, background: 'rgba(255,255,255,0.02)',
              }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{r.label}</span>
                <div style={{ display: 'flex', gap: 10, fontFamily: 'JetBrains Mono,monospace', fontSize: 11 }}>
                  <span style={{ color: r.better ? 'var(--green)' : 'var(--accent)' }}>{r.you}</span>
                  <span style={{ color: 'var(--text-dim)' }}>vs</span>
                  <span style={{ color: !r.better ? 'var(--green)' : 'var(--blue)' }}>{r.rival}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Phase loss indicator */}
          <div style={{
            marginTop: 8, padding: '6px 10px', borderRadius: 4,
            background: status === 'loss' ? 'var(--accent-dim)' : status === 'gain' ? 'var(--green-dim)' : 'rgba(255,255,255,0.03)',
            fontSize: 11, fontFamily: 'JetBrains Mono,monospace',
            color: status === 'loss' ? 'var(--accent)' : status === 'gain' ? 'var(--green)' : 'var(--text-dim)',
          }}>
            Main phase: <strong>{phase}</strong> —· Status: <strong>{status.toUpperCase()}</strong>
          </div>
        </div>
      )}
    </div>
  );
}

// ──── Selected Corner Full Analysis ────

function SelectedCornerAnalysis({ corner }: { corner: MugelloCorner }) {
  const entryDiff  = corner.rival.entryKmh - corner.you.entryKmh;
  const apexDiff   = corner.rival.apexKmh  - corner.you.apexKmh;
  const exitDiff   = corner.rival.exitKmh  - corner.you.exitKmh;
  const brakeDiff  = corner.you.brakeDelta - corner.rival.brakeDelta;
  const throttleDiff = corner.you.throttlePickup - corner.rival.throttlePickup;
  const leanDiff   = corner.you.leanAngle  - corner.rival.leanAngle;
  const gripDiff   = corner.you.rearGrip   - corner.rival.rearGrip;

  const isCritical = corner.delta >= 0.07;

  return (
    <div className="card" style={{
      borderColor: 'color-mix(in srgb, var(--accent) 30%, transparent)',
      background: isCritical ? 'linear-gradient(135deg, rgba(224,55,55,0.05), rgba(255,255,255,0.02))' : undefined,
    }}>
      <div className="card-header">
        <span className="card-title flex items-center gap-2">
          <Zap size={14} style={{ color: isCritical ? 'var(--accent)' : 'var(--blue)' }} />
          SELECTED CORNER —· T{corner.n} {corner.name}
        </span>
        {isCritical && (
          <span className="badge" style={{ background: 'var(--accent-dim)', color: 'var(--accent)', fontFamily: 'JetBrains Mono,monospace' }}>
            +{corner.delta.toFixed(3)}s
          </span>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 8 }}>
        {[
          { label: 'Entry speed',   you: `${corner.you.entryKmh} km/h`,  rival: `${corner.rival.entryKmh} km/h`,  diff: entryDiff },
          { label: 'Apex speed',    you: `${corner.you.apexKmh} km/h`,   rival: `${corner.rival.apexKmh} km/h`,   diff: apexDiff },
          { label: 'Exit speed',    you: `${corner.you.exitKmh} km/h`,   rival: `${corner.rival.exitKmh} km/h`,   diff: exitDiff },
          { label: 'Brake point',   you: `+${corner.you.brakeDelta}m`,    rival: `+${corner.rival.brakeDelta}m`,    diff: brakeDiff },
          { label: 'Throttle pickup', you: `+${corner.you.throttlePickup.toFixed(2)}s`, rival: `+${corner.rival.throttlePickup.toFixed(2)}s`, diff: throttleDiff },
          { label: 'Lean angle',    you: `${corner.you.leanAngle}—°`,     rival: `${corner.rival.leanAngle}—°`,     diff: leanDiff },
          { label: 'Rear grip',     you: `${corner.you.rearGrip}%`,      rival: `${corner.rival.rearGrip}%`,      diff: gripDiff },
          { label: 'Time loss',     you: `${Math.abs(corner.delta).toFixed(3)}s`, rival: '—', diff: corner.delta },
        ].map(r => (
          <div key={r.label} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '5px 8px', borderRadius: 4,
            background: 'rgba(255,255,255,0.02)',
            border: `1px solid ${typeof r.diff === 'number' && Math.abs(r.diff) > (r.label === 'Time loss' ? 0.05 : 3) ? 'rgba(224,55,55,0.15)' : 'rgba(255,255,255,0.04)'}`,
          }}>
            <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>{r.label}</span>
            <div style={{ display: 'flex', gap: 8, fontFamily: 'JetBrains Mono,monospace', fontSize: 11, fontWeight: 600 }}>
              <span style={{ color: 'var(--accent)' }}>{r.you}</span>
              {r.rival !== '—' && <span style={{ color: 'var(--text-dim)' }}>vs</span>}
              <span style={{ color: r.label === 'Time loss' ? 'var(--accent)' : 'var(--blue)' }}>{r.rival}</span>
            </div>
          </div>
        ))}
      </div>

      {/* AI recommendation */}
      {isCritical && (
        <div style={{
          marginTop: 12, padding: '10px 12px', borderRadius: 'var(--radius)',
          background: 'rgba(224,55,55,0.08)',
          border: '1px solid rgba(224,55,55,0.2)',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--accent)', fontFamily: 'JetBrains Mono,monospace', marginBottom: 4 }}>
            BIGGEST OPPORTUNITY
          </div>
          <div style={{ fontSize: 12, lineHeight: 1.5, color: 'var(--text-dim)' }}>
            <strong>Issue:</strong> {Math.abs(apexDiff)} km/h slower at apex and {Math.abs(exitDiff)} km/h slower on exit.<br />
            <strong>Cause:</strong> Late throttle pickup ({corner.you.throttlePickup.toFixed(2)}s) while still carrying {corner.you.leanAngle}—° lean. Rear grip drops to {corner.you.rearGrip}%.<br />
            <strong>Recommended action:</strong> Rotate earlier, reduce lean by ~{Math.max(2, Math.round(leanDiff))}—°, open throttle 0.3s earlier with smoother pickup. If rear slip persists, raise TC +1 only for S3.
          </div>
        </div>
      )}
    </div>
  );
}

// ──── Data Integrity ────

function DataIntegrity({ lap, fuel, fuelValid, lapOk }: {
  lap: number; fuel: number; fuelValid: boolean; lapOk: boolean;
}) {
  const checks = [
    { label: 'Circuit selected',          ok: true, detail: MUGELLO_CIRCUIT.shortName },
    { label: 'Loaded comparison map',     ok: true, detail: MUGELLO_CIRCUIT.shortName },
    { label: 'Corner set',                ok: true, detail: `${MUGELLO_CORNERS.length} / ${MUGELLO_CIRCUIT.turns} Mugello corners` },
    { label: 'Lap state',                 ok: lapOk, detail: lapOk ? 'Valid' : `Lap ${lap} exceeds race length ${MUGELLO_CIRCUIT.raceLaps}` },
    { label: 'Fuel channel',              ok: fuelValid && fuel >= 0.5, detail: fuelValid && fuel >= 0.5 ? 'Valid' : 'Sensor error' },
  ];

  const allOk = checks.every(c => c.ok);

  return (
    <div className="card" style={{
      borderColor: allOk ? 'color-mix(in srgb, var(--green) 30%, transparent)' : 'color-mix(in srgb, var(--accent) 30%, transparent)',
    }}>
      <div className="card-header">
        <span className="card-title flex items-center gap-2">
          <ShieldCheck size={14} style={{ color: allOk ? 'var(--green)' : 'var(--accent)' }} />
          RIDER COMPARISON DATA INTEGRITY
        </span>
        {!allOk && (
          <span className="badge" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
            <AlertTriangle size={11} style={{ verticalAlign: -1, marginRight: 4 }} />
            CRITICAL
          </span>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
        {checks.map(c => (
          <div key={c.label} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)',
          }}>
            <div style={{
              width: 16, height: 16, borderRadius: '50%', flex: 'none',
              display: 'grid', placeItems: 'center',
              background: c.ok ? 'rgba(34,197,94,0.15)' : 'rgba(224,55,55,0.15)',
            }}>
              <div style={{
                width: 6, height: 6, borderRadius: '50%',
                background: c.ok ? 'var(--green)' : 'var(--accent)',
              }} />
            </div>
            <span style={{ fontSize: 12, color: 'var(--text-muted)', flex: 1 }}>{c.label}</span>
            <span style={{
              fontSize: 11, fontFamily: 'JetBrains Mono,monospace', fontWeight: 600,
              color: c.ok ? 'var(--green)' : 'var(--accent)',
            }}>{c.detail}</span>
          </div>
        ))}
      </div>
      {allOk && (
        <div style={{ marginTop: 8, fontSize: 11, color: 'var(--green)', fontFamily: 'JetBrains Mono,monospace' }}>
          ─"—œ All systems validated —· No warnings
        </div>
      )}
    </div>
  );
}

// ──── Main Component ────

export function RiderComparisonPage() {
  const navigate = useNavigate();
  const t = useLiveTelemetry();

  const [target, setTarget] = useState<ComparisonTarget>('P1');
  const [selectedCorner, setSelectedCorner] = useState<number | null>(15);
  const [openCorners, setOpenCorners] = useState<Set<number>>(new Set([15]));

  const lapOk = validRaceLap(t.lapCount);
  // Compute aggregates
  const { total, sectors, worst, best, cornersAhead } = useMemo(() => {
    const total = MUGELLO_CORNERS.reduce((a, c) => a + c.delta, 0);

    const sectors = [1, 2, 3].map(s => {
      const corners = MUGELLO_CORNERS.filter(c => c.sector === s);
      return {
        s,
        delta: corners.reduce((a, c) => a + c.delta, 0),
        count: corners.length,
        label: SECTOR_LABELS[s],
      };
    });

    const worst = MUGELLO_CORNERS.reduce((m, c) => (c.delta > m.delta ? c : m), MUGELLO_CORNERS[0]);
    const best  = MUGELLO_CORNERS.reduce((m, c) => (c.delta < m.delta ? c : m), MUGELLO_CORNERS[0]);
    const cornersAhead = MUGELLO_CORNERS.filter(c => c.delta < 0).length;

    return { total, sectors, worst, best, cornersAhead };
  }, []);

  const youBehind = total > 0;

  // Rival label
  const rivalLabel = TARGETS.find(tg => tg.id === target)?.rider ?? 'Rival';

  // AI summary
  const aiSummary = useMemo(() => {
    const mainTheme = total > 0
      ? 'You are competitive through high-speed sections, but losing time on corner exits.'
      : 'You are gaining overall, especially in high-speed sections.';
    const mainOpp   = worst;
    const oppAction = mainOpp.delta >= 0.07
      ? `Main opportunity: T${mainOpp.n} ${mainOpp.name} exit onto the main straight.`
      : 'Continue refining corner-by-corner consistency.';
    return `${mainTheme} ${oppAction}`;
  }, [total, worst]);

  function toggleOpen(n: number) {
    setOpenCorners(p => {
      const nxt = new Set(p);
      if (nxt.has(n)) nxt.delete(n); else nxt.add(n);
      return nxt;
    });
  }

  return (
    <div className="page">

      {/* ─ */}
      {/* RACE HEADER                                                           */}
      {/* ─ */}
      <RaceHeader
        lap={t.lapCount}
        totalLaps={MUGELLO_CIRCUIT.raceLaps}
        pos={t.position}
        gap={t.gap}
        speed={t.speed}
        fuel={t.fuelLoad}
        fuelValid={t.fuelValid}
      />

      {/* ─ */}
      {/* PAGE HEADER                                                           */}
      {/* ─ */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Rider Comparison</h1>
          <p className="page-subtitle">
            {getActiveCircuit().name} —· head-to-head —· sector, corner, speed, brake, throttle and line comparison
          </p>
        </div>
        <div className="flex items-center gap-2">
          {TARGETS.map(tg => (
            <button
              key={tg.id}
              onClick={() => setTarget(tg.id)}
              style={{
                padding: '4px 10px', borderRadius: 'var(--radius)',
                background: target === tg.id ? 'rgba(224,55,55,0.15)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${target === tg.id ? 'rgba(224,55,55,0.3)' : 'rgba(255,255,255,0.08)'}`,
                cursor: 'pointer',
                color: target === tg.id ? 'var(--accent)' : 'var(--text-muted)',
                fontSize: 10, fontFamily: 'JetBrains Mono,monospace',
                letterSpacing: '0.04em', fontWeight: 600,
                transition: 'background  ease, color  ease, box-shadow  ease',
              }}
            >
              {tg.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─ */}
      {/* COMPARISON MODE STRIP                                                  */}
      {/* ─ */}
      {target !== 'Best Lap' && target !== 'Ideal Lap' && (
        <div style={{
          marginBottom: 16, padding: '8px 12px', borderRadius: 8,
          background: 'rgba(255,255,255,0.02)', border: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono,monospace', color: 'var(--text-muted)' }}>
            {target === 'P1' ? 'PACE BENCHMARK' : target === 'P2' ? 'ATTACK TARGET' : 'DEFENSIVE THREAT'}
          </span>
          {target === 'P2' && (
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono,monospace', color: 'var(--green)' }}>
              Gap to P2: +0.900s —· You are faster in S3 by —†—™0.010s —· Opportunity: Bucine exit and main straight slipstream.
            </span>
          )}
          {target === 'P4' && (
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono,monospace', color: 'var(--accent)' }}>
              Gap to P4: 0.363s —· J. Martin is faster in T1 and T15 —· Risk: overtake into San Donato.
            </span>
          )}
          {target === 'P1' && (
            <span style={{ fontSize: 11, fontFamily: 'JetBrains Mono,monospace', color: 'var(--text-dim)' }}>
              Absolute pace reference. Use P2 for attack strategy, P4 for defensive.
            </span>
          )}
        </div>
      )}

      {/* ─ */}
      {/* COMPARISON SUMMARY                                                     */}
      {/* ─ */}
      <div className="card mb-4" style={{
        background: `linear-gradient(135deg, ${youBehind ? 'rgba(224,55,55,0.10)' : 'rgba(34,197,94,0.10)'}, rgba(255,255,255,0.02))`,
      }}>
        <div className="card-header">
          <span className="card-title flex items-center gap-2">
            <Users size={14} style={{ color: 'var(--accent)' }} />
            You vs {rivalLabel} —· {target}
          </span>
          <span className="badge" style={{
            background: youBehind ? 'var(--accent-dim)' : 'var(--green-dim)',
            color: youBehind ? 'var(--accent)' : 'var(--green)',
          }}>
            {youBehind ? 'BEHIND' : 'AHEAD'}
          </span>
        </div>

        <div className="grid-4" style={{ marginTop: 8 }}>
          <div className="stat-tile">
            <div className="stat-tile__label">Net delta</div>
            <span className="stat-tile__value" style={{ fontSize: 26, color: deltaColor(-total) }}>
              {total > 0 ? '+' : '—†—™'}{Math.abs(total).toFixed(3)}<span className="stat-tile__unit">s</span>
            </span>
          </div>
          <div className="stat-tile">
            <div className="stat-tile__label">Biggest loss</div>
            <span className="stat-tile__value" style={{ fontSize: 14, color: 'var(--accent)' }}>
              T{worst.n} —· {worst.name}
            </span>
          </div>
          <div className="stat-tile">
            <div className="stat-tile__label">Biggest gain</div>
            <span className="stat-tile__value" style={{ fontSize: 14, color: 'var(--green)' }}>
              T{best.n} —· {best.name}
            </span>
          </div>
          <div className="stat-tile">
            <div className="stat-tile__label">Corners ahead</div>
            <span className="stat-tile__value" style={{ fontSize: 22 }}>
              {cornersAhead}/{MUGELLO_CORNERS.length}
            </span>
          </div>
        </div>

        {/* Sectors with real Mugello zone names */}
        <div className="grid-3" style={{ marginTop: 10 }}>
          {sectors.map(sec => (
            <div key={sec.s} className="stat-tile" style={{ textAlign: 'center' }}>
              <div className="stat-tile__label">
                {sec.label.name} —· {sec.label.from} ─—™ {sec.label.to}
              </div>
              <span className="stat-tile__value" style={{ fontSize: 18, color: deltaColor(-sec.delta) }}>
                {sec.delta > 0 ? '+' : '—†—™'}{Math.abs(sec.delta).toFixed(3)}s
              </span>
              {Math.abs(sec.delta) > 0.05 && (
                <div style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace', marginTop: 2 }}>
                  {sec.delta > 0
                    ? `Main loss: ${worst.sector === sec.s ? `T${worst.n} ${worst.name}` : 'corner exits'}`
                    : `Main gain: ${best.sector === sec.s ? `T${best.n} ${best.name}` : 'high-speed flow'}`}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* AI Summary */}
        <div style={{
          marginTop: 10, padding: '8px 12px', borderRadius: 'var(--radius)',
          background: 'color-mix(in srgb, var(--blue) 6%, transparent)',
          border: '1px solid color-mix(in srgb, var(--blue) 15%, transparent)',
          display: 'flex', alignItems: 'flex-start', gap: 8,
        }}>
          <Info size={14} style={{ color: 'var(--blue)', flex: 'none', marginTop: 1 }} />
          <span style={{ fontSize: 12, color: 'var(--text-dim)', lineHeight: 1.5 }}>
            <strong style={{ color: 'var(--text)' }}>AI Summary:</strong> {aiSummary}
          </span>
        </div>
      </div>

      {/* ─ */}
      {/* SELECTED CORNER DETAIL                                                 */}
      {/* ─ */}
      {selectedCorner !== null && (() => {
        const corner = MUGELLO_CORNERS.find(c => c.n === selectedCorner);
        if (!corner) return null;
        return <SelectedCornerAnalysis corner={corner} />;
      })()}

      {/* ─ */}
      {/* CORNER-BY-CORNER TABLE                                                 */}
      {/* ─ */}
      <div className="flex items-center justify-between mt-4 mb-2">
        <span className="card-title">
          CORNER-BY-CORNER DELTA —· {rivalLabel}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono,monospace' }}>
          {cornersAhead}/{MUGELLO_CORNERS.length} ahead —· net {total > 0 ? '+' : '—†—™'}{Math.abs(total).toFixed(3)}s
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[...MUGELLO_CORNERS].sort((a, b) => b.delta - a.delta).map(c => (
          <CornerDetailCard
            key={c.n}
            corner={c}
            isOpen={openCorners.has(c.n)}
            onToggle={() => {
              toggleOpen(c.n);
              setSelectedCorner(c.n);
            }}
          />
        ))}
      </div>

      {/* Biggest opportunity */}
      <div style={{
        marginTop: 16,
        padding: '12px 14px', borderRadius: 8,
        background: 'var(--accent-dim)',
        border: '1px solid color-mix(in srgb, var(--accent) 30%, transparent)',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <Trophy size={16} style={{ color: 'var(--accent)', flex: 'none' }} />
        <span style={{ fontSize: 13 }}>
          <strong>Biggest opportunity: T{worst.n} ({worst.name})</strong> — {Math.abs(worst.rival.apexKmh - worst.you.apexKmh)} km/h slower at apex and {Math.abs(worst.rival.exitKmh - worst.you.exitKmh)} km/h slower on exit. Rotate earlier, reduce lean, pick up throttle earlier to recover {Math.abs(worst.delta).toFixed(3)}s.
        </span>
        <button
          className="btn btn-sm"
          style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6, flex: 'none' }}
          onClick={() => navigate('replay')}
        >
          Open in Lap Replay <ChevronRight size={12} />
        </button>
      </div>

      {/* ─ */}
      {/* RACING LINE OVERLAY (conceptual)                                       */}
      {/* ─ */}
      <div className="card mt-4">
        <div className="card-header">
          <span className="card-title flex items-center gap-2">
            <MapPin size={14} style={{ color: 'var(--blue)' }} />
            RACING LINE OVERLAY —· MUGELLO
          </span>
        </div>
        <div style={{ marginTop: 6, fontSize: 13, color: 'var(--text-dim)', lineHeight: 1.6 }}>
          <p style={{ marginBottom: 8 }}>{MUGELLO_CIRCUIT.assetStatusLabel} —· {MUGELLO_CIRCUIT.turns} turns</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 8 }}>
            {['You', 'Rival', 'Ideal line', 'Brake markers', 'Throttle pickup', 'Apex', 'Rear slip events'].map(layer => (
              <span key={layer} style={{
                padding: '2px 8px', borderRadius: 4, fontSize: 10,
                background: 'color-mix(in srgb, var(--blue) 8%, transparent)',
                border: '1px solid color-mix(in srgb, var(--blue) 20%, transparent)',
                color: 'var(--blue)', fontFamily: 'JetBrains Mono,monospace',
              }}>
                ─"—œ {layer}
              </span>
            ))}
          </div>
          {selectedCorner !== null && (() => {
            const corner = MUGELLO_CORNERS.find(c => c.n === selectedCorner);
            if (!corner) return null;
            const isLoss = corner.delta >= 0.02;
            return (
              <div style={{
                padding: '8px 10px', borderRadius: 'var(--radius)',
                background: 'rgba(255,255,255,0.03)',
                fontSize: 12,
              }}>
                <strong style={{ color: 'var(--text)' }}>T{corner.n} {corner.name}:</strong>{' '}
                {isLoss
                  ? `Wider entry, late pickup (${corner.you.throttlePickup.toFixed(2)}s), rear slip on exit. Rival: earlier rotation, smoother pickup, better drive onto straight.`
                  : `Tighter line, earlier pickup. Rival slightly wider entry.`}
              </div>
            );
          })()}
        </div>
      </div>

      {/* ─ */}
      {/* DATA INTEGRITY                                                         */}
      {/* ─ */}
      <div className="mt-4">
        <DataIntegrity
          lap={t.lapCount}
          fuel={t.fuelLoad}
          fuelValid={t.fuelValid}
          lapOk={lapOk}
        />
      </div>
    </div>
  );
}

export default RiderComparisonPage;
