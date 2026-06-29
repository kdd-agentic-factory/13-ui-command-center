import { useMemo, useState } from 'react';
import { History, Trophy, TrendingDown, CloudSun, Droplets } from 'lucide-react';
import { getSessionContext } from '../domain/sessionContext';
import { getCircuitLibrary } from '../domain/circuits';

/**
 * Circuit History (engineer Phase 3 #2) – your evolution at a track over time:
 * best-lap progression across sessions, the personal record, the full session
 * log with conditions, and how weather correlates with pace.
 */

const CIRCUITS = getCircuitLibrary().map(c => c.name);

interface Session {
  date: string; type: string; weather: 'Dry' | 'Damp' | 'Wet'; tempC: number; bestLap: string; laps: number;
}

const SESSIONS: Session[] = [
  { date: '2026-02-14', type: 'Track Day', weather: 'Damp', tempC: 12, bestLap: '2:01.902', laps: 38 },
  { date: '2026-03-09', type: 'Track Day', weather: 'Dry', tempC: 18, bestLap: '1:59.238', laps: 52 },
  { date: '2026-04-20', type: 'Race', weather: 'Dry', tempC: 22, bestLap: '1:58.611', laps: 61 },
  { date: '2026-05-18', type: 'Qualifying', weather: 'Dry', tempC: 26, bestLap: '1:58.087', laps: 24 },
  { date: '2026-06-07', type: 'Track Day', weather: 'Dry', tempC: 24, bestLap: '1:57.842', laps: 23 },
];

function lapToS(s: string): number {
  const [m, sec] = s.split(':');
  return parseInt(m, 10) * 60 + parseFloat(sec);
}

const WEATHER_ICON = { Dry: CloudSun, Damp: Droplets, Wet: Droplets } as const;
const WEATHER_COLOR = { Dry: 'var(--yellow)', Damp: 'var(--blue)', Wet: 'var(--accent)' } as const;

export function CircuitHistoryPage() {
  const [circuit, setCircuit] = useState(CIRCUITS[0]);

  const { times, fastest, slowest, pb, improvement } = useMemo(() => {
    const times = SESSIONS.map(s => lapToS(s.bestLap));
    const fastest = Math.min(...times);
    const slowest = Math.max(...times);
    const pb = SESSIONS[times.indexOf(fastest)];
    const improvement = slowest - fastest;
    return { times, fastest, slowest, pb, improvement };
  }, []);

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Circuit History</h1>
          <p className="page-subtitle">{getSessionContext().circuitName} · your evolution over time · {SESSIONS.length} sessions logged</p>
        </div>
        <select value={circuit} onChange={e => setCircuit(e.target.value)} className="btn btn-sm" style={{ cursor: 'pointer' }}>
          {CIRCUITS.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Record + improvement */}
      <div className="grid-3 mb-4" style={{ gap: 12 }}>
        <div className="card" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.10), rgba(255,255,255,0.02))' }}>
          <div className="card-header"><span className="card-title flex items-center gap-2"><Trophy size={14} style={{ color: 'var(--yellow)' }} /> Personal record</span></div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: 30, color: 'var(--yellow)', marginTop: 4 }}>{pb.bestLap}</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>{pb.date} · {pb.type} · {pb.weather} {pb.tempC}°C</div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title flex items-center gap-2"><TrendingDown size={14} style={{ color: 'var(--green)' }} /> Total improvement</span></div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: 30, color: 'var(--green)', marginTop: 4 }}>−{improvement.toFixed(3)}<span style={{ fontSize: 16 }}>s</span></div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>since first logged session</div>
        </div>
        <div className="card">
          <div className="card-header"><span className="card-title">Track benchmark</span></div>
          <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, fontSize: 30, marginTop: 4 }}>1:42.380</div>
          <div style={{ fontSize: 11, color: 'var(--text-dim)' }}>lap record · you are +1.532s</div>
        </div>
      </div>

      {/* Progression chart (best lap per session – shorter bar = faster) */}
      <div className="card mb-4">
        <div className="card-header"><span className="card-title flex items-center gap-2"><History size={14} style={{ color: 'var(--accent)' }} /> Best-lap progression</span></div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 8 }}>
          {SESSIONS.map((s, i) => {
            const t = times[i];
            const pct = 40 + ((t - fastest) / (slowest - fastest || 1)) * 55; // shorter = faster
            const isPB = t === fastest;
            return (
              <div key={s.date} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-muted)', minWidth: 78 }}>{s.date.slice(5)}</span>
                <div style={{ flex: 1, height: 18, borderRadius: 4, background: 'rgba(255,255,255,0.05)' }}>
                  <div style={{ width: `${pct}%`, height: '100%', borderRadius: 4, background: isPB ? 'var(--yellow)' : 'var(--accent)', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', paddingRight: 8 }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 700, color: 'var(--bg-base)' }}>{s.bestLap}</span>
                  </div>
                </div>
                {isPB && <Trophy size={13} style={{ color: 'var(--yellow)' }} />}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid-2" style={{ gap: 16, alignItems: 'start' }}>
        {/* Session log */}
        <div className="card">
          <div className="card-header"><span className="card-title">Session log</span></div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 6 }}>
            {[...SESSIONS].reverse().map(s => {
              const WIcon = WEATHER_ICON[s.weather];
              const delta = lapToS(s.bestLap) - fastest;
              return (
                <div key={s.date} style={{ display: 'grid', gridTemplateColumns: '80px 1fr auto auto', gap: 10, alignItems: 'center', padding: '7px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-dim)' }}>{s.date.slice(5)}</span>
                  <span style={{ fontSize: 12 }}>{s.type}</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontFamily: 'var(--font-mono)', fontSize: 10, color: WEATHER_COLOR[s.weather] }}><WIcon size={12} /> {s.tempC}°</span>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, minWidth: 110, textAlign: 'right' }}>
                    {s.bestLap} <span style={{ color: delta < 0.001 ? 'var(--yellow)' : 'var(--text-muted)', fontSize: 10 }}>{delta < 0.001 ? 'PB' : `+${delta.toFixed(3)}`}</span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Weather correlation */}
        <div className="card">
          <div className="card-header"><span className="card-title flex items-center gap-2"><CloudSun size={14} style={{ color: 'var(--yellow)' }} /> Weather correlation</span></div>
          <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-dim)', margin: '6px 0 12px' }}>
            Your pace tracks <strong style={{ color: 'var(--text)' }}>track temperature</strong> strongly: every session above 18°C beat the one before. The damp February day cost ~4 s – wet-weather craft is the biggest untapped gain.
          </p>
          <div className="grid-3">
            <div className="stat-tile"><div className="stat-tile__label">Best (dry)</div><span className="stat-tile__value" style={{ fontSize: 16 }}>1:57.842</span></div>
            <div className="stat-tile"><div className="stat-tile__label">Best (damp)</div><span className="stat-tile__value" style={{ fontSize: 16, color: 'var(--blue)' }}>1:47.902</span></div>
            <div className="stat-tile"><div className="stat-tile__label">Optimal T°</div><span className="stat-tile__value" style={{ fontSize: 16 }}>24–26°C</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
