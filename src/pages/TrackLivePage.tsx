/**
 * Track-Live (engineer feedback #22) — Live Race HUD for the pit-wall screen.
 * Real-time telemetry, contextual alerts (with cause + action), current zone,
 * rider coach AI per Mugello corner, track map, and tyre/degradation monitoring.
 *
 * CRITICAL RULE: session identity is MUGELLO. Any Jarama references are
 * incorrect — this is GP Mugello, Round 7 of 20, 2026 season.
 */
import { useLiveTelemetry } from '../hooks/useLiveTelemetry';
import { DigitalTwinViewer3D } from '../components/babylon/DigitalTwinViewer3D';
import { TrackMap3D } from '../components/babylon/TrackMap3D';
import { LeanAngleHUD } from '../components/LeanAngleHUD';
import { RiderCoachInsight } from '../components/RiderCoachInsight';
import {
  AlertTriangle, ShieldAlert, Radio, Map,
  Thermometer, Clock,
} from 'lucide-react';
import { MUGELLO_CIRCUIT, sessionDisplayState } from '../domain/sessionTruth';
import { useSessionContext } from '../hooks/useSessionContext';

// ── Mugello circuit data ────────────────────────────────────────────────────

const RACE_LAPS = MUGELLO_CIRCUIT.raceLaps;
const MUGELLO_TRACK_KM = MUGELLO_CIRCUIT.lengthKm;
const MUGELLO_TURNS = MUGELLO_CIRCUIT.turns;
const MUGELLO_MAIN_STRAIGHT_M = MUGELLO_CIRCUIT.mainStraightKm * 1000;

/** Corner names with Mugello GP numbering (official). */
const MUGELLO_CORNERS: { tag: string; name: string; pos: number }[] = [
  { tag: 'T1',  name: 'San Donato',     pos: 0.06 },
  { tag: 'T2',  name: 'Luco',           pos: 0.16 },
  { tag: 'T3',  name: 'Poggio Secco',   pos: 0.25 },
  { tag: 'T4',  name: 'Biondetti 1',    pos: 0.32 },
  { tag: 'T5',  name: 'Biondetti 2',    pos: 0.38 },
  { tag: 'T6',  name: 'Casanova',       pos: 0.46 },
  { tag: 'T7',  name: 'Savelli',        pos: 0.53 },
  { tag: 'T8',  name: 'Arrabbiata 1',   pos: 0.60 },
  { tag: 'T9',  name: 'Arrabbiata 2',   pos: 0.66 },
  { tag: 'T10', name: 'Scarperia',      pos: 0.73 },
  { tag: 'T11', name: 'Palagio 1',      pos: 0.80 },
  { tag: 'T12', name: 'Palagio 2',      pos: 0.86 },
];

/** Track zones for phase context. */
function zoneForPos(pos: number): { zone: string; phase: string } {
  if (pos < 0.05) return { zone: 'Main straight', phase: 'Full throttle' };
  if (pos < 0.10) return { zone: 'T1 San Donato approach', phase: 'Initial braking' };
  if (pos < 0.14) return { zone: 'T1 San Donato', phase: 'Corner entry → apex' };
  if (pos < 0.20) return { zone: 'T2 Luco', phase: 'Exit acceleration' };
  if (pos < 0.28) return { zone: 'T3 Poggio Secco', phase: 'Mid-corner' };
  if (pos < 0.35) return { zone: 'T4 Biondetti 1', phase: 'Corner entry' };
  if (pos < 0.42) return { zone: 'T5 Biondetti 2', phase: 'Apex hold' };
  if (pos < 0.49) return { zone: 'T6 Casanova', phase: 'Braking → turn-in' };
  if (pos < 0.56) return { zone: 'T7 Savelli', phase: 'Exit throttle pickup' };
  if (pos < 0.63) return { zone: 'T8 Arrabbiata 1', phase: 'High-speed entry' };
  if (pos < 0.69) return { zone: 'T9 Arrabbiata 2', phase: 'Apex → exit' };
  if (pos < 0.76) return { zone: 'T10 Scarperia', phase: 'Trail braking' };
  if (pos < 0.83) return { zone: 'T11 Palagio 1', phase: 'Corner entry' };
  if (pos < 0.89) return { zone: 'T12 Palagio 2', phase: 'Exit drive' };
  return { zone: 'Main straight', phase: 'Full throttle' };
}

