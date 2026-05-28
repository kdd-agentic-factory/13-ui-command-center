import { Calendar, CloudRain, Sun, Wind } from 'lucide-react';

const SCHEDULE = [
  { session: 'FP1', day: 'Fri', time: '09:00', done: true,  result: '3rd — 1:34.102' },
  { session: 'FP2', day: 'Fri', time: '14:00', done: true,  result: '5th — 1:33.847' },
  { session: 'FP3', day: 'Sat', time: '09:30', done: true,  result: '4th — 1:33.612' },
  { session: 'Q1',  day: 'Sat', time: '14:30', done: true,  result: 'Q2 direct · P6' },
  { session: 'Q2',  day: 'Sat', time: '15:00', done: true,  result: 'P3 — 1:33.201' },
  { session: 'RACE',day: 'Sun', time: '14:00', done: false, result: 'Lap 7 of 23' },
];

const WEATHER_FORECAST = [
  { time: '12:00', icon: 'sun',  temp: 25, wind: 8,  rain: 0 },
  { time: '13:00', icon: 'sun',  temp: 27, wind: 11, rain: 0 },
  { time: '14:00', icon: 'sun',  temp: 28, wind: 12, rain: 5 },
  { time: '15:00', icon: 'sun',  temp: 28, wind: 14, rain: 10 },
  { time: '16:00', icon: 'rain', temp: 26, wind: 18, rain: 35 },
];

const RIVALS_ANALYSIS = [
  { rider: 'M. Marquez',    team: 'Ducati',   avg: '1:33.04', tyreChoice: 'M/S', strength: 'Sector 3', threat: 'HIGH' },
  { rider: 'P. Espargaro',  team: 'Aprilia',  avg: '1:33.18', tyreChoice: 'M/M', strength: 'Sector 1', threat: 'MED' },
  { rider: '#47 KDD',       team: 'KDD',      avg: '1:33.41', tyreChoice: 'M/S', strength: 'Sector 2', threat: '—', self: true },
  { rider: 'J. Martin',     team: 'Pramac',   avg: '1:33.55', tyreChoice: 'S/S', strength: 'Sector 3', threat: 'LOW' },
];

function WeatherIcon({ icon }: { icon: string }) {
  if (icon === 'rain') return <CloudRain size={20} style={{ color: 'var(--blue)' }} />;
  if (icon === 'wind') return <Wind size={20} style={{ color: 'var(--text-dim)' }} />;
  return <Sun size={20} style={{ color: 'var(--yellow)' }} />;
}

export function PreGrandPrixPage() {
  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title">Pre Grand Prix</h1>
          <p className="page-subtitle">GP Mugello · Italy · Round 7 of 20 · 2026 Season</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge badge-red">RACE ACTIVE</span>
          <Calendar size={16} style={{ color: 'var(--text-dim)' }} />
        </div>
      </div>

      <div className="grid-2 mb-4">

        {/* Weekend schedule */}
        <div className="card">
          <div className="card-header"><span className="card-title">Weekend Schedule</span></div>
          <table className="data-table">
            <thead><tr><th>Session</th><th>Day / Time</th><th>Result</th></tr></thead>
            <tbody>
              {SCHEDULE.map(s => (
                <tr key={s.session} style={s.session === 'RACE' ? { background: 'var(--accent-dim)' } : {}}>
                  <td>
                    <span className={`badge ${s.session === 'RACE' ? 'badge-red' : s.done ? 'badge-muted' : 'badge-green'}`}>
                      {s.session}
                    </span>
                  </td>
                  <td className="mono text-dim">{s.day} {s.time}</td>
                  <td style={{ fontSize: 13, color: s.done ? 'var(--text)' : 'var(--text-dim)' }}>{s.result}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Weather forecast */}
        <div className="card">
          <div className="card-header"><span className="card-title">Race Day Weather Forecast</span></div>
          <div className="card-body">
            <div className="flex gap-3" style={{ justifyContent: 'space-between' }}>
              {WEATHER_FORECAST.map(w => (
                <div key={w.time} style={{ textAlign: 'center', flex: 1 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6, fontFamily: 'JetBrains Mono,monospace' }}>{w.time}</div>
                  <WeatherIcon icon={w.icon} />
                  <div className="text-mono" style={{ fontSize: 16, fontWeight: 700, marginTop: 6 }}>{w.temp}°</div>
                  <div style={{ fontSize: 11, color: 'var(--blue)', marginTop: 2 }}>{w.rain > 0 ? `${w.rain}%` : '—'}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 1 }}>{w.wind} km/h</div>
                </div>
              ))}
            </div>
            <div className="divider" style={{ margin: '16px 0' }} />
            <div className="insight-panel" style={{ ['--dot-color' as string]: 'var(--yellow)' }}>
              <div className="insight-panel__title" style={{ color: 'var(--yellow)' }}>Rain Risk Alert</div>
              <p className="insight-panel__body">
                35% probability of light rain after 16:00. Race likely to finish under dry conditions.
                Wet compound allocation approved and loaded.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Rivals analysis ───────────────────────────────────────────────── */}
      <div className="card mb-4">
        <div className="card-header">
          <span className="card-title">Rival Intelligence Analysis</span>
          <span className="badge badge-blue">KDD Scout Agent</span>
        </div>
        <table className="data-table">
          <thead><tr><th>Rider</th><th>Team</th><th>Avg Race Pace</th><th>Tyre</th><th>Strength</th><th>Threat</th></tr></thead>
          <tbody>
            {RIVALS_ANALYSIS.map(r => (
              <tr key={r.rider} style={r.self ? { background: 'var(--accent-dim)' } : {}}>
                <td style={{ fontWeight: r.self ? 700 : 400, color: r.self ? 'var(--accent)' : 'var(--text)' }}>{r.rider}</td>
                <td className="text-dim">{r.team}</td>
                <td className="mono">{r.avg}</td>
                <td className="mono text-dim">{r.tyreChoice}</td>
                <td style={{ fontSize: 12, color: 'var(--text-dim)' }}>{r.strength}</td>
                <td>
                  {r.threat !== '—' && (
                    <span className={`badge ${r.threat === 'HIGH' ? 'badge-red' : r.threat === 'MED' ? 'badge-yellow' : 'badge-muted'}`}>
                      {r.threat}
                    </span>
                  )}
                  {r.threat === '—' && <span style={{ color: 'var(--text-muted)' }}>—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Pre-race KDD analysis ──────────────────────────────────────────── */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">KDD Pre-Race Analysis</span>
          <span className="badge badge-green">Completed</span>
        </div>
        <div className="card-body">
          <div className="grid-3">
            {[
              {
                title: 'Qualifying P3 — Race pace P2',
                color: 'var(--green)',
                text: '17-lap simulation run on Digital Twin predicts P2 finish with 1-stop strategy (L11, Hard rear). Race pace analysis shows +0.2s/lap advantage over Martin.',
              },
              {
                title: 'Tyre Strategy: 1-stop optimal',
                color: 'var(--yellow)',
                text: 'Medium front / Soft rear for 11 laps, then Hard rear for 12 laps. Soft provides better qualifying pace, Hard gives race distance stability.',
              },
              {
                title: 'Sector 2 Opportunity',
                color: 'var(--blue)',
                text: 'KDD model identifies 0.08s gap to P2 in S2. Adjusted rear compression and engine brake settings should close the gap in laps 5–10.',
              },
            ].map(i => (
              <div key={i.title} className="insight-panel" style={{ ['--dot-color' as string]: i.color }}>
                <div className="insight-panel__title" style={{ color: i.color }}>{i.title}</div>
                <p className="insight-panel__body">{i.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
