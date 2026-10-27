import { useState } from 'react';
import { assessSessionContext, domainLabels, reportRequirements, requirementStatusLabels, type ReportDomain, type SessionContextInput } from '../../domain/telemetryReportRequirements';
import '../../styles/product-coverage.css';

export function ProductCoverage({ session }: { session: SessionContextInput | null }) {
  const [domain, setDomain] = useState<ReportDomain | 'all'>('all');
  const [status, setStatus] = useState('all');
  const requirements = reportRequirements.filter(r => (domain === 'all' || r.domain === domain) && (status === 'all' || r.status === status));
  return <details className="product-coverage">
    <summary>Circuito, piloto y motocicleta · cobertura del producto</summary>
    <div className="product-coverage__body">
      <h2>Chassis como punto de unión</h2>
      <p>El informe define el alcance mínimo del producto: relacionar la moto con el circuito y el piloto, y justificar qué probar después. Esta cobertura distingue lo disponible de lo que falta; no acredita funciones pendientes.</p>
      <h3>Contexto de la sesión</h3>
      <p>Estos son contratos de especialistas previstos; no son agentes ejecutándose. La disponibilidad de un canal no valida un modelo ni una recomendación.</p>
      <dl className="product-coverage__context">{assessSessionContext(session).map(context => <div key={context.id}>
        <dt>{context.label}</dt>
        <dd><strong>{context.state === 'missing' ? 'Sin señales registradas' : context.state === 'source-unverified' ? 'Fuente pendiente de validar' : 'Señales parciales disponibles'}</strong><p>{context.note}</p></dd>
      </div>)}</dl>
      <p>La aplicación no diagnostica arm pump, ansiedad ni estado de flujo. Las propuestas biométricas requieren sensores, consentimiento, permisos específicos y validación independiente.</p>
      <h3>Requisitos y condiciones de aceptación</h3>
      <div className="product-coverage__filters">
        <label>Dominio<select aria-label="Filtrar requisitos por dominio" value={domain} onChange={e => setDomain(e.target.value as ReportDomain | 'all')}><option value="all">Todos los dominios</option>{Object.entries(domainLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>Estado<select aria-label="Filtrar requisitos por estado" value={status} onChange={e => setStatus(e.target.value)}><option value="all">Todos los estados</option>{Object.entries(requirementStatusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
      </div>
      <p role="status">{requirements.length} requisitos en esta selección. La implementación parcial no equivale a validación comercial.</p>
      {!requirements.length && <p>No hay requisitos con estos filtros. Cambia el dominio o el estado para consultar el resto.</p>}
      <div className="product-coverage__requirements">{requirements.map(requirement => <article key={requirement.id}>
        <header><h4>{requirement.title}</h4><span>{requirementStatusLabels[requirement.status]}</span></header>
        <p>{requirement.current}</p><details><summary>Qué falta para aceptarlo</summary><p>{requirement.acceptance}</p><p>Necesita: {requirement.dependencies.join(' · ')}.</p><p>Referencia del informe: párrafos {requirement.sourceParagraphs.join(', ')}.</p></details>
      </article>)}</div>
    </div>
  </details>;
}
