/**
 * DataSourceGatePage – step 3 of the entry workflow (Circuit → Mode → DATA →
 * Launch). Before opening the pit-wall the session declares where its data
 * comes from: live sources, uploaded files, demo samples or simulation only.
 * The choice lands in the context object as setup.dataSource.
 */
import { useState } from 'react';
import { ArrowLeft, ChevronRight, Wifi, Upload, PlayCircle, FlaskConical, CheckCircle2, XCircle } from 'lucide-react';
import { GateProgress } from '../components/GateProgress';
import type { SessionContext } from '../domain/sessionContext';

interface Props {
  ctx: SessionContext;
  onBack: () => void;
  onContinue: (dataSource: string) => void;
}

const MONO = 'JetBrains Mono, monospace';

const LIVE_SOURCES: Array<[string, boolean]> = [
  ['GPS', true], ['IMU', true], ['ECU', true], ['Logger', true], ['Tyre model', true], ['Video', false],
];
const IMPORT_FORMATS = ['AiM export', '2D datalogger', 'CSV', 'GPX', 'Video onboard'];

export function DataSourceGatePage({ ctx, onBack, onContinue }: Props) {
  // Demo and simulation modes pre-select their natural source.
  const initial = ctx.demoMode ? 'demo' : ctx.sessionMode === 'simulation' ? 'simulation' : 'live';
  const [choice, setChoice] = useState<'live' | 'upload' | 'demo' | 'simulation'>(initial);

  const OPTIONS = [
    { id: 'live' as const, icon: Wifi, label: 'Continue with live data', desc: 'GPS · IMU · ECU streaming at 10 Hz' },
    { id: 'upload' as const, icon: Upload, label: 'Upload session files', desc: IMPORT_FORMATS.join(' · ') },
    { id: 'demo' as const, icon: PlayCircle, label: 'Use demo data', desc: 'Reproducible scripted sample session' },
    { id: 'simulation' as const, icon: FlaskConical, label: 'Simulation only', desc: 'AI-generated baseline, no sensors' },
  ];

  return (
    <div className="cockpit-bg" style={{ position: 'fixed', inset: 0, overflowY: 'auto', zIndex: 50 }}>
      <div style={{ maxWidth: 920, margin: '0 auto', padding: '32px 24px 60px' }} className="gate-enter">
        <GateProgress step={3} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
          <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 11 }}>
            <ArrowLeft size={13} /> Mode
          </button>
          <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '0.04em', color: 'var(--text)', margin: 0 }}>DATA SOURCE SETUP</h1>
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 20 }}>
          {ctx.circuitName} · {ctx.sessionMode} – declare where this session's data comes from before the pit-wall opens.
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 18, alignItems: 'start' }}>
          {/* Choice cards */}
          <div style={{ display: 'grid', gap: 8 }}>
            {OPTIONS.map(o => {
              const on = choice === o.id;
              return (
                <button key={o.id} onClick={() => setChoice(o.id)}
                  style={{
                    display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left', cursor: 'pointer',
                    padding: '14px 16px', borderRadius: 'var(--radius-lg)',
                    background: on ? 'rgba(224,55,55,0.07)' : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${on ? 'rgba(224,55,55,0.4)' : 'var(--border)'}`,
                  }}>
                  <o.icon size={16} style={{ color: on ? 'var(--accent)' : 'var(--text-muted)', flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>{o.label}</div>
                    <div style={{ fontSize: 10.5, fontFamily: MONO, color: 'var(--text-muted)' }}>{o.desc}</div>
                  </div>
                </button>
              );
            })}
            <button className="btn-primary" onClick={() => onContinue(choice)}
              style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'center' }}>
              <ChevronRight size={14} /> Continue to Launch Brief
            </button>
          </div>

          {/* Live source status */}
          <div className="card" style={{ padding: 16 }}>
            <div style={{ fontSize: 10, fontFamily: MONO, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 8 }}>
              Live source status
            </div>
            {LIVE_SOURCES.map(([name, ok]) => (
              <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '4px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                {ok ? <CheckCircle2 size={12} style={{ color: 'var(--green)' }} /> : <XCircle size={12} style={{ color: 'var(--yellow)' }} />}
                <span style={{ fontSize: 11.5, color: 'var(--text)', flex: 1 }}>{name}</span>
                <span style={{ fontSize: 10, fontFamily: MONO, color: ok ? 'var(--green)' : 'var(--yellow)' }}>{ok ? 'OK' : 'not synced'}</span>
              </div>
            ))}
            <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 8 }}>
              Sources are negotiated by the Telemetry Alignment Agent at launch; missing channels degrade gracefully.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