/** Find the next critical corner ahead. */
function nextCorner(pos: number): { tag: string; name: string; distance: string } {
  for (const c of MUGELLO_CORNERS) {
    if (c.pos > pos + 0.02) {
      const pctAway = Math.round((c.pos - pos) * 100);
      return { tag: c.tag, name: c.name, distance: `${pctAway}% of lap` };
    }
  }
  return { tag: 'T1', name: 'San Donato', distance: 'next lap' };
}

// ── Grip/health from tyre temp ──────────────────────────────────────────────

function tyreGripPct(temp: number): number {
  if (temp > 118) return Math.max(60, 100 - (temp - 100) * 1.8);
  if (temp > 110) return Math.max(75, 100 - (temp - 100) * 1.2);
  return 85 + (100 - temp) * 0.3;
}

function tyreWearPct(age: number): number {
  // MotoGP soft tyre: ~22 lap life, ~4.5% wear/lap
  return Math.min(100, Math.round(age * 4.5));
}

function degradationPerLap(age: number): number {
  if (age < 4) return 0.6;
  if (age < 10) return 0.9;
  return 1.3 + (age - 10) * 0.08;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function fmtLap(s: number): string {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(1).padStart(4, '0');
  return `${m}:${sec}`;
}

function parseGapValue(gapStr: string): number {
  if (gapStr === 'leader') return 0;
  const num = parseFloat(gapStr.replace(/[+\-–]/g, ''));
  return isNaN(num) ? 0 : num;
}

function Big({ label, value, unit, color }: { label: string; value: string | number; unit?: string; color?: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: 'clamp(28px, 4vw, 46px)', lineHeight: 1, color: color ?? 'var(--text)', fontVariantNumeric: 'tabular-nums' }}>
        {value}<span style={{ fontSize: '0.4em', color: 'var(--text-muted)', marginLeft: 2 }}>{unit}</span>
      </div>
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.14em', color: 'var(--text-muted)', marginTop: 6 }}>{label}</div>
    </div>
  );
}

function Bar({ label, pct, color, sub }: { label: string; pct: number; color: string; sub?: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11, marginBottom: 4 }}>
        <span style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{pct.toFixed(0)}%</span>
      </div>
      <div style={{ height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.07)' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: color, transition: 'width 0.1s linear' }} />
      </div>
      {sub && <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', marginTop: 3 }}>{sub}</div>}
    </div>
  );
}

// ── Mini Mugello track map ──────────────────────────────────────────────────

