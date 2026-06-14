/**
 * GarageProfileGatePage — GARAGE PROFILE GATE (step 2 of the entry flow:
 * Circuit → GARAGE → Mode → Data → Launch).
 *
 * Picks the concrete rider + bike + setup + tyres the session will work on,
 * and shows the rider+bike+circuit readiness (FULL/PARTIAL/GENERIC/NEW/
 * GPS-ONLY) BEFORE the dashboard opens — so every module downstream knows
 * whose lap, on which machine, it is interpreting.
 */
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  User, Bike, Gauge, Circle, ArrowLeft, ChevronRight, CheckCircle2, AlertTriangle, ShieldCheck,
} from 'lucide-react';
import { GateProgress } from '../components/GateProgress';
import type { CircuitRecord } from '../domain/circuits';
import {
  RIDERS, BIKES, RiderProfile, BikeProfile, buildGarageProfile, GarageProfile,
  READINESS_META, setGarageProfile,
} from '../domain/garageProfile';

interface Props {
  circuit: CircuitRecord;
  onBack: () => void;
  onContinue: (profile: GarageProfile) => void;
}

const MONO = 'JetBrains Mono, monospace';
const CARD: React.CSSProperties = { background: 'rgba(255,255,255,0.035)', border: '1px solid rgba(255,255,255,0.09)', borderRadius: 12 };
const LABEL: React.CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.12em', color: 'var(--text-muted)', textTransform: 'uppercase' };

function PickRow<T extends { id: string }>({ items, sel, onSel, render }: {
  items: T[]; sel: string; onSel: (id: string) => void; render: (it: T) => React.ReactNode;
}) {
  return (
    <div style={{ display: 'grid', gap: 6 }}>
      {items.map(it => {
        const on = it.id === sel;
        return (
          <button key={it.id} onClick={() => onSel(it.id)}
            style={{
              textAlign: 'left', cursor: 'pointer', padding: '9px 11px', borderRadius: 9,
              background: on ? 'rgba(0,183,255,0.08)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${on ? 'var(--cyan)' : 'var(--border)'}`,
            }}>
            {render(it)}
          </button>
        );
      })}
    </div>
  );
}

