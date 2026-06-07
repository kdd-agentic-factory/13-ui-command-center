import { useLiveTelemetry } from '../hooks/useLiveTelemetry';
import { DigitalTwinViewer3D } from '../components/babylon/DigitalTwinViewer3D';
import { TrackMap3D } from '../components/babylon/TrackMap3D';
import { AlertTriangle, ShieldAlert, Radio } from 'lucide-react';

/**
 * Track-Live (engineer feedback #22) — the deliberately big, glanceable real-time
 * mode for the pit-wall screen: current lap, sector delta, speed, lean, throttle,
 * brake, plus tyre and safety alerts (colour + label, never colour alone — WCAG).
 * Less dense than the analytical Overview; readable across the garage.
 */

function fmtLap(s: number): string {
  const m = Math.floor(s / 60);
  const sec = (s % 60).toFixed(1).padStart(4, '0');
  return `${m}:${sec}`;
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

function Bar({ label, pct, color }: { label: string; pct: number; color: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'var(--font-mono)', fontSize: 11, marginBottom: 4 }}>
        <span style={{ color: 'var(--text-muted)', letterSpacing: '0.1em' }}>{label}</span>
        <span style={{ color, fontWeight: 700 }}>{pct.toFixed(0)}%</span>
      </div>
      <div style={{ height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.07)' }}>
        <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: color, transition: 'width 0.1s linear' }} />
      </div>
    </div>
  );
}

export function TrackLivePage() {
  const t = useLiveTelemetry();
  const rearTemp = Math.round((t.tireRearLeft + t.tireRearRight) / 2);
  const sectorDelta = 0.183 * Math.sin(t.trackPos * 6.28) + 0.12 * Math.sin(t.trackPos * 13);
  const deltaPos = sectorDelta >= 0;

  const tyreAlert = rearTemp > 116;
  const safetyAlert = t.leanAngle > 58;

  return (
    <div className="page">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="page-title">Track-Live</h1>
          <p className="page-subtitle">Jarama · Stint 03 · pit-wall live view</p>
        </div>
        <span className="badge badge-red" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
          <Radio size={12} /> LIVE · 10 Hz
        </span>
      </div>

      {/* Alert banners — colour + explicit label (WCAG) */}
      {(tyreAlert || safetyAlert) && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
          {tyreAlert && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'var(--accent-dim)', border: '1px solid var(--accent)', color: 'var(--accent)', fontWeight: 700 }}>
              <AlertTriangle size={16} /> RED ALERT · Rear tyre overheating ({rearTemp}°C)
            </div>
          )}
          {safetyAlert && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 8, background: 'var(--yellow-dim)', border: '1px solid var(--yellow)', color: 'var(--yellow)', fontWeight: 700 }}>
              <ShieldAlert size={16} /> CAUTION · High lean angle ({t.leanAngle.toFixed(0)}°) — crash-risk margin low
            </div>
          )}
        </div>
      )}

      {/* Hero: lap/delta + 3D bike + track map */}
      <div className="grid-3 mb-4" style={{ gap: 16, alignItems: 'stretch' }}>
        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 22 }}>
          <Big label="CURRENT LAP" value={fmtLap(t.lapTime)} />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.08)' }} />
          <Big label="SECTOR DELTA" value={`${deltaPos ? '+' : ''}${sectorDelta.toFixed(3)}`} unit="s" color={deltaPos ? 'var(--accent)' : 'var(--green)'} />
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <DigitalTwinViewer3D leanAngle={t.leanAngle} pitchAngle={t.brake * 0.08 - t.throttle * 0.04} height={300} />
        </div>
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <TrackMap3D trackPos={t.trackPos} height={300} />
        </div>
      </div>

      {/* Big numbers strip */}
      <div className="card mb-4">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: 10, padding: '6px 0' }}>
          <Big label="SPEED" value={t.speed} unit="km/h" color="var(--blue)" />
          <Big label="LEAN" value={t.leanAngle.toFixed(0)} unit="°" color="var(--purple)" />
          <Big label="GEAR" value={t.gear} />
          <Big label="RPM" value={(t.rpm / 1000).toFixed(1)} unit="k" />
          <Big label="POS" value={`P${t.position}`} color="var(--accent)" />
          <Big label="GAP" value={t.gap} color="var(--yellow)" />
        </div>
      </div>

      {/* Throttle / brake / grip */}
      <div className="grid-3" style={{ gap: 16 }}>
        <div className="card"><Bar label="THROTTLE" pct={t.throttle} color="var(--green)" /></div>
        <div className="card"><Bar label="BRAKE" pct={t.brake} color="var(--accent)" /></div>
        <div className="card">
          <Bar label="REAR TYRE" pct={Math.min(100, (rearTemp / 130) * 100)} color={rearTemp > 116 ? 'var(--accent)' : rearTemp > 90 ? 'var(--green)' : 'var(--blue)'} />
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>{rearTemp}°C · {t.rearCompound}</div>
        </div>
      </div>
    </div>
  );
}