function MiniTrackMap({ trackPos, anomalyFlag }: { trackPos: number; anomalyFlag: boolean }) {
  // Simplified Mugello shape (matching OverviewPage's MUGELLO_PTS but smaller)
  const PTS: [number, number][] = [
    [30,118],[55,120],[80,119],[105,117],[128,112],
    [147,104],[162,92],[172,78],[176,62],[175,46],
    [168,32],[156,22],[140,16],[122,14],[104,16],
    [86,22],[70,32],[58,46],[50,62],[46,80],
    [44,98],[38,114],[30,118],
  ];

  function interpolate(pts: [number, number][], frac: number): [number, number] {
    const norm = ((frac % 1) + 1) % 1;
    const dists: number[] = [0];
    for (let i = 1; i < pts.length; i++) {
      const dx = pts[i][0] - pts[i - 1][0];
      const dy = pts[i][1] - pts[i - 1][1];
      dists.push(dists[i - 1] + Math.sqrt(dx * dx + dy * dy));
    }
    const total = dists[dists.length - 1];
    const target = norm * total;
    let seg = 0;
    while (seg < dists.length - 2 && dists[seg + 1] < target) seg++;
    const t0 = dists[seg + 1] === dists[seg] ? 0 : (target - dists[seg]) / (dists[seg + 1] - dists[seg]);
    return [pts[seg][0] + t0 * (pts[seg + 1][0] - pts[seg][0]), pts[seg][1] + t0 * (pts[seg + 1][1] - pts[seg][1])];
  }

  const polyStr = PTS.map(p => `${p[0]},${p[1]}`).join(' ');
  const [kx, ky] = interpolate(PTS, trackPos);

  return (
    <svg width="100%" height="120" viewBox="0 0 200 130" preserveAspectRatio="xMidYMid meet">
      <polyline points={polyStr} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={polyStr} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      {/* KDD #47 */}
      <circle cx={kx} cy={ky} r="4.5" fill={anomalyFlag ? 'var(--orange)' : 'var(--accent)'}
        stroke="white" strokeWidth="1.5"
        style={{ filter: anomalyFlag ? 'drop-shadow(0 0 6px var(--orange))' : 'drop-shadow(0 0 4px var(--accent))' }} />
      <text x={kx + 7} y={ky + 3} fill="white" fontSize="7" fontWeight="700" fontFamily="JetBrains Mono,monospace">#47</text>
    </svg>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────

export function TrackLivePage() {
  const session = useSessionContext();
  const t = useLiveTelemetry();
  const sessionState = sessionDisplayState(t.lapCount);
  const rearTemp = Math.round((t.tireRearLeft + t.tireRearRight) / 2);
  // Alternate corner side for the lean HUD
  const leanSide = Math.sin(t.trackPos * Math.PI * 2 * 3) >= 0 ? 1 : -1;
  const sectorDelta = 0.183 * Math.sin(t.trackPos * 6.28) + 0.12 * Math.sin(t.trackPos * 13);
  const deltaPos = sectorDelta >= 0;

  // ── Alerts ──────────────────────────────────────────────────────────────
  const tyreOverheating = rearTemp > 116;
  const safetyAlert = t.leanAngle > 58;
  const anomalyAlert = t.lapAnomaly;

  // ── Gaps ────────────────────────────────────────────────────────────────
  const gapToLeader = parseGapValue(t.gap);
  // In P3: gap to P2 is ~40-60% of gap to leader (estimate)
  const gapToP2 = Math.max(0, gapToLeader * (0.4 + Math.sin(t.trackPos * 5) * 0.15));

  // ── Tyre data ───────────────────────────────────────────────────────────
  const gripPct = tyreGripPct(rearTemp);
  const wearPct = tyreWearPct(t.rearTyreAge);
  const degPerLap = degradationPerLap(t.rearTyreAge);
  const thermalRisk = tyreOverheating ? 'HIGH' : rearTemp > 108 ? 'MEDIUM' : 'LOW';

  // ── Current zone & phase ────────────────────────────────────────────────
  const { zone, phase } = zoneForPos(t.trackPos);
  const next = nextCorner(t.trackPos);

  // ── Rider Coach corner context ──────────────────────────────────────────
  // The coach focus is on T7 Savelli (the critical corner); show which corner
  // corresponds to the current track position.
  const nearestCorner = MUGELLO_CORNERS.reduce((prev, curr) =>
    Math.abs(curr.pos - t.trackPos) < Math.abs(prev.pos - t.trackPos) ? curr : prev
  );

  return (
    <div className="page">

      {/* ═══════════ RACE HEADER ══════════════════════════════════════════ */}
      <div style={{
        marginBottom: 16, padding: '14px 18px', borderRadius: 10,
        background: 'linear-gradient(135deg, rgba(224,55,55,0.12), rgba(0,0,0,0.3))',
        border: '1px solid rgba(224,55,55,0.25)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8,
      }}>
        <div>
          <div style={{ fontSize: 10, letterSpacing: '0.15em', color: 'var(--accent)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 2 }}>
            {sessionState.badgeLabel} · GP Mugello · Italy
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            Round 7/20 · 2026 · {MUGELLO_TRACK_KM} km · {MUGELLO_TURNS} turns
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 800, fontSize: 18, color: 'var(--text)' }}>
            {sessionState.lapValue}
          </div>
          <div style={{ display: 'flex', gap: 6, marginTop: 4, justifyContent: 'flex-end' }}>
            <span className={`badge ${sessionState.badgeClass}`} style={{ fontSize: 9 }}>{sessionState.badgeLabel}</span>
            {t.session === 'test' && <span className="badge badge-yellow" style={{ fontSize: 9 }}>TEST</span>}
            {anomalyAlert && <span className="badge badge-orange" style={{ fontSize: 9 }}>ANOMALY</span>}
          </div>
        </div>
      </div>

      {/* ═══════════ TRACK-LIVE TITLE ═════════════════════════════════════ */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Track-Live</h1>
          <p className="page-subtitle">
            {session.ctx.circuitName} · {sessionState.activeRace ? `Race Lap ${t.lapCount}/${RACE_LAPS}` : 'Pre-race/test telemetry'} · {session.ctx.sessionMode === 'trackday' ? `${session.ctx.setup.rider ?? 'rider'} · ${session.ctx.setup.bike ?? 'bike'} · ${session.ctx.setup.stint ?? 'stint'}` : 'live pit-wall view'}
            <span style={{ fontSize: 10, color: 'var(--text-dim)', marginLeft: 8 }}>
              · {MUGELLO_TRACK_KM} km · Main straight {MUGELLO_MAIN_STRAIGHT_M} m · procedural map
            </span>
          </p>
        </div>
        <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Radio size={12} /> LIVE · 10 Hz
        </span>
      </div>

      {/* ═══════════ ALERT BANNERS — contextual ═════════════════════════ */}
      {(tyreOverheating || safetyAlert || anomalyAlert) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {tyreOverheating && (
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10,
              padding: '12px 16px', borderRadius: 8,
              background: 'var(--accent-dim)', border: '1px solid var(--accent)',
            }}>
              <AlertTriangle size={18} style={{ color: 'var(--accent)', flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <div style={{ color: 'var(--accent)', fontWeight: 800, fontSize: 13, marginBottom: 2 }}>
                  RED ALERT · Rear tyre overheating ({rearTemp}°C · {t.rearCompound})
                </div>
                <div style={{ color: 'rgba(224,55,55,0.8)', fontSize: 11, lineHeight: 1.5 }}>
                  Affected: Rear tyre right shoulder · High load through Arrabbiata 1/2 exit
                </div>
                <div style={{ color: 'rgba(224,55,55,0.8)', fontSize: 11, lineHeight: 1.5 }}>
                  Action: Protect rear for 2 laps · Avoid aggressive TC reduction · Delay attack until temp &lt; 114°C
                </div>
              </div>
            </div>
          )}
          {anomalyAlert && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 8,
              background: 'rgba(249,115,22,0.12)', border: '1px solid var(--orange)',
              color: 'var(--orange)', fontWeight: 700,
            }}>
              <AlertTriangle size={16} /> LAP ANOMALY · Lap {t.lapCount} flagged — check telemetry for off-track or traffic
            </div>
          )}
          {safetyAlert && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 14px', borderRadius: 8,
              background: 'var(--yellow-dim)', border: '1px solid var(--yellow)',
              color: 'var(--yellow)', fontWeight: 700,
            }}>
              <ShieldAlert size={16} /> CAUTION · High lean angle ({t.leanAngle.toFixed(0)}°) — crash-risk margin low
            </div>
          )}
        </div>
      )}

      {/* ═══════════ TRACK STATUS STRIP ══════════════════════════════════ */}
      <div className="card mb-4" style={{ padding: '10px 16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: sessionState.activeRace ? 'var(--green)' : 'var(--yellow)', display: 'inline-block' }} />
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: sessionState.activeRace ? 'var(--green)' : 'var(--yellow)' }}>{sessionState.flagLabel}</span>
            </div>
            <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{sessionState.activeRace ? 'All sectors clear · gap control active' : 'Pre-race/test stream · race timing not started'}</span>
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-dim)' }}>
            <Clock size={10} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 3 }} />
            {new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
      </div>

      {/* ═══════════ HERO: 3D bike + track map + lap/delta ══════════════ */}
      <div className="grid-3 mb-4" style={{ gap: 16, alignItems: 'stretch' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 18 }}>
          <Big label="CURRENT LAP TIME" value={fmtLap(t.lapTime)} />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />
          <Big label="SECTOR DELTA vs personal best" value={`${deltaPos ? '+' : ''}${sectorDelta.toFixed(3)}`} unit="s" color={deltaPos ? 'var(--accent)' : 'var(--green)'} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)', textAlign: 'center', marginTop: 2 }}>
            Current zone: {zone} · {phase}
          </div>
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <DigitalTwinViewer3D leanAngle={t.leanAngle} pitchAngle={t.brake * 0.08 - t.throttle * 0.04} height={300} />
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <TrackMap3D trackPos={t.trackPos} height={300} />
        </div>
      </div>

      {/* ═══════════ BIG NUMBERS STRIP — with explicit gap labels ═══════ */}
      <div className="card mb-4">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 10, padding: '6px 0' }}>
          <Big label="SPEED" value={t.speed} unit="km/h" color="var(--blue)" />
          <Big label="LEAN" value={t.leanAngle.toFixed(0)} unit="°" color="var(--purple)" />
          <Big label="GEAR" value={t.gear} />
          <Big label="RPM" value={(t.rpm / 1000).toFixed(1)} unit="k" />
          <Big label="POS" value={`P${t.position}`} color="var(--accent)" />
          <Big label="GAP to P2" value={`+${gapToP2.toFixed(3)}`} unit="s" color="var(--yellow)" />
          <Big label="GAP to leader" value={t.gap === 'leader' ? 'LEADER' : t.gap.includes('–') ? t.gap : `${t.gap}s`} color="var(--orange)" />
        </div>
      </div>

      {/* ═══════════ MAIN CONTENT GRID ══════════════════════════════════ */}
      <div className="grid-2 mb-4" style={{ gap: 16 }}>

        {/* LEFT: Lean Angle HUD + Throttle/Brake + Tyre status */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Lean Angle HUD */}
          <LeanAngleHUD lean={t.leanAngle * leanSide} phase={phase} rearTemp={rearTemp} />

          {/* Throttle / Brake */}
          <div className="card">
            <div className="card-header">
              <span className="card-title">Throttle &amp; Brake</span>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-dim)' }}>{zone} · {phase}</span>
            </div>
            <div className="card-body" style={{ flexDirection: 'column', gap: 10 }}>
              <Bar
                label="THROTTLE"
                pct={t.throttle}
                color="var(--green)"
                sub={t.throttle > 80 ? 'Full/open' : t.throttle > 30 ? 'Partial lift' : 'Closed'}
              />
              <Bar
                label="BRAKE"
                pct={t.brake}
                color="var(--accent)"
                sub={t.brake > 50 ? 'Heavy braking' : t.brake > 10 ? 'Initial pressure' : 'Trailing'}
              />
              <div style={{
                marginTop: 4, padding: '6px 8px', borderRadius: 6,
                background: 'rgba(255,255,255,0.03)', fontSize: 10, color: 'var(--text-dim)',
                fontFamily: 'var(--font-mono)', display: 'flex', gap: 12,
              }}>
                <span>Phase: <strong style={{ color: 'var(--text-muted)' }}>{phase}</strong></span>
                <span>Next: <strong style={{ color: 'var(--text)' }}>{next.tag} {next.name}</strong> ({next.distance})</span>
              </div>
            </div>
          </div>

          {/* Rear Tyre — detailed */}
          <div className="card" style={{ borderColor: tyreOverheating ? 'color-mix(in srgb, var(--accent) 30%, transparent)' : undefined }}>
            <div className="card-header">
              <span className="card-title flex items-center gap-2">
                <Thermometer size={14} style={{ color: tyreOverheating ? 'var(--accent)' : 'var(--text-muted)' }} />
                Rear Tyre
              </span>
              <span className={`badge ${tyreOverheating ? 'badge-red' : 'badge-orange'}`}>
                {t.rearCompound} · Lap {t.rearTyreAge}
              </span>
            </div>
            <div className="card-body" style={{ flexDirection: 'column', gap: 8 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                <div className="stat-tile">
                  <div className="stat-tile__label">Temperature</div>
                  <span className="stat-tile__value" style={{ fontSize: 18, color: tyreOverheating ? 'var(--accent)' : 'var(--text)' }}>
                    {rearTemp}°<span style={{ fontSize: 11, color: 'var(--text-muted)' }}> surface</span>
                  </span>
                </div>
                <div className="stat-tile">
                  <div className="stat-tile__label">Grip</div>
                  <span className="stat-tile__value" style={{ fontSize: 18, color: gripPct > 85 ? 'var(--green)' : gripPct > 70 ? 'var(--yellow)' : 'var(--accent)' }}>
                    {gripPct.toFixed(0)}%
                  </span>
                </div>
                <div className="stat-tile">
                  <div className="stat-tile__label">Wear</div>
                  <span className="stat-tile__value" style={{ fontSize: 18, color: wearPct > 60 ? 'var(--yellow)' : 'var(--text)' }}>
                    {wearPct}%
                  </span>
                </div>
                <div className="stat-tile">
                  <div className="stat-tile__label">Degradation</div>
                  <span className="stat-tile__value" style={{ fontSize: 18, color: degPerLap > 1.2 ? 'var(--accent)' : 'var(--text)' }}>
                    +{degPerLap.toFixed(1)}<span style={{ fontSize: 11, color: 'var(--text-muted)' }}>%/lap</span>
                  </span>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>
                <span>Thermal risk: <strong style={{ color: thermalRisk === 'HIGH' ? 'var(--accent)' : thermalRisk === 'MEDIUM' ? 'var(--yellow)' : 'var(--green)' }}>{thermalRisk}</strong></span>
                <span>· Deg: +{degPerLap.toFixed(1)}%/lap</span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Track Map + Rider Coach */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Mini Mugello Track Map */}
          <div className="card">
            <div className="card-header">
              <span className="card-title flex items-center gap-2">
                <Map size={14} style={{ color: 'var(--blue)' }} />
                Mugello Track
              </span>
              <span className="badge badge-muted" style={{ fontFamily: 'JetBrains Mono,monospace' }}>
                {Math.round(t.trackPos * 100)}% lap
              </span>
            </div>
            <div className="card-body" style={{ flexDirection: 'column', gap: 6 }}>
              <MiniTrackMap trackPos={t.trackPos} anomalyFlag={t.lapAnomaly} />
              <div style={{ fontSize: 10, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', display: 'flex', justifyContent: 'space-between' }}>
                <span>Current: <strong style={{ color: 'var(--text)' }}>{zone}</strong></span>
                <span>Next: <strong style={{ color: 'var(--accent)' }}>{next.tag} {next.name}</strong></span>
              </div>
              <div style={{ fontSize: 9, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)', textAlign: 'center' }}>
                Coach focus: T7 Savelli exit · Arrabbiata 1/2 high-load zone
              </div>
            </div>
          </div>

          {/* Rider Coach AI — with Mugello corner context */}
          <RiderCoachInsight cornerName={`${nearestCorner.tag} ${nearestCorner.name}`} />
        </div>
      </div>
    </div>
  );
}