export function GarageProfileGatePage({ circuit, onBack, onContinue }: Props) {
  const { t } = useTranslation();
  const [riderId, setRiderId] = useState(RIDERS[0].id);
  const [bikeId, setBikeId] = useState(BIKES[0].id);

  const rider = RIDERS.find(r => r.id === riderId)!;
  const bike = BIKES.find(b => b.id === bikeId)!;
  const profile = useMemo(() => buildGarageProfile(rider, bike, circuit.id), [rider, bike, circuit.id]);
  const meta = READINESS_META[profile.status];

  function go() { setGarageProfile(profile); onContinue(profile); }

  return (
    <div className="cockpit-bg" style={{ position: 'fixed', inset: 0, overflowY: 'auto', zIndex: 50 }}>
      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '32px 24px 60px' }} className="gate-enter">
        <GateProgress step={1} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
            <ArrowLeft size={13} /> Circuit
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '0.04em', color: 'var(--text)', margin: 0 }}>GARAGE PROFILE GATE</h1>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
          {t('gates.garageSubtitle', 'Configure rider, bike, setup and tyres before opening the digital pit-box — KDD interprets a concrete combination, not a generic lap.')} · {circuit.name} {circuit.layout}
        </div>

        {/* Rider · Bike · Readiness */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginBottom: 14 }}>
          {/* Rider */}
          <div style={{ ...CARD, padding: 16 }}>
            <div style={{ ...LABEL, marginBottom: 10 }}><User size={11} style={{ verticalAlign: -2, marginRight: 5 }} />Rider</div>
            <PickRow items={RIDERS} sel={riderId} onSel={setRiderId} render={(r: RiderProfile) => (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{r.name}</span>
                  {r.hasStyleDNA && <span style={{ fontSize: 8.5, fontFamily: MONO, color: '#A78BFA' }}>DNA</span>}
                </div>
                <div style={{ fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 2 }}>{r.archetype}</div>
                <div style={{ fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)' }}>consistency {r.consistency}% · risk {r.riskTendency}</div>
              </>
            )} />
          </div>

          {/* Bike */}
          <div style={{ ...CARD, padding: 16 }}>
            <div style={{ ...LABEL, marginBottom: 10 }}><Bike size={11} style={{ verticalAlign: -2, marginRight: 5 }} />Bike</div>
            <PickRow items={BIKES} sel={bikeId} onSel={setBikeId} render={(b: BikeProfile) => (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)', flex: 1 }}>{b.brand} {b.model}</span>
                  <span style={{ fontSize: 8.5, fontFamily: MONO, color: b.telemetry === 'full' ? 'var(--green)' : 'var(--accent)' }}>
                    {b.telemetry === 'full' ? 'ECU·IMU·GPS' : 'GPS only'}
                  </span>
                </div>
                <div style={{ fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 2 }}>{b.category} · {b.engine}</div>
                <div style={{ fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)' }}>{b.hasSetupBaseline ? 'setup baseline ✓' : 'generic setup'}</div>
              </>
            )} />
          </div>

          {/* Readiness */}
          <div style={{ ...CARD, padding: 16, borderColor: meta.color }}>
            <div style={{ ...LABEL, marginBottom: 10 }}><ShieldCheck size={11} style={{ verticalAlign: -2, marginRight: 5 }} />Readiness</div>
            <div style={{ fontSize: 32, fontFamily: MONO, fontWeight: 800, color: meta.color }}>{profile.compatibility}%</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: meta.color, margin: '2px 0 6px' }}>{profile.status}</div>
            <div style={{ fontSize: 10.5, color: 'var(--text-muted)', marginBottom: 8 }}>{meta.label}</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              {[
                ['Rider + Bike + Circuit', `${profile.sessionsKnown} known session${profile.sessionsKnown === 1 ? '' : 's'}`],
                ['Telemetry mapping', bike.telemetry === 'full' ? 'OK' : 'GPS only'],
                ['Setup baseline', profile.setup.available ? 'Available' : 'Generic'],
                ['Rider Style DNA', rider.hasStyleDNA ? 'Available' : 'Not yet'],
              ].map(([k, v]) => (
                <div key={k} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontFamily: MONO }}>
                  <span style={{ color: 'var(--text-muted)' }}>{k}</span><span style={{ color: 'var(--text)' }}>{v}</span>
                </div>
              ))}
            </div>
            {profile.reason && (
              <div style={{ marginTop: 8, fontSize: 10, color: meta.color, lineHeight: 1.5 }}>
                <AlertTriangle size={10} style={{ verticalAlign: -1, marginRight: 4 }} />{profile.reason}
              </div>
            )}
          </div>
        </div>

        {/* Setup + Tyres */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginBottom: 16 }}>
          <div style={{ ...CARD, padding: 16 }}>
            <div style={{ ...LABEL, marginBottom: 8 }}><Gauge size={11} style={{ verticalAlign: -2, marginRight: 5 }} />Setup baseline</div>
            <div style={{ fontSize: 12.5, fontWeight: 700, color: 'var(--text)' }}>{profile.setup.label}</div>
            <div style={{ display: 'flex', gap: 16, margin: '8px 0', fontSize: 11, fontFamily: MONO }}>
              <span><span style={{ color: 'var(--text-muted)' }}>TC </span>{profile.setup.tc}</span>
              <span><span style={{ color: 'var(--text-muted)' }}>EB </span>{profile.setup.engineBrake}</span>
              <span><span style={{ color: 'var(--text-muted)' }}>Map </span>{profile.setup.powerMap}</span>
              <span><span style={{ color: 'var(--text-muted)' }}>Rear reb </span>{profile.setup.rearRebound} clk</span>
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-muted)', lineHeight: 1.5 }}>{profile.setup.why}</div>
          </div>
          <div style={{ ...CARD, padding: 16 }}>
            <div style={{ ...LABEL, marginBottom: 8 }}><Circle size={11} style={{ verticalAlign: -2, marginRight: 5 }} />Tyres</div>
            <div style={{ display: 'flex', gap: 18, fontSize: 11.5, fontFamily: MONO, marginTop: 4 }}>
              <span><span style={{ color: 'var(--text-muted)' }}>Mfr </span>{profile.tyres.manufacturer}</span>
              <span><span style={{ color: 'var(--text-muted)' }}>Front </span>{profile.tyres.front}</span>
              <span><span style={{ color: 'var(--text-muted)' }}>Rear </span>{profile.tyres.rear}</span>
            </div>
            <div style={{ fontSize: 11, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 8 }}>
              Hot target {profile.tyres.hotFront.toFixed(2)} / {profile.tyres.hotRear.toFixed(2)} bar · thermal window loaded
            </div>
            <div style={{ fontSize: 10, color: 'var(--yellow)', marginTop: 8 }}>
              Rear soft may reach the thermal cliff after L13 if track temp exceeds 46°C.
            </div>
          </div>
        </div>

        {/* Context strip + continue */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span style={{ fontSize: 10, fontFamily: MONO, color: 'var(--text-muted)' }}>
            <CheckCircle2 size={10} style={{ verticalAlign: -1, marginRight: 4 }} />garage profile · {rider.name} · {bike.brand} {bike.model} · {profile.status}
          </span>
          <button className="btn-primary" onClick={go}
            style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, padding: '9px 18px' }}>
            <ChevronRight size={14} /> {t('gates.garageContinue', 'Continue to Session Mode')}
          </button>
        </div>
      </div>
    </div>
  );
}
