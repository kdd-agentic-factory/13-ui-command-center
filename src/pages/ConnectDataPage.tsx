import { useState } from 'react';
import { Satellite, Gauge, Cpu, HardDrive, Video, Smartphone, UploadCloud, Check, Plus, ArrowRight, FileText } from 'lucide-react';
import { useNavigate } from '../context/NavContext';
import { useToast } from '../components/ToastProvider';
import { MUGELLO_CIRCUIT } from '../domain/sessionTruth';

/**
 * Connect your bike data (engineer feedback #16) â€” makes it unambiguous where the
 * telemetry comes from and how to bring your own: upload files, sync GPS/IMU
 * traces or connect supported dataloggers. Answers "is this real / where's the
 * data from?" and leads into the tangible output (Session Report).
 */

type SourceState = 'connected' | 'available';

interface Source {
  icon: React.ElementType;
  name: string;
  detail: string;
  feeds: string;
  state: SourceState;
}

const SOURCES: Source[] = [
  { icon: Satellite, name: 'GPS', detail: '2027 open feed Â· 10 Hz', feeds: 'Position Â· racing line Â· sector splits', state: 'connected' },
  { icon: Gauge, name: 'IMU', detail: '6-axis Â· lean / accel / gyro', feeds: 'Lean angle Â· pitch Â· g-forces', state: 'connected' },
  { icon: Cpu, name: 'OBD / ECU', detail: 'CAN bus', feeds: 'RPM Â· throttle Â· gear Â· engine maps', state: 'connected' },
  { icon: HardDrive, name: '2D / AiM datalogger', detail: '.drk / .xrk', feeds: 'Full session channels', state: 'available' },
  { icon: Video, name: 'Onboard video', detail: 'GoPro Â· synced overlay', feeds: 'Lap replay overlay', state: 'available' },
  { icon: Smartphone, name: 'Mobile app', detail: 'phone GPS + IMU', feeds: 'Track-day quick capture', state: 'available' },
];

export function ConnectDataPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [file, setFile] = useState<string | null>(null);
  const [stage, setStage] = useState<'idle' | 'parsing' | 'ready'>('idle');

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f.name);
    setStage('parsing');
    setTimeout(() => setStage('ready'), 1400);
  }

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Connect your bike data</h1>
          <p className="page-subtitle">Upload telemetry files, sync GPS/IMU traces or connect supported dataloggers â€” KDD turns them into faster, safer laps.</p>
        </div>
        <span className="badge badge-green">3 sources connected</span>
      </div>

      {/* Upload dropzone */}
      <div className="card mb-4">
        <label
          htmlFor="telemetry-upload"
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            gap: 10, padding: '34px 20px', borderRadius: 'var(--radius-lg)', cursor: 'pointer',
            border: '1.5px dashed color-mix(in srgb, var(--accent) 45%, transparent)',
            background: stage === 'ready' ? 'var(--green-dim)' : 'rgba(255,255,255,0.02)',
            textAlign: 'center', transition: 'background 0.2s',
          }}
        >
          {stage === 'idle' && <>
            <UploadCloud size={34} style={{ color: 'var(--accent)' }} />
            <div style={{ fontSize: 15, fontWeight: 700 }}>Drop a telemetry file or click to upload</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>.csv Â· .xrk (AiM) Â· .drk (2D) Â· GPX</div>
          </>}
          {stage === 'parsing' && <>
            <div className="spinner" style={{ width: 30, height: 30, border: '3px solid rgba(255,255,255,0.15)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
            <div style={{ fontSize: 14, fontWeight: 700 }}>Parsing {file}â€¦</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)', fontFamily: 'var(--font-mono)' }}>decoding channels Â· detecting laps Â· aligning GPS</div>
          </>}
          {stage === 'ready' && <>
            <Check size={34} style={{ color: 'var(--green)' }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--green)' }}>{file} ready Â· {MUGELLO_CIRCUIT.raceLaps} laps Â· 142 channels</div>
            <div style={{ fontSize: 12, color: 'var(--text-dim)' }}>Best lap 1:57.842 detected â€” open the Session Report to analyse it.</div>
          </>}
          <input id="telemetry-upload" type="file" accept=".csv,.xrk,.drk,.gpx" style={{ display: 'none' }} onChange={onPick} />
        </label>
        {stage === 'ready' && (
          <div style={{ display: 'flex', gap: 8, marginTop: 12, justifyContent: 'center' }}>
            <button className="btn btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }} onClick={() => navigate('report')}><FileText size={12} /> Open Session Report</button>
            <button className="btn btn-ghost btn-sm" onClick={() => { setFile(null); setStage('idle'); }}>Upload another</button>
          </div>
        )}
      </div>

      {/* Source connectors */}
      <div className="grid-2" style={{ gap: 12 }}>
        {SOURCES.map(s => {
          const I = s.icon;
          const on = s.state === 'connected';
          return (
            <div key={s.name} className="card" style={{ borderColor: on ? 'color-mix(in srgb, var(--green) 30%, transparent)' : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 'var(--radius-lg)', flex: 'none', display: 'grid', placeItems: 'center', color: on ? 'var(--green)' : 'var(--blue)', background: on ? 'var(--green-dim)' : 'var(--blue-dim)', border: `1px solid ${on ? 'color-mix(in srgb, var(--green) 35%, transparent)' : 'color-mix(in srgb, var(--blue) 30%, transparent)'}` }}>
                  <I size={19} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                    {s.name}
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.06em', color: 'var(--text-muted)' }}>{s.detail}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-dim)', marginTop: 2 }}>{s.feeds}</div>
                </div>
                {on ? (
                  <span className="badge badge-green" style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Check size={11} /> Connected</span>
                ) : (
                  <button className="btn btn-ghost btn-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}
                    onClick={() => toast({ type: 'success', title: `${s.name} connected`, message: `Now ingesting ${s.feeds.toLowerCase()}.` })}><Plus size={12} /> Connect</button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* What you get */}
      <div className="card mt-4" style={{ marginTop: 16, background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(255,255,255,0.02))' }}>
        <div className="card-header"><span className="card-title">What you get back</span></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', fontSize: 13, color: 'var(--text-dim)', marginTop: 6 }}>
          {['Corner-by-corner analysis', 'Lap Replay', 'Tyre & setup advice', 'Safety alerts', 'Session Report (PDF)'].map((x, i) => (
            <span key={x} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {i > 0 && <ArrowRight size={12} style={{ color: 'var(--text-muted)' }} />}
              <span style={{ color: 'var(--text)' }}>{x}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
