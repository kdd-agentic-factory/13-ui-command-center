# Evidencia por dominio para los especialistas de Chassis

Fecha: 2026-10-26. Estado: diseño aprobado por el usuario para preparar el plan; no implementado.

Revisión independiente de planificabilidad: `domain_evidence_builder_check`, 2026-10-26. Resultado: «nothing important left». Comprueba claridad para elaborar un plan; no valida física, fuentes ni aceptación comercial.

## Intención y decisiones propuestas

Continuar el producto único, centrado en circuito/moto/piloto/tipo de sesión, añadiendo evidencia a Chassis sin sustituir geometría, taller, suspensión ni análisis existente. Los agentes deben revisar cantidades identificables y explicar sus límites; el Crew Chief humano titular o sustituto conserva la decisión final.

Recomendación del implementador: una primera entrega de contextos medidos de **pista, clima y neumáticos/propulsión**, con preparación de adquisición para **físico y neuro**. El usuario aprobó este alcance y solicitó preparar el plan. Se mantiene la arquitectura acordada de servicio central y nodos locales, sin activar federación en esta entrega.

## Hallazgos del producto actual

- Los catálogos de ingeniería contienen nombre, notas y revisiones de circuito, moto y piloto. Un nombre no acredita geometría de pista ni mediciones meteorológicas.
- `SnapshotSelection.environment` existe, pero el resolver solo conserva identificadores genéricos del objeto; no proyecta cantidades de clima. No se tratará este campo histórico como una fuente ya validada.
- `technical_context` cubre geometría, señales y anexos de suspensión. La política de decisiones y el ejecutor bloquean expresamente track/weather/tires-powertrain. Físico/neuro no tienen inferencia habilitada. No basta retirar esas condiciones.
- El diccionario ya contiene RPM, acelerador, velocidad y algunas temperaturas de neumático. Su existencia no garantiza canales presentes ni calibración en una grabación.
- El flujo autenticado con cuatro revisores de chasis y Chief pasa con Ollama real en control sintético. Los cinco dominios restantes no quedaron acreditados por esa prueba.
- La especificación aprobada de decisiones verificables, apartado «Alcance declarado», reserva expresamente esta ampliación para otra entrega.

## Enfoques considerados

1. **Contextos versionados y cantidades medidas primero — recomendado.** Entrada manual documentada o importación explícita, validación en servidor y vínculo al snapshot. Permite usar evidencias disponibles sin exigir dispositivos nuevos. La cobertura será parcial cuando falten medidas.
2. **Conectores en vivo para los cinco dominios desde el inicio.** Requiere equipos, protocolos, sincronización y validaciones que aún no están acreditados. Se conserva como evolución; no resuelve ahora la ausencia de fuentes.

No se propone activar especialistas sobre notas libres ni datos ilustrativos: no produciría el análisis verificable solicitado.

## Contrato de contexto y fuentes

Un `DomainEvidencePacket` inmutable identifica dominio, equipo, sesión y revisión, referencias pertinentes de circuito/moto/piloto/setup, intervalo u observación puntual, fecha con zona horaria, fuente, instrumento o documento, unidades, calibración aplicable, incertidumbre declarada y estado de validación. Valores y referencias llegan separados del texto libre. Las unidades y los sensores se registran antes de su uso.

Dos vías de entrada en esta entrega: formulario de medición documentada y CSV con asignación explícita de columnas/unidades/tiempo. Sin detección silenciosa ni reparación de relojes. Las muestras quedan privadas; el contexto del modelo contiene solo observaciones acotadas, referencias y limitaciones. No hay adquisición live simulada. Metadatos estáticos, ejemplos y mediciones se distinguen.

Cada revisión conserva original/checksum, normalización y auditoría de forma transaccional. Los agentes no escriben ni validan su propia evidencia. El estado inicial es aportado; una referencia de calibración escrita no demuestra por sí sola precisión ni aceptación externa. La aptitud para revisión requiere comprobaciones de unidades, fuente, vínculo, cobertura temporal y reglas del dominio. Se conserva el estado exploratorio cuando falte contraste; no se promociona por pulsar «guardar».

La evidencia se vincula al objeto apropiado: pista a circuito/revisión; clima a circuito y momento/intervalo; neumático a moto, eje, montaje y setup; propulsión a grabación/intervalo y canales identificados. Una observación puntual no se presenta como cobertura de toda una tanda. Un contexto incompatible o de otro equipo se rechaza.

## Alcance de la primera entrega

**Pista:** especificación declarada de circuito y sectores identificados, con referencias y unidades de longitud/pendiente/peralte cuando existan mediciones. El especialista revisa datos aportados y cobertura. No reconstruye radios, geometría FIM, baches o trazadas desde el nombre del circuito; no incorpora YOLO, SLAM ni CAD3D.

