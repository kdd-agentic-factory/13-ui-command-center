import '../../styles/product-coverage.css';
export function ChassisCompatibility(){return <>
  <section className="hub__section product-compatibility" id="compatibility"><h2>Compatibilidad y límites actuales</h2><p>Trabaja con archivos grabados. El soporte se verifica por formato, lector y plataforma; importar una sesión no conecta hardware en directo.</p>
    <div className="product-compatibility__scroll"><table><caption>Fuentes disponibles y requisitos</caption><thead><tr><th>Fuente</th><th>Entrada</th><th>Condiciones</th></tr></thead><tbody>
      <tr><th>AiM</th><td>XRK/XRZ y DRK compatibles con el SDK; CSV/TSV</td><td>El lector nativo necesita Windows de 64 bits y el SDK oficial instalado. Los tabulares requieren tiempo y unidades explícitos.</td></tr>
      <tr><th>2D</th><td>CSV/TSV; paquetes MES/DDD de variantes observadas</td><td>2D nativo experimental: escala, signo y reloj requieren contraste independiente con Analyzer antes de decisiones mecánicas.</td></tr>
      <tr><th>Otros fabricantes</th><td>Integraciones pendientes de validación</td><td>MoTeC, Marelli y Cosworth requieren contratos y pruebas por formato. No hay compatibilidad universal ni exportaciones nativas acreditadas.</td></tr>
    </tbody></table></div>
  </section>
  <section className="hub__section" id="product-scope"><h2>Circuito, piloto y motocicleta</h2><p>Chassis Tool es el centro: geometrías y setups relacionados con la sesión y sus señales. El producto debe sumar topografía y clima, contexto del piloto, neumáticos y propulsión para explicar qué comprobar en la siguiente tanda.</p><p>Los seis especialistas multimodales y la optimización contextual están pendientes de desarrollo y validación. La IA local actual prioriza hallazgos acotados de Chassis; no diagnostica al piloto ni calcula un setup óptimo garantizado.</p><p>La diferencia que construimos: cada propuesta enlaza fuente, setup, intervalo, calibración, modelo y evidencia. Los datos que faltan y los conflictos deben ser tan visibles como el resultado.</p><a className="hub__tech-link" href="/pit-wall/app">Consultar Chassis Tool y su cobertura real</a></section>
</>;}
