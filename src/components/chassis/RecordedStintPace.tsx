import { useState } from 'react';
import type { RecordedSession } from '../../domain/recordedSession';
import { compareRecordedStints, type StintDeclaration } from '../../domain/recordedStintPace';
import '../../styles/lap-comparison.css';

const emptyStint = (): StintDeclaration => ({
  start: -1, end: -1, setup: '', compound: '', age: null, conditions: '', exclusions: {},
});

const blocked = {
  experimental: 'Fuente experimental. Valida el reloj antes de comparar el ritmo.',
  range: 'Selecciona la primera y la última vuelta de cada tanda.',
  overlap: 'Selecciona tandas con intervalos de vueltas separados.',
  declaration: 'Declara la referencia de setup, el compuesto, la edad inicial y las condiciones de ambas tandas.',
  exclusion: 'Documenta un motivo para cada vuelta excluida.',
  empty: 'Cada tanda necesita al menos una vuelta utilizable.',
};

const difference = (value: number) => (value > 0 ? '+' : '') + value.toFixed(3) + ' s';

function StintEditor({ label, laps, value, onChange }: {
  label: string;
  laps: RecordedSession['laps'];
  value: StintDeclaration;
  onChange: (value: StintDeclaration) => void;
}) {
  const selected = value.start >= 0 && value.end >= value.start ? laps.slice(value.start, value.end + 1) : [];
  return <fieldset>
    <legend>{label}</legend>
    <div className="lap-comparison__controls">
      {(['start', 'end'] as const).map(bound => <label key={bound}>
        {bound === 'start' ? 'Primera vuelta' : 'Última vuelta'}
        <select value={value[bound]} onChange={e => onChange({ ...value, [bound]: Number(e.target.value) })}>
          <option value={-1}>Selecciona</option>
          {laps.map((lap, position) => <option key={position} value={position}>Vuelta {lap.index} · {lap.start_s.toFixed(1)} s</option>)}
        </select>
      </label>)}
      <label>Referencia de setup <input value={value.setup} onChange={e => onChange({ ...value, setup: e.target.value })}/></label>
      <label>Compuesto <input value={value.compound} onChange={e => onChange({ ...value, compound: e.target.value })}/></label>
      <label>Edad al inicio (vueltas) <input type="number" min={0} step={1} value={value.age ?? ''}
        onChange={e => onChange({ ...value, age: Number.isNaN(e.target.valueAsNumber) ? null : e.target.valueAsNumber })}/></label>
      <label>Condiciones de la tanda <input value={value.conditions} onChange={e => onChange({ ...value, conditions: e.target.value })}/></label>
    </div>
    {selected.length > 0 && <details>
      <summary>Revisar vueltas y documentar exclusiones</summary>
      <ul>
        {selected.map((lap, offset) => {
          const position = value.start + offset;
          const reason = value.exclusions[position];
          return <li key={position} className="lap-comparison__controls">
            <label><input type="checkbox" checked={reason !== undefined} onChange={e => {
              const exclusions = { ...value.exclusions };
              if (e.target.checked) exclusions[position] = '';
              else delete exclusions[position];
              onChange({ ...value, exclusions });
            }}/> Excluir vuelta {lap.index} ({lap.duration_s.toFixed(3)} s)</label>
            {reason !== undefined && <label>Motivo de exclusión de vuelta {lap.index}
              <input required value={reason} onChange={e => onChange({ ...value, exclusions: { ...value.exclusions, [position]: e.target.value } })}/>
            </label>}
          </li>;
        })}
      </ul>
    </details>}
  </fieldset>;
}

export function RecordedStintPace({ session }: { session: RecordedSession }) {
  const [a, setA] = useState(emptyStint);
  const [b, setB] = useState(emptyStint);
  const [axle, setAxle] = useState<'delantero' | 'trasero'>('trasero');
  const result = compareRecordedStints(session, a, b);
  const unavailable = session.validation?.status === 'experimental' ? blocked.experimental
    : session.laps.length < 2 ? 'Se necesitan al menos dos marcadores de vuelta en la grabación.' : null;

  return <details className="card chassis-work-area lap-comparison">
    <summary>Ritmo observado por tanda · Neumáticos y setup</summary>
    {unavailable ? <p>{unavailable}</p> : <>
      <p>Selecciona dos tandas de {session.filename}. Fuente de los tiempos · {session.validation?.status ?? 'validación sin declarar'}. Las declaraciones se usan en esta vista.</p>
      <p>Indica la revisión de setup y las condiciones de pista, clima y carga que conozcas. Revisa las vueltas de salida, entrada, tráfico o incidencias antes de comparar.</p>
      <label>Neumático evaluado <select value={axle} onChange={e => {
        setAxle(e.target.value === 'delantero' ? 'delantero' : 'trasero');
        setA(previous => ({ ...previous, compound: '', age: null }));
        setB(previous => ({ ...previous, compound: '', age: null }));
      }}><option value="trasero">Trasero</option><option value="delantero">Delantero</option></select></label>
      <StintEditor label="Tanda A" laps={session.laps} value={a} onChange={setA}/>
      <StintEditor label="Tanda B" laps={session.laps} value={b} onChange={setB}/>
      {result.kind === 'blocked' ? <p role="status">{blocked[result.reason]}</p> : <>
        <h3>Ritmo observado · neumático {axle}</h3>
        <p role="status">Diferencia de medianas B − A · {difference(result.medianDelta)}</p>
        <p>La mediana usa los tiempos de las vueltas incluidas. El cambio dentro de cada tanda resta el tiempo de la primera vuelta incluida al de la última.</p>
        <p>Atribución al neumático pendiente. Para estimar degradación hacen falta tandas repetidas con controles de carga de combustible, piloto, pista y configuración, además de mediciones del neumático.</p>
        {([['A', result.a], ['B', result.b]] as const).map(([label, stint]) => <section key={label}>
          <h4>Tanda {label} · {stint.setup}</h4>
          <p>{stint.compound} · {stint.age} vueltas al inicio · {stint.conditions}</p>
          <p>Mediana · {stint.median.toFixed(3)} s · {stint.count} vueltas. Cambio dentro de la tanda · {stint.observedChange === null ? 'requiere dos vueltas' : difference(stint.observedChange)}.</p>
          <p>Vueltas incluidas · {stint.included.join(', ')}</p>
          {stint.excluded.length > 0 ? <ul aria-label={`Vueltas excluidas de tanda ${label}`}>
            {stint.excluded.map(({ lap, reason }, index) => <li key={index}>Vuelta {lap} · {reason}</li>)}
          </ul> : <p>Sin vueltas excluidas.</p>}
        </section>)}
      </>}
    </>}
  </details>;
}
