import { metricLabels, type ComparisonRun, type SetupRevision } from '../../domain/chassisComparison';
function shape(setup?: SetupRevision, trail?: number) {
  if (trail === undefined || !Number.isFinite(trail)) return null;
  const v = setup?.values;
  if (v?.front_radius_m?.unit !== 'm' || v?.rake_rad?.unit !== 'rad' || v?.offset_m?.unit !== 'm' || v?.wheelbase_m?.unit !== 'm') return null;
  const radius = v?.front_radius_m?.value, rake = v?.rake_rad?.value, offset = v?.offset_m?.value, base = v?.wheelbase_m?.value;
  if (radius == null || rake == null || offset == null || base == null || ![radius, rake, offset, base].every(Number.isFinite) || radius <= 0 || base <= 0 || rake < 0 || rake >= Math.PI / 3) return null;
  return { radius, rake, offset, base };
}
export function GeometryComparison({ run }: { run: ComparisonRun | null }) {
  const a = shape(run?.setup_a, run?.a.metrics.trail_m), b = shape(run?.setup_b, run?.b.metrics.trail_m);
  const extent = Math.max(a?.base ?? 0, b?.base ?? 0) + 2 * Math.max(a?.radius ?? 0, b?.radius ?? 0);
  const scale = extent > 0 ? 580 / extent : 1;
  return <section className="chassis-geometry" aria-label="Comparación geométrica">
    <h2>Geometría A/B</h2>
    {a || b ? <svg viewBox="0 0 720 300" role="img" aria-label="Superposición de geometría medida de setups A y B">
      <line x1="25" y1="245" x2="695" y2="245" className="chassis-ground" />
      {([['A', a], ['B', b]] as const).map(([side, s]) => {
        if (!s) return null;
        const rearX = 60 + s.radius * scale, frontX = rearX + s.base * scale, axleY = 245 - s.radius * scale;
        const axisX = frontX - s.offset * Math.cos(s.rake) * scale;
        const axisY = axleY + s.offset * Math.sin(s.rake) * scale;
        const trailX = axisX + (245 - axisY) * Math.tan(s.rake);
        return <g key={side} className={`chassis-drawing chassis-drawing-${side.toLowerCase()}`}>
          <circle cx={frontX} cy={axleY} r={s.radius * scale} />
          <line x1={frontX} y1="263" x2={rearX} y2="263" />
          <line x1={rearX} y1="240" x2={rearX} y2="270" />
          <line x1={frontX} y1="240" x2={frontX} y2="270" />
          <line x1={trailX} y1="245" x2={axisX - 90 * Math.tan(s.rake)} y2={axisY - 90} />
          <text x={rearX} y={28 + (side === 'A' ? 0 : 20)}>{side} · batalla {(s.base * 1000).toFixed(1)} mm</text>
        </g>;
      })}
    </svg> : <p>El esquema necesita radio, dirección, offset y batalla válidos. Completa las cotas y compara.</p>}
    <p>Esquema plano, vertical y sin giro. La cota horizontal representa la batalla; la rueda trasera y las bieletas requieren medidas adicionales.</p>
    {run && <div className="chassis-table-scroll"><table className="chassis-metrics"><caption>Magnitudes calculadas · diferencia B − A</caption><thead><tr><th>Magnitud</th><th>A</th><th>B</th><th>Δ B − A</th></tr></thead><tbody>{Object.entries(run.deltas).map(([key, value]) => <tr key={key}><th>{metricLabels[key] ?? key}</th><td>{(run.a.metrics[key] * 1000).toFixed(2)} mm</td><td>{(run.b.metrics[key] * 1000).toFixed(2)} mm</td><td>{value >= 0 ? '+' : ''}{(value * 1000).toFixed(2)} mm</td></tr>)}</tbody></table></div>}
  </section>;
}
