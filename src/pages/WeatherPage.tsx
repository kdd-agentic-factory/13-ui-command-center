/**
 * WeatherPage — KDD Weather & Grip Radar.
 *
 * The current conditions + grip index, the minute-by-minute forecast timeline,
 * the rain window, the slick→intermediate→wet crossover, the tyre options, the
 * track-state map (dry line vs wet patches) and the decision triggers — turning
 * the forecast into a tyre call.
 */
import { CloudRain, Thermometer, Clock, Circle, Map, ListChecks } from 'lucide-react';
import { useGarage } from '../hooks/useGarage';
import { useSessionContext } from '../hooks/useSessionContext';
import { buildWeather, skyColor, tyreColor } from '../domain/weather';

const MONO = 'JetBrains Mono, monospace';
const stateColor = (s: string) => s === 'dry' ? 'var(--green)' : s === 'damp' ? 'var(--yellow)' : 'var(--cyan)';

export function WeatherPage() {
  const garage = useGarage();
  const { ctx } = useSessionContext();
  const w = buildWeather(garage.profile.rider.name, `${garage.profile.bike.brand} ${garage.profile.bike.model}`, ctx.circuitName);
  const maxTemp = Math.max(...w.forecast.map(f => f.trackTempC));

  return (
    <div className="page">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="page-title flex items-center gap-2"><CloudRain size={18} /> Weather & Grip Radar</h1>
          <p className="page-subtitle">{w.now.airTempC}°C air · {w.now.trackTempC}°C track · {w.now.humidity}% RH · {w.now.windKmh} km/h — {w.combo}</p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Grip index</div>
          <div style={{ fontSize: 24, fontWeight: 800, fontFamily: MONO, color: w.now.gripIndex >= 0.85 ? 'var(--green)' : 'var(--yellow)' }}>{w.now.gripIndex.toFixed(2)}</div>
        </div>
      </div>

      {/* verdict */}
      <div className="card mb-4" style={{ padding: 14,
 }}>
        <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>KDD verdict</div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--text)' }}>{w.verdict}</div>
        <div style={{ fontSize: 11, color: 'var(--accent)', marginTop: 4, fontStyle: 'italic' }}>{w.punchline}</div>
      </div>

      {/* forecast timeline */}
      <div className="card" style={{ padding: 16, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 12 }}><Clock size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Forecast timeline · rain probability & track temp</span></div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 96 }}>
          {w.forecast.map(f => (
            <div key={f.min} title={`min ${f.min}: ${f.rainProb}% rain, ${f.trackTempC}°C`} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', height: '100%' }}>
              <span style={{ fontSize: 8.5, fontFamily: MONO, color: f.rainProb >= 60 ? 'var(--accent)' : 'var(--text-muted)' }}>{f.rainProb}%</span>
              <span style={{ width: '64%', height: `${f.rainProb}%`, background: skyColor(f.sky), borderRadius: 'var(--radius) var(--radius) 0 0' }} />
              <span style={{ fontSize: 8, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 2 }}>{f.min}'</span>
            </div>
          ))}
        </div>
        {w.rainWindow && (
          <div style={{ fontSize: 10, fontFamily: MONO, color: 'var(--yellow)', marginTop: 8 }}>
            ▲ Rain window: {w.rainWindow.intensity} from min {w.rainWindow.arrivesMin} · confidence {Math.round(w.rainWindow.confidence * 100)}% · track cooling {w.forecast[0].trackTempC}°C → {w.forecast[w.forecast.length - 1].trackTempC}°C (peak {maxTemp}°C)
          </div>
        )}
      </div>

      {/* crossover + tyres */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 14 }}>
        <div className="card" style={{ padding: 16,
 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Thermometer size={14} style={{ color: 'var(--yellow)' }} /><span style={hdr}>Tyre crossover</span></div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 13, fontWeight: 800, fontFamily: MONO, color: tyreColor(w.crossover.fromTyre), textTransform: 'uppercase' }}>{w.crossover.fromTyre}</span>
            <span style={{ color: 'var(--text-muted)' }}>→</span>
            <span style={{ fontSize: 13, fontWeight: 800, fontFamily: MONO, color: tyreColor(w.crossover.toTyre), textTransform: 'uppercase' }}>{w.crossover.toTyre}</span>
            <span style={{ fontFamily: MONO, fontSize: 11, color: 'var(--text)' }}>@ min {w.crossover.atMin}</span>
          </div>
          <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>{w.crossover.note}</div>
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Circle size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Tyre options · grip now</span></div>
          {w.tyres.map(t => (
            <div key={t.type} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 6, padding: t.recommended ? '3px 6px' : '0 6px', background: t.recommended ? 'var(--bg-surface)' : 'transparent', borderRadius: 5, border: t.recommended ? '1px solid var(--border)' : '1px solid transparent' }}>
              <span style={{ width: 9, height: 9, borderRadius: 999, background: tyreColor(t.type), flexShrink: 0 }} />
              <span style={{ fontWeight: 700, color: 'var(--text)', width: 92, textTransform: 'capitalize' }}>{t.type}{t.recommended && <span style={{ fontSize: 8, fontFamily: MONO, color: 'var(--green)', marginLeft: 5 }}>FIT</span>}</span>
              <span style={{ fontFamily: MONO, fontSize: 10, color: tyreColor(t.type), width: 40 }}>{t.gripNow.toFixed(2)}</span>
              <span style={{ fontSize: 9, color: 'var(--text-muted)', flex: 1 }}>{t.window}</span>
            </div>
          ))}
        </div>
      </div>

      {/* track state map + recommendations */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 14, marginTop: 14 }}>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><Map size={14} style={{ color: 'var(--violet)' }} /><span style={hdr}>Track state · dry line vs wet</span></div>
          {w.zones.map(z => (
            <div key={z.zone} style={{ display: 'flex', alignItems: 'baseline', gap: 8, fontSize: 10.5, marginBottom: 6 }}>
              <span style={{ width: 8, height: 8, borderRadius: 999, background: stateColor(z.state), flexShrink: 0, alignSelf: 'center' }} />
              <span style={{ color: 'var(--text)', fontWeight: 600, width: 130 }}>{z.zone}</span>
              <span style={{ fontSize: 8.5, fontFamily: MONO, color: stateColor(z.state), textTransform: 'uppercase', width: 40 }}>{z.state}</span>
              <span style={{ color: 'var(--text-muted)', flex: 1 }}>{z.note}</span>
            </div>
          ))}
        </div>
        <div className="card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}><ListChecks size={14} style={{ color: 'var(--cyan)' }} /><span style={hdr}>Decision triggers</span></div>
          {w.recommendations.map((rec, i) => (
            <div key={i} style={{ display: 'flex', gap: 8, fontSize: 10.5, marginBottom: 5, alignItems: 'baseline' }}>
              <span style={{ color: 'var(--cyan)', fontFamily: MONO }}>{i + 1}</span>
              <span style={{ color: 'var(--text-muted)' }}>{rec}</span>
            </div>
          ))}
        </div>
      </div>

      <div style={{ fontSize: 9, fontFamily: MONO, color: 'var(--text-muted)', marginTop: 14, fontStyle: 'italic' }}>
        Representative forecast model. Not a live meteorological radar feed.
      </div>
    </div>
  );
}

const hdr: React.CSSProperties = { fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em', color: 'var(--text-muted)', textTransform: 'uppercase' };