**Clima:** temperatura de aire y superficie, humedad y viento cuando estén medidos y documentados. Ausencia es ausencia, no un valor meteorológico supuesto. No se consulta una API externa ni se sustituye temperatura de pista por temperatura de aire. No se estima adherencia a partir del clima.

**Neumáticos/propulsión:** identificación de montaje y condiciones de medición, presiones y temperaturas aportadas con unidades y referencia; observaciones de RPM/acelerador/velocidad solo desde canales existentes y calibrados, en un intervalo explícito. No predice desgaste, presión óptima, vida útil, potencia ni ganancias de vuelta. No aplica mapas ECU.

**Físico/neuro:** estado de disponibilidad y requisitos de adquisición por modalidad. No entran muestras biométricas ni se habilita inferencia clínica en esta entrega. Las modalidades sEMG/EEG/mirada requieren posteriormente consentimiento, instrumentación, sincronización y evaluación específica. No se deduce fatiga o estado de flujo de vibración o estilo de conducción.

## Snapshot, agentes y Chief

Se añaden referencias opcionales de dominio al snapshot nuevo; al omitirlas se preservan los bytes históricos. La versión exacta se cerrará al planificar los contratos de 01/02/18. Se mantiene el límite de tamaño, sin truncamiento silencioso; si no cabe, se declara falta de cobertura.

18 resuelve la propiedad y deriva referencias escalares permitidas. Define capacidades y opciones específicas de cada rol. Cada revisión solo acredita las capacidades presentes; una referencia de geometría no cubre clima ni neumáticos. Se conservan revisión/petición/abstención y el rechazo de citas inventadas. Solicitar un dato exige comprobar su ausencia contra el snapshot y el catálogo de opciones. Los dominios ausentes no hacen desaparecer la evidencia válida de Chassis.

No se relajan los bloqueos actuales por fuente experimental, contexto físico inválido o falta de aprobación humana. La ausencia de un contexto adicional bloquea ese dominio, sin convertirlo en una conclusión del modelo. Las reglas de admisibilidad por dominio se hacen explícitas antes de activar una nueva capacidad.

La línea independiente recibe el mismo manifiesto congelado, sin respuestas de la línea coordinada. El Chief recibe revisiones selladas, discrepancias, datos pendientes y limitaciones. No rellena dominios ausentes ni convierte una propuesta en orden aprobada. La autoridad humana permanece comprobada en servidor.

## Aplicación y aislamiento

Se integra en Chassis y comparte contexto, borrador, seis vistas y protección de navegación. Expone fuente, fecha/intervalo, unidades, aptitud y datos pendientes antes de pedir análisis. No crea otra aplicación ni elimina módulos anteriores.

Permisos: lectores consultan evidencia de su equipo; ingenieros/administradores aportan revisiones; designaciones y aprobación física mantienen sus permisos actuales. Endpoints exactos enumerados, sin prefijos abiertos. Los valores no se comparten entre equipos ni con nodos externos. No se aplican migraciones cloud en esta entrega.

## Aceptación necesaria

1. Pruebas de vínculo circuito/moto/montaje/intervalo, dos equipos y permisos; idempotencia, cancelación y respuesta tardía.
2. Rechazo de unidades incompatibles, reloj inválido, contexto ajeno, campos no previstos y supuestos presentados como mediciones.
3. Snapshot previo idéntico; nuevo snapshot reproducible; todos los contratos embebidos y empaquetados compatibles.
4. Casos de datos ausentes y cobertura parcial: solicitudes comprobadas o abstención, sin éxito ficticio ni bloqueo indebido del Chassis ya válido.
5. Inferencia local real sobre contextos de control etiquetados y, donde exista, una fuente real autorizada. Registrar qué se probó; un control no acredita metrología externa.
6. Línea independiente sin filtración de conclusiones; Chief y aprobación humana/invalidez tras cambio de contexto comprobados.
7. Navegador con backend aislado: aportar contexto, asociar, analizar, cambiar perfiles, reabrir y consultar informe. Sin publicar muestras ni identidad.

Quedan fuera: conectores live nuevos, diagnóstico biométrico, modelos de adherencia/desgaste, optimización física automática y federación operativa. Se conservan en la hoja de producto. El contraste de 2D y el banco externo continúan abiertos; esta ampliación no los certifica.

## Lo que concretará el plan

Campos y límites por dominio, catálogo de métricas y solicitudes, conversiones SI, versiones de esquema, rutas/tablas/índices, localización exacta de componentes y fixtures. Se mantiene el trabajo local aprobado sin commits ni despliegue. No comienza código de producto antes de aprobar este diseño.
