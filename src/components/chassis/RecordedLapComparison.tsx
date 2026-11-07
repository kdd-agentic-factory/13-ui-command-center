import { useMemo, useState, type MouseEvent } from 'react';
import type { RecordedSession, RecordedSignal } from '../../domain/recordedSession';
import { alignRecordedLaps, curveDelta, gpsLap, pointAtDistance, recordedGpsPair, type SpatialPoint } from '../../domain/lapAlignment';
import { getRecordedSignal } from '../../services/recordedTelemetry';
import '../../styles/lap-comparison.css';

type Pair = [RecordedSignal, RecordedSignal];
const colors = ['var(--cyan)', 'var(--violet)'];
const percent = (value: number) => (value * 100).toFixed(1) + ' %';
const seconds = (point: SpatialPoint | null) => point ? point.t.toFixed(3) + ' s' : 'Sin cobertura';

function path(points: SpatialPoint[], x: (p: SpatialPoint) => number, y: (p: SpatialPoint) => number) {
  return points.map((p, i) => (i === 0 || p.gap ? 'M' : 'L') + x(p).toFixed(2) + ' ' + y(p).toFixed(2)).join(' ');
}

function plotCoordinates(event: MouseEvent<SVGSVGElement>) {
  const matrix = event.currentTarget.getScreenCTM();
  return matrix ? new DOMPoint(event.clientX, event.clientY).matrixTransform(matrix.inverse()) : null;
}

function LapPlots({ alignment, cursor, onCursor }: {
  alignment: ReturnType<typeof alignRecordedLaps>; cursor: number; onCursor: (distance: number) => void;
}) {
  const { reference, compared, length } = alignment;
  const plots = useMemo(() => {
    const laps = [reference, compared];
    const points = [...reference, ...compared];
    const minX = Math.min(...points.map(p => p.x)), maxX = Math.max(...points.map(p => p.x));
    const minY = Math.min(...points.map(p => p.y)), maxY = Math.max(...points.map(p => p.y));
    const mapScale = Math.min(508 / (maxX - minX || 1), 190 / (maxY - minY || 1));
    const mapX = (p: SpatialPoint) => 270 + (p.x - (minX + maxX) / 2) * mapScale;
    const mapY = (p: SpatialPoint) => 112 - (p.y - (minY + maxY) / 2) * mapScale;
    const chartX = (distance: number) => 42 + distance / length * 478;
    const maxTime = Math.max(reference[reference.length - 1]?.t ?? 0, compared[compared.length - 1]?.t ?? 0, 1);
    const chartY = (time: number) => 188 - time / maxTime * 156;
    return {
      laps, points, mapX, mapY, chartX, chartY, maxTime,
      mapPaths: laps.map(trace => path(trace, mapX, mapY)),
      timePaths: laps.map(trace => path(trace, p => chartX(p.distance), p => chartY(p.t))),
    };
  }, [reference, compared, length]);
  const { laps, points, mapX, mapY, chartX, chartY, maxTime } = plots;
  const selected = laps.map(points => pointAtDistance(points, cursor));
  function mapClick(event: MouseEvent<SVGSVGElement>) {
    const mouse = plotCoordinates(event);
    if (!mouse) return;
    let nearest = 16;
    let distance = cursor;
    for (const p of points) {
      const offset = Math.hypot(mouse.x - mapX(p), mouse.y - mapY(p));
      if (offset < nearest) { nearest = offset; distance = p.distance; }
    }
    onCursor(distance);
  }
  function chartClick(event: MouseEvent<SVGSVGElement>) {
    const mouse = plotCoordinates(event);
    if (mouse) onCursor(Math.max(0, Math.min(length, (mouse.x - 42) / 478 * length)));
  }
  return <div className="lap-comparison__plots">
    <figure><figcaption>Trazas GPS alineadas</figcaption>
      <svg viewBox="0 0 540 224" role="img" aria-label="Mapa GPS con cursor compartido. Los huecos interrumpen las trazas." onClick={mapClick}>
        {plots.mapPaths.map((data, i) => <path key={i} d={data} fill="none" stroke={colors[i]} strokeWidth="2" strokeDasharray={i ? '5 4' : undefined}/>)}
        {selected.map((p, i) => p && <circle key={i} cx={mapX(p)} cy={mapY(p)} r={i ? 4 : 7} fill={i ? colors[i] : 'none'} stroke={colors[i]} strokeWidth="2"/>)}
      </svg>
    </figure>
    <figure><figcaption>Tiempo transcurrido por distancia</figcaption>
      <svg viewBox="0 0 540 224" role="img" aria-label="Gráfica de tiempo por distancia con cursor compartido" onClick={chartClick}>
        <path d="M42 24V188H520" stroke="currentColor" fill="none"/>
        <text x="2" y="27">s</text><text x="2" y="44">{maxTime.toFixed(1)}</text>
        <text x="42" y="209">0 m</text><text x="520" y="209" textAnchor="end">{length.toFixed(0)} m</text>
        {plots.timePaths.map((data, i) => <path key={i} d={data} fill="none" stroke={colors[i]} strokeWidth="2" strokeDasharray={i ? '5 4' : undefined}/>)}
        <line x1={chartX(cursor)} x2={chartX(cursor)} y1="24" y2="188" stroke="currentColor" strokeDasharray="4 4"/>
        {selected.map((p, i) => p && <circle key={i} cx={chartX(cursor)} cy={chartY(p.t)} r="4" fill={colors[i]}/>)}
      </svg>
    </figure>
  </div>;
}

