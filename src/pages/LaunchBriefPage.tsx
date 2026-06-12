/**
 * LaunchBriefPage — final gate screen (Circuit → Mode → Data → LAUNCH).
 * The pre-flight summary: circuit, mode, rider, data, active modules and
 * Oracle status, then a single Launch action. Total-control feeling before
 * the digital pit-wall opens.
 */
import { ArrowLeft, Rocket, Bot, CheckCircle2 } from 'lucide-react';
import { GateProgress } from '../components/GateProgress';
import type { SessionContext } from '../domain/sessionContext';
import { hiddenTabsForMode, MODULE_LABELS } from '../domain/sessionContext';
import type { CircuitRecord } from '../domain/circuits';
import { STATUS_META } from '../domain/circuits';
import type { TabId } from '../context/AuthContext';

interface Props {
  circuit: CircuitRecord;
  ctx: SessionContext;
  onBack: () => void;
  onLaunch: () => void;
}

const MONO = 'JetBrains Mono, monospace';

export function LaunchBriefPage({ circuit, ctx, onBack, onLaunch }: Props) {
  const hidden = new Set(hiddenTabsForMode(ctx.sessionMode));
  const activeModules = (Object.keys(MODULE_LABELS) as TabId[])
    .filter(id => !hidden.has(id))
    .map(id => MODULE_LABELS[id]!);

  const facts: Array<[string, string]> = [
    ['Circuit', `${circuit.name} ${circuit.layout} Layout · ${circuit.status}`],
    ['Mode', `${ctx.sessionMode} · ${ctx.dashboardProfile.replace(/_/g, ' ')}`],
    ['Rider', ctx.setup.rider ?? 'Rubén Juárez'],
    ['Bike', ctx.setup.bike ?? 'Yamaha R1'],
    ['Data', ctx.setup.dataSource === 'upload' ? 'Uploaded session files'
      : ctx.setup.dataSource === 'demo' ? 'Demo sample (reproducible)'
        : ctx.setup.dataSource === 'simulation' ? 'Simulation only'
          : 'GPS · IMU · ECU · live 10 Hz'],
  ];

  return (
    <div className="cockpit-bg" style={{ position: 'fixed', inset: 0, overflowY: 'auto', zIndex: 50 }}>
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '36px 24px 60px' }} className="gate-enter">
        <GateProgress step={3} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
            <ArrowLeft size={13} /> Data
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '0.04em', color: 'var(--text)', margin: 0 }}>
            READY TO OPEN DIGITAL PIT-WALL
          </h1>
        </div>

        <div className="card" style={{ padding: 22 }}>
          {/* Facts */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px', marginBottom: 18 }}>
            {facts.map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{k}</div>
                <div style={{ fontSize: 13.5, fontFamily: MONO, fontWeight: 700, color: 'var(--text)' }}>{v}</div>
              </div>
            ))}
            <div>
              <div style={{ fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Session badge</div>
              <div style={{ fontSize: 13.5, fontFamily: MONO, fontWeight: 700, color: ctx.badgeColor }}>{ctx.badge}</div>
            </div>
            <div>
              <div style={{ fontSize: 9.5, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Circuit confidence</div>
              <div style={{ fontSize: 13.5, fontFamily: MONO, fontWeight: 700, color: STATUS_META[circuit.status].color }}>
                {Math.round(circuit.agentConfidence * 100)}%
              </div>
            </div>
          </div>

          {/* Active modules */}
          <div style={{ fontSize: 10, fontFamily: MONO, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
            Active modules
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 18 }}>
            {activeModules.map(m => (
              <span key={m} style={{ display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 10.5, fontFamily: MONO, color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 6, padding: '4px 9px', background: 'rgba(255,255,255,0.03)' }}>
                <CheckCircle2 size={10} style={{ color: 'var(--green)' }} />{m}
              </span>
            ))}
          </div>

          {/* Oracle status + launch */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 11, fontFamily: MONO, color: '#8B5CF6' }}>
              <Bot size={13} /> Oracle status: Ready
            </span>
            <button className="btn-primary" onClick={onLaunch}
              style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', fontSize: 13 }}>
              <Rocket size={15} /> Launch Digital Pit-Wall
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
