import { Thermometer, Gauge, Activity } from 'lucide-react';
import { DigitalTwinViewer3D, TireModel3D } from './babylon/lazy';
import { LeanAngleHUD } from './LeanAngleHUD';

/**
 * Race Overview "Motorbike Telemetry & Diagnostics" tab (Spec §3 / crew-chief):
 * the bike's vital signs — engine/oil/water temps, pressures, suspension — the
 * live Chassis Tool (3D lean/pitch/squat), and a detailed tyre thermal section.
 */
export interface BikeTelemetry {
  leanAngle: number;
  rpm: number;
  speed: number;
  gear: number;
  throttle: number;
  brake: number;
  brakePressureFront?: number;
  brakePressureRear?: number;
  frontCompound: 'SOFT' | 'MEDIUM' | 'HARD';
  rearCompound: 'SOFT' | 'MEDIUM' | 'HARD';
  tireFrontLeft: number;
  tireFrontRight: number;
  tireRearLeft: number;
  tireRearRight: number;
  tirePressureFront?: number;
  tirePressureRear?: number;
  tireWearFront?: number;
  tireWearRear?: number;
  rearTyreAge?: number;
}

function Stat({ label, value, unit, warn }: { label: string; value: string | number; unit?: string; warn?: boolean }) {
  return (
    <div className="stat-tile">
      <div className="stat-tile__label">{label}</div>
      <span className="stat-tile__value" style={{ fontSize: 20, color: warn ? 'var(--accent)' : undefined }}>
        {value}{unit && <span className="stat-tile__unit">{unit}</span>}
      </span>
    </div>
  );
}

export function MotorbikeDiagnostics({ t }: { t: BikeTelemetry }) {
  // Representative vitals derived from live telemetry (placeholders where the
  // backend channel isn't wired yet — the real values come from the 2D/AiM feed).
  const engineTemp = 92 + Math.round((t.rpm / 18000) * 18);
  const oilTemp = 105 + Math.round((t.rpm / 18000) * 15);
  const waterTemp = 88 + Math.round((t.throttle / 100) * 12);
  const frontPress = t.tirePressureFront ?? 1.9;
  const rearPress = t.tirePressureRear ?? 1.7;
  const frontBrake = t.brakePressureFront ?? t.brake;
  const rearBrake = t.brakePressureRear ?? Math.round(t.brake * 0.35);
  // Pitch attitude: front dives under braking, squats under acceleration.
  const pitch = t.brake * 0.08 - t.throttle * 0.04;

  return (
    <>
      {/* Chassis Tool — live 3D attitude */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title flex items-center gap-2">
            <Activity size={14} style={{ color: 'var(--accent)' }} /> Chassis Tool · Live 3D
          </span>
          <span className="badge badge-green" style={{ animation: 'pulse 2s infinite' }}>LIVE</span>
        </div>
        <DigitalTwinViewer3D leanAngle={t.leanAngle} pitchAngle={pitch} height={300} />
        <div className="grid-4" style={{ marginTop: 12 }}>
          <Stat label="Lean" value={Math.abs(t.leanAngle).toFixed(0)} unit="°" />
          <Stat label={pitch >= 0 ? 'Dive (brake)' : 'Squat (accel)'} value={Math.abs(pitch).toFixed(1)} unit="°" warn={pitch > 6} />
          <Stat label="Speed" value={t.speed.toFixed(0)} unit="km/h" />
          <Stat label="Gear" value={t.gear} />
        </div>
      </div>

      {/* Lean Angle HUD */}
      <div className="mb-4">
        <LeanAngleHUD lean={t.leanAngle} />
      </div>

      {/* Engine & fluids + pressures */}
      <div className="grid-2 mb-4">
        <div className="card">
          <div className="card-header"><span className="card-title flex items-center gap-2"><Thermometer size={14} style={{ color: 'var(--accent)' }} /> Engine & Fluids</span></div>
          <div className="grid-3" style={{ marginTop: 8 }}>
            <Stat label="Engine T°" value={engineTemp} unit="°C" warn={engineTemp > 112} />
            <Stat label="Oil T°" value={oilTemp} unit="°C" warn={oilTemp > 125} />
            <Stat label="Water T°" value={waterTemp} unit="°C" warn={waterTemp > 102} />
          </div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title flex items-center gap-2"><Gauge size={14} style={{ color: 'var(--accent)' }} /> Pressures & Brakes</span></div>
          <div className="grid-4" style={{ marginTop: 8 }}>
            <Stat label="F Press" value={frontPress.toFixed(2)} unit="bar" />
            <Stat label="R Press" value={rearPress.toFixed(2)} unit="bar" />
            <Stat label="F Brake" value={(frontBrake * 0.11).toFixed(1)} unit="bar" />
            <Stat label="R Brake" value={(rearBrake * 0.05).toFixed(1)} unit="bar" />
          </div>
        </div>
      </div>

      {/* Tyre thermal detail */}
      <div className="card">
        <div className="card-header">
          <span className="card-title flex items-center gap-2"><Thermometer size={14} style={{ color: 'var(--accent)' }} /> Tyre Thermal Detail</span>
          <span className="badge badge-yellow">Rear age {t.rearTyreAge ?? 0} laps</span>
        </div>
        <div className="grid-2" style={{ marginTop: 8 }}>
          <TireModel3D temperature={Math.round((t.tireFrontLeft + t.tireFrontRight) / 2)} compound={t.frontCompound} label="FRONT" height={170} />
          <TireModel3D temperature={Math.round((t.tireRearLeft + t.tireRearRight) / 2)} compound={t.rearCompound} label="REAR" height={170} />
        </div>
        <div className="grid-4" style={{ marginTop: 12 }}>
          <Stat label="Front wear" value={(t.tireWearFront ?? 0).toFixed(1)} unit="%" />
          <Stat label="Rear wear" value={(t.tireWearRear ?? 0).toFixed(1)} unit="%" warn={(t.tireWearRear ?? 0) > 55} />
          <Stat label="Front press" value={frontPress.toFixed(2)} unit="bar" />
          <Stat label="Rear press" value={rearPress.toFixed(2)} unit="bar" />
        </div>
      </div>
    </>
  );
}