function Comparison({ session, signals, a, b }: { session: RecordedSession; signals: Pair; a: number; b: number }) {
  const [cursor, setCursor] = useState(0);
  const [entry, setEntry] = useState<number | null>(null);
  const [exit, setExit] = useState<number | null>(null);
  const alignment = useMemo(() => alignRecordedLaps(gpsLap(...signals, session.laps[a]), gpsLap(...signals, session.laps[b]), [session.laps[a].duration_s, session.laps[b].duration_s]), [signals, session.laps, a, b]);
  if (!alignment.length) return <p role="status">Alineación no disponible. Comprueba los límites de vuelta y las coordenadas GPS sincronizadas de ambas vueltas.</p>;

  const { valid, length, coverage, referenceCoverage, reference, compared } = alignment;
  const delta = entry !== null && exit !== null ? curveDelta(alignment, entry, exit) : null;
  return <>
    <p role="status">{valid ? 'Alineación aceptada para comparar intervalos con cobertura continua.' : 'Alineación insuficiente. Diferencias por curva bloqueadas.'}</p>
    <p>A · Vuelta {session.laps[a].index} · {percent(referenceCoverage)} de referencia cubierta. B · Vuelta {session.laps[b].index} · {percent(coverage)} de referencia compartida. A en línea continua y B en línea discontinua. Los tramos sin cobertura se muestran como cortes.</p>
    <p>Distancia estimada sobre la traza A. En sus huecos se reserva la separación recta entre extremos. El control exige vueltas cerradas, extremos alineados y al menos un 90 % de cobertura. Se carga un máximo de 6.000 posiciones sincronizadas por vuelta.</p>
    <label className="lap-comparison__cursor">Cursor espacial compartido · {cursor.toFixed(1)} m
      <input type="range" min="0" max={length} step="any" value={cursor} onChange={e => setCursor(Number(e.target.value))}/>
    </label>
    <p>A · {seconds(pointAtDistance(reference, cursor))} / B · {seconds(pointAtDistance(compared, cursor))}</p>
    <LapPlots alignment={alignment} cursor={cursor} onCursor={setCursor}/>
    <h3>Intervalo de curva</h3>
    <p>Marca la entrada y la salida de la curva con el cursor. La diferencia B − A usa el tiempo recorrido entre ambas posiciones.</p>
    <div className="lap-comparison__controls">
      <button type="button" className="btn" disabled={!valid} onClick={() => setEntry(cursor)}>Marcar entrada</button>
      <button type="button" className="btn" disabled={!valid} onClick={() => setExit(cursor)}>Marcar salida</button>
    </div>
    <p>Entrada · {entry === null ? 'Sin marcar' : entry.toFixed(1) + ' m'} / Salida · {exit === null ? 'Sin marcar' : exit.toFixed(1) + ' m'}</p>
    {entry !== null && exit !== null && <p role="status">{exit <= entry ? 'La salida debe estar después de la entrada.' : delta === null ? 'Diferencia bloqueada por cobertura insuficiente en la curva.' : 'Diferencia B − A · ' + (delta > 0 ? '+' : '') + delta.toFixed(3) + ' s'}</p>}
  </>;
}

export function RecordedLapComparison({ session }: { session: RecordedSession }) {
  const gps = recordedGpsPair(session.channels);
  const [a, setA] = useState(0);
  const [b, setB] = useState(1);
  const [signals, setSignals] = useState<Pair | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const unavailable = session.laps.length < 2 ? 'Se necesitan al menos dos vueltas con marcadores.'
    : !gps ? 'Se necesitan canales de latitud y longitud en grados con el mismo origen.'
    : session.validation?.status === 'experimental' ? 'Fuente experimental. Se necesita validar el reloj antes de comparar vueltas.' : null;
  async function load() {
    if (!gps) return;
    setLoading(true);
    setError('');
    try {
      setSignals(await Promise.all([
        getRecordedSignal(session.id, gps.lat.index, { full: true }),
        getRecordedSignal(session.id, gps.lon.index, { full: true }),
      ]));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudieron cargar las trazas GPS.');
    } finally {
      setLoading(false);
    }
  }

  return <details className="card chassis-work-area lap-comparison">
    <summary>Comparación espacial de vueltas</summary>
    {unavailable ? <p>{unavailable}</p> : <>
      <p>GPS · {gps?.lat.name} / {gps?.lon.name}. Selecciona dos vueltas de la grabación.</p>
      <div className="lap-comparison__controls">
        <label>Vuelta A · Referencia <select value={a} onChange={e => setA(Number(e.target.value))}>{session.laps.map((lap, i) => <option key={i} value={i}>{lap.index}</option>)}</select></label>
        <label>Vuelta B · Comparada <select value={b} onChange={e => setB(Number(e.target.value))}>{session.laps.map((lap, i) => <option key={i} value={i}>{lap.index}</option>)}</select></label>
        {!signals && <button type="button" className="btn" onClick={() => void load()} disabled={loading || a === b}>{loading ? 'Cargando GPS…' : 'Cargar trazas GPS'}</button>}
      </div>
      {error && <p role="alert">{error}</p>}
      {a === b ? <p>Selecciona dos vueltas distintas.</p> : signals && <Comparison key={a + ':' + b} session={session} signals={signals} a={a} b={b}/>}
    </>}
  </details>;
}
