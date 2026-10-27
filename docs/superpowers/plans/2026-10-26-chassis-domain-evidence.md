# Chassis Domain Evidence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Ejecución nativa en esta sesión elegida por el usuario; se conserva. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Incorporar contextos medidos de pista, clima y neumáticos/propulsión al análisis verificable de Chassis, y exponer requisitos de adquisición de físico/neuro sin inferencia biométrica.

**Architecture:** 18 conserva paquetes privados inmutables, normaliza cantidades y construye referencias/capacidades por rol; 01 coordina decisiones mediante MCP; 02 valida contratos; 13 aporta captura/consulta sobre la sesión compartida. El snapshot congela revisiones y el Chief recibe solo resultados sellados, con decisión final humana.

**Tech Stack:** Python/Pydantic/FastAPI/SQLite, motor de calidad temporal existente de17, React/TypeScript/CSS, Ollama y herramientas actuales. Sin nuevos servicios, librerías, conectores live ni migraciones cloud.

**Spec:** `docs/superpowers/specs/2026-10-26-chassis-domain-evidence-design.md`, aprobada el26-Oct-2026; builder check independiente: «nothing important left».

**Estado:** plan preparado, pendiente de confirmación del alcance antes de implementar. No se han creado DTO, rutas, tablas ni componentes de producto por este plan.

## Global Constraints

- Integración aditiva en Chassis; preservar taller, A/B, suspensión, anexos, informes y las seis vistas. Una sola sesión/contexto y borrador compartidos.
- Datos privados y originales inmutables; tres headers KDD, propiedad comprobada en servidor, permisos exactos y diccionario de sensores obligatorio.
- Sin valores simulados en producto, diagnósticos biométricos, estimación de adherencia/desgaste/vida útil/potencia/ganancias de vuelta ni comandos ECU/CAN.
- Un dato guardado no obtiene validación externa. Físico/neuro solo preparan adquisición; no admiten muestras biométricas en esta entrega.
- Conservar bloqueos por fuente experimental, física inválida y aprobación humana. No modificar la autoridad del Chief titular/sustituto ni asignar datos históricos sin dueño.
- Mantener8192bytes para contexto técnico,16000caracteres para prompt, una llamada por tarea y límites actuales:12llamadas/run y plazo por llamada del runtime. No aumentar modelos, recursos o plazos para ocultar fallos. Aceptación con modelo actual qwen3:0.6b.
- CSV explícito:25MiB,250000filas,8columnas mapeadas incluyendo tiempo; máximo8cantidades seleccionadas por paquete. Sin resampleo, reparación o frecuencia nominal inventada. Worker numérico30s y una ejecución/proceso.
- Continuar sobre base dirty autorizada, con baseline exacto propio de este plan. Sin commits/push, limpieza, instalación, despliegue ni aplicación de migraciones cloud.

## Review Focus

1. Una observación puntual presentada como condición de toda la tanda: conservar punto/intervalo y rechazar cobertura ampliada; T1/T3/T4.
2. Presión absoluta confundida con manométrica, o temperatura de aire con superficie: significado tipado y unidades separadas; T1/T3/T6.
3. Paquete de otra moto, circuito, revisión, montaje o equipo reutilizado en snapshot: rechazo con vínculo explícito y pruebas HTTP autenticadas; T2/T4.
4. Activar un rol citando solo geometría o confiar en metadatos aportados para certificar precisión: capacidades/citas comprobadas por dominio, attestation observacional diferenciada; T2/T5.
5. Ausencia de clima bloqueando Chassis válido o respuestas coordinadas filtradas a la revisión independiente: cobertura por rol y manifiesto congelado sin conclusiones; T4/T5/T7.

## Archivos y decisiones transversales

Rutas relativas a `C:/Users/usuario/Desktop/kdd-agentic-factory`:

- Nuevo `18-telemetry-dataset/src/telemetry_dataset/chassis/domain_evidence/{models,normalization,policy,store,service,csv_import,worker,projection}.py`: DTO, cantidades, aptitud, transacciones, casos de uso, importación, proceso acotado y proyección respectivamente.
- Nuevo `18-telemetry-dataset/src/telemetry_dataset/routers/domain_evidence.py`; montaje enmain e inventario exacto enidentity/policy.
- Cambios acotados en18 `chassis/engineering/{snapshots,technical_context,decision_contracts,decision_context,decision_generation,tools,runs,proposals,decisions}.py`, según dependencia real. No refactorizar estos módulos completos.
- 01 `src/orchestrator/engineering/{models,decisions,specialists}.py`; 02 `src/mcp_gateway/contracts/engineering.tools.yaml`; esquemas18 yregistro. 02 no hace cálculo ni razonamiento.
- Nuevos13 `src/domain/domainEvidence.ts`, `src/services/domainEvidence.ts`, `src/components/chassis/domains/{DomainEvidencePanel,DomainPacketForm,DomainCSVImport,DomainCoverage,DomainReadiness}.tsx`, `src/styles/domain-evidence.css`. Conexiones enChassisPage, AnalysisRunPanel y tipos deengineeringSession.

### Gramática y aptitud decididas para el plan

`DomainPacketInput` distingue `track`, `weather`, `tires-powertrain`; `AcquisitionReadinessInput` distingue `physical`, `neuro`. Los segundos nunca aceptan cantidades fisiológicas. `QuantityInput` es `{metric, value, unit, uncertainty?, sensor_id?, channel_index?}` con campos cerrados y finitos. Cada métrica tiene dominio, semántica, unidad SI y fuentes permitidas en un registro explícito. Se admiten solo las conversiones declaradas; no inferir unidad desde nombre.

Métricas iniciales: pista `sector_length_m`, `bank_angle_rad`, `gradient_rad`; clima `air_temperature_k`, `surface_temperature_k`, `relative_humidity_fraction`, `wind_speed_m_s`; neumático `tire_pressure_pa`, `tire_temperature_k`; propulsión `engine_speed_rad_s`, `throttle_fraction`, `vehicle_speed_m_s`. Sector/eje/posición y presión `gauge|absolute`, condición `cold|hot|unspecified` se guardan como calificadores tipados; una condición no declarada bloquea comparación específica, no se completa por defecto. Nuevos IDs de sensores solo tras registrar ausencia/colisión y unidad; los existentes se reutilizan.

`TemporalScope` es punto UTC con zona horaria, o intervalo explícito de grabación con referencia de reloj y punto de anclaje UTC declarado. Rango ordenado; límites de sesión/fuente comprobados; reloj desconocido no pasa como sincronizado. CSV conserva reloj original y produce min/max/mean por cantidad seleccionada, con conteo, intervalo y calidad; sin diagnósticos. Un valor manual puntual no produce min/max de tanda.

Guardar crea estado `contributed`. Una operación humana separada `attest_for_observation`, permitida a engineer/admin, registra identidad, revisión/digest, documento/instrumento y alcance de comprobación. Solo si pasan las comprobaciones de fuente, vínculo, unidades y tiempo se admite revisión de **condiciones declaradas** (`eligible_for_observation`). El rótulo sigue indicando attestation, sin validación externa ni aprobación física. Si falta soporte queda `exploratory`/`blocked` y la IA solicita evidencia o se abstiene. No se inventa un rol humano nuevo ni se concede al agente este endpoint.

## Task1: DTO, unidades y política observacional

**Files:** crear18 `domain_evidence/models.py`, `normalization.py`, `policy.py`; modificar `schema-version.yaml`, `sensor-dictionary.yaml`; tests `tests/test_domain_evidence_contracts.py`.

**Interfaces:** `normalize_packet(input: DomainPacketInput)->NormalizedPacket`; `assess_packet(packet: NormalizedPacket, attestation: ObservationAttestation|None)->DomainAssessment`; assessment contiene `status`, `reasons`, `missing_fields`, `mechanical_authority='none'`.

- [x] Escribir RED: `test_temperature_and_pressure_semantics_distinct`, `test_point_does_not_cover_interval`, `test_timezone_and_interval_required`, `test_finite_values_and_closed_domains`, `test_readiness_rejects_biometric_samples`, `test_no_attestation_or_calibration_by_default`. Comprobar K=degC+273.15, Pa=bar*100000 y RPM→rad/s=RPM*2*pi/60 sin inferir potencia; `gauge` no se convierte a absoluta sin referencia.
- [x] Ejecutar `python -m pytest tests/test_domain_evidence_contracts.py -q`; verificar fallo de módulo/contrato ausente.
- [x] Implementar los contratos cerrados, conversiones y registro de métricas. Valores canónicos SI como strings normalizados; original/unidad conservados privadamente. Rangos físicos inválidos no se recortan. Registrar esquemas nuevos1.0, sin modificar formatos crudos ni convertir fuentes contribuidas en verificadas.
- [x] Repetir focal; esperadoPASS. Registrar tests y diferencias de diccionario, sin commit.

## Task2: Paquetes privados, revisiones, attestation y rutas autorizadas

**Files:** crear18 `domain_evidence/store.py`, `service.py`, `routers/domain_evidence.py`; modificarmain,identity/policy; tests `tests/test_domain_evidence_service.py`, `tests/test_domain_evidence_routes.py`.

**Interfaces:** `create_packet(input,principal,audit,operation_id,cancel_token=None)->StoredDomainPacket`; `get_packet(ref,principal,audit)`; `list_packets(query,principal,audit)->page`; `revise_packet(id,expected_revision,input,...)->StoredDomainPacket`; `attest_packet(ref,body,principal,audit,operation_id)->StoredDomainPacket`. Ref=`{domain,id,revision,digest}`; cada cambio crea revisión nueva. GET de un paquete exige `revision` y `digest` por query; no resuelve silenciosamente la última revisión.

- [x] RED: dos equipos no se leen; reader no escribe/atestigua; UUID/op reutilizada con contenido distinto409; conflicto de revisión; cancelación antes de commit; catálogo no carga originales; migración/primer acceso concurrente; attestation ajena o digest obsoleto rechazada. Fuente de otra sesión/moto/circuito/montaje rechazada.
- [x] Ejecutar focals de servicio/rutas; confirmarRED.
- [x] Persistir en DB privada `settings.data_root/domain-evidence.sqlite`, fuera de raw, con transacciones, originales BLOB, manifiestos pequeños e índices por scope/id/revisión; sin UPDATE/DELETE de revisiones. Usar la autoridad de sesiones/catálogos existentes para resolver vínculos, no solo UUID aportado.
- [x] Enumerar exactamente GET/POST `/api/v1/chassis/domain-evidence/packets`, GET `/packets/{uuid}` yPOST `/packets/{uuid}/revisions`, `/packets/{uuid}/attestations`; GET/POST `/readiness`, GET `/readiness/{uuid}`. Revisiones explícitas porquery donde proceda. No endpoints administrativos genéricos ni escritura porGET. Probar desconocidos/verbos incorrectos como denegados.
- [x] GREEN focal, `tests/test_team_identity.py` y política. Registrar cadena de evidencia de attestation y que no es aprobación de setup.

## Task3: CSV y canales de grabación con cálculo acotado

**Files:** crear18 `domain_evidence/csv_import.py`, `worker.py`; ampliarservice/router; tests `tests/test_domain_evidence_import.py`, `tests/test_domain_evidence_worker.py`.

**Interfaces:** `parse_domain_csv(stream,mapping,source)->ParsedDomainSeries`; `summarize_series(prepared)->NormalizedPacket`; `execute_domain_bounded(prepared,cancel_token)->NormalizedPacket`. Entrada de grabación es referencia/digest/índice/intervalo/calibración; nunca arrays del cliente.

- [x] RED: CSV incompleto, fórmula, NaN, columnas ambiguas, exceso de bytes/filas, reloj irregular/huecos, presión sin tipo, canal incorrecto, desconexión, timeout y publicación tardía. Comprobar estadísticos antes de reducción visual y conservación del original.
- [x] Ejecutar focals; confirmarRED. Usar inspector de reloj existente de17, sin nueva física; no copiar valores de widgets históricos ni inferir condiciones meteorológicas de canales no relacionados.
- [x] AñadirPOST `/packets/imports` multipart con mapping explícito yPOST `/packets/from-recording`; en ambos, mismos permisos y vínculo server-owned. Proceso spawn fijo, sin ejecutar funciones indicadas por cliente; una ejecución/proceso, timeout30s, cancelación supervisada y comprobación final en transacción. Guardar resultado idempotente o ningún paquete publicable.
- [x] GREEN focal más límites, aislamiento de rutas y contra la grabación actual de otro equipo. No registrar muestras en logs.

## Task4: Snapshot, proyección y referencias por dominio

**Files:** crear18 `domain_evidence/projection.py`; modificarengineering snapshots/technical_context/tools/runs, esquemas ytipos13; tests `tests/test_domain_evidence_snapshots.py`, `tests/test_domain_evidence_projection.py`.

**Interfaces:** `resolve_domain_refs(refs,selection,session,principal,audit)->FrozenDomainContexts`; `project_domains(frozen)->BoundedDomainProjection`; `domain_scalar_evidence(snapshot)->list[EvidenceReference]`. Selección opcional `domain_contexts` máximo5, un paquete por dominio; roles de físico/neuro solo readiness.

- [x] RED: bytes históricos iguales sin campo; snapshot1.2 con dominios,1.1 solo suspensión,1.0 sin ampliaciones; selección incompatible/revisión obsoleta/sha forjada; decimal canónico; intervalos incongruentes; notas, GPS y originales ausentes; contexto8192bytes y prompt16000 sin truncamiento.
- [x] Ejecutar focals; confirmarRED. Mantener `environment` histórico separado: no lo migrar ni interpretar como clima validado.
- [x] Congelar paquetes yassessment, calcular referencias escalares estables a partir de id/rev/digest/métrica/calificador; incluir semántica y estado en la proyección. No se recalcula leyendo fuente viva después del sellado. IDs del manifiesto completo se conservan para integridad; filtrado de hechos por rol no altera la identidad del snapshot.
- [x] Emitir technical_context2.2 cuando haya dominios; consumidores aceptan2.0/2.1/2.2. Actualizar todos los TaskContract embebidos para1.2, conservando1.0/1.1; prueba que enum desconocida falla. Registrar herramientas6.0 por ampliación coordinada de contratos y contexto de decisiones1.1 solo para dominios nuevos; envelopes actuales1,task2,result3 se mantienen. No modificar hashes históricos.
- [x] GREEN con suspensión, codecs ytodos los alias/contratos empaquetados. Si el contexto completo no cabe, bloquear con razón de presupuesto y permitir reducir selección explícitamente, sin perder datos guardados.

## Task5: Capacidades, peticiones y agentes especializados

**Files:** modificar18 engineering decision_contracts/decision_context/decision_generation/tools/proposals/decisions; 01 engineeringmodels/decisions/specialists; 02 contrato; tests18 `tests/test_domain_evidence_decisions.py`; tests01 `tests/unit/engineering/test_domain_decisions.py`.

**Interfaces:** `domain_decision_capabilities(role,snapshot)->list[Capability]`; `domain_input_options(role,snapshot)->list[DecisionOption]`; mismas decisiones terminales review/request/abstain y validación exacta de referencias. Catálogo de solicitudes comprobado en servidor, sin abrir rondas autónomas.

- [x] RED: citar geometría no cubre clima; usar presión absoluta como manométrica falla; falta de weather no bloquea chassis válido; fuente exploratoria no habilita cambio físico; solicitudes de campos ya presentes/rol ajeno rechazadas; physical/neuro no llaman modelo; independiente no ve resultados coordinados.
- [x] Ejecutar focals18/01; confirmarRED.
- [x] Capacidades nuevas `track_conditions_review`, `weather_conditions_review`, `tire_conditions_review`, `powertrain_channels_review`. Chassis conserva sus3actuales;track/weather solo su dominio;tires-powertrain sus2; revisores independientes cubren las capacidades admisibles del manifiesto. Máximo7capacidades tipadas,20referencias por decisión; no ampliar cantidades para que un modelo pase.
- [x] Limitar hechos/referencias citables por rol en servidor. Datos aportados sin attestation no se presentan como revisados; aptitud solo observacional. Mantener bloqueos globales actuales y mostrar missing packets como carencias del dominio; no agregar ausencia de clima al bloqueo global de Chassis ni marcar incompleto todo technical_context por un dominio ausente. Cobertura y elegibilidad se calculan por rol después de verificar íntegro el manifiesto completo. Un soporte insuficiente genera petición del catálogo o abstención.
- [x] Actualizar explícitamente los DTO InputRequest y los emisores/lectores de decision_context 1.0/1.1 en01/18 y esquemas02; conservar lectura histórica y rechazar versiones desconocidas. Ampliar selectores de InputRequest solo para los campos tipados del paquete/attestation; cada opción se verifica contra estado congelado. Físico/neuro devuelven estado determinista y requisitos de adquisición, nunca una decisión biométrica exitosa. No retirar guardas sin reemplazar política de dominio.
- [x] GREEN focals+contrato público/alias y gateway; probar paridad de vocabulario en01/02/18, presupuestos y citas inventadas.

## Task6: Captura, importación y readiness dentro de Chassis

**Files:** crear los5componentes13, domain/domainEvidence.ts, services/domainEvidence.ts y CSS enumerados arriba; modificar `src/pages/ChassisPage.tsx`, `src/context/EngineeringSessionContext.tsx`, `src/components/engineering/AnalysisRunPanel.tsx` y `src/domain/engineeringSession.ts` solo en selección de refs; tests `tests/domainEvidenceUI.test.tsx`, `tests/domainEvidenceContext.test.tsx`.

**Interfaces:** `DomainEvidencePanel({contextKey,session,recordingId,comparisonRef,onSelection})`; servicio `createPacket`, `listPackets`, `getPacket`, `importPacket`, `attestPacket`, `saveReadiness`, todos conAbortSignal ytelemetryFetch. Selección `{domain,id,revision,digest}[]` para el próximo snapshot; no muta informes anteriores.

- [x] Leer design.md yskill de UI pertinente. RED: vacío sin medidas ilustrativas, unidades/semánticas, fecha visible ytipo puntual, requisitos para attestation, estado biométrico no habilitado, reader sin botones de escritura, seis vistas preservan selección, cambio de equipo descarta respuesta tardía, Cancelar no adopta guardado.
- [x] Ejecutar `npx vitest run tests/domainEvidenceUI.test.tsx tests/domainEvidenceContext.test.tsx`; confirmarRED.
- [x] Integrar una sola instancia de evidencia por dominio sobre contexto compartido. Formularios compactos, opciones avanzadas plegadas, campos obligatorios según dominio y mensajes accionables. Reutilizar tokens; sin bibliotecas nuevas, tarjetas anidadas ni hardware ficticio. No recopilar texto clínico ni muestras biométricas.
- [x] Añadir selección/retirada de paquetes al próximo snapshot con protección de borrador y operaciónUUID estable por contenido. Acciones del resultado previo deshabilitadas durante cálculo. Etiquetas: «Aportado», «Revisión documental para observaciones», «Exploratorio», «Faltan datos»; no «Validado» por guardar o atestiguar.
- [x] GREEN+typecheck+roles. Una ronda visual390/1024/1366 yteclado con tabla alternativa donde haya trazas; corregir un lote yconfirmar, sin bucle estético abierto.

## Task7: Chief, informes y límites de cobertura

**Files:** modificar18 `src/telemetry_dataset/chassis/engineering/proposals.py`, `reports.py`, `decisions.py` y `src/telemetry_dataset/chassis/schemas/engineering-report.json`; modificar13 `src/components/engineering/AnalysisRunPanel.tsx`, `src/components/engineering/ContrastPanel.tsx` y `src/domain/engineeringSession.ts`. Tests18 `tests/test_domain_evidence_reports.py`; tests13 `tests/domainEvidenceChief.test.tsx`.

**Interfaces:** extender `summarize_section(results, section_id=None) -> SectionSummary`, `summarize_sections(results)` y `reconcile(primary_draft, sealed_reviews) -> ConflictMatrix` en proposals.py; `ReportService.build_engineering_report(session_id, revision, principal)` incorpora cobertura congelada del snapshot; `DecisionService.current_validity(proposal_id, principal, revision=None)` conserva invalidación por revisión. Las propuestas actuales consumen el catálogo ampliado y las secciones existentes; no se añaden agentes o líderes ficticios. Informe incluye referencias/revisiones/intervalos, aptitud observacional y campos pendientes por dominio; sin muestras o notas privadas.

- [x] RED: Chief no rellena contexto ausente, no convierte aportación en aprobación, no asegura mejora con presión/temperatura, conserva desacuerdos, lectura histórica igual; contextos modificados invalidan vigencia de propuesta y aprobación.
- [x] Ejecutar focals; confirmarRED. Comprobar que las funciones enumeradas conservan sus firmas públicas; registrar baseline antes de editar y no crear rutas de informe adicionales.
- [x] Incorporar resúmenes deterministas de cobertura y conclusiones selladas de roles. La IA puede priorizar candidatos existentes; no se amplía catálogo de cambios físicos ni se infiere causalidad. Mantener cuentas de llamadas, autoridad e invalidación en servidor.
- [x] GREEN informes, decisiones humanas ylatencia. El estado «parcial» debe verse en perfiles piloto/Chief/dirección sin leer logs técnicos.

## Task8: Aceptación integral y entrega local

**Files:** ampliar18 `tests/test_engineering_integration.py`; crear13 `tests/e2e/chassis-domain-evidence.spec.ts` yconfig/harness aislados siguiendo el laboratorio existente, sin usar datos de usuario como fixtures; actualizaroperación/PRODUCT/matriz ycrear `docs/chassis-domain-evidence-acceptance-2026-10-26.md`.

- [x] Escribir casos de tres dominios presentes yde fuente parcial/ausente, consumo de readiness físico/neuro ydos equipos. Control explícitamente sintético, sin tratar attestation como metrología externa.
- [x] Comprobar RED del recorrido nuevo; después GREEN HTTP con gateway/workers independientes yPostgreSQL efímero local. Flujo completo: contexto/captura/importación→attestation→snapshot1.2→roles yrevisión independiente→Chief→aprobación humana→invalidez al cambiar contexto o membresía. Ninguna migración cloud.
- [x] Ollama real qwen3:0.6b: conservar presupuestos; tarea nueva con revisión/petición/abstención verificadas, rol sin fuente no consume llamada. Hasta7especialistas/revisores habilitados+Chief dentro de12/run; físico/neuro0llamadas. Si no pasa, registrar bloqueo yno anunciar IA aceptada. No sustituir respuestas por mock ni elevar recursos/modelo.
- [x] E2E con backend vacío real aislado: capturar/importar, elegir refs, seis vistas, ejecutar, reabrir yconsultar informe; prueba de lector yautoridad física ausente. No interceptar API con respuestas sintéticas para afirmar aceptación integral.
- [x] Buscar solo fuentes reales autorizadas/catalogadas para los dominios. Si no hay mediciones contrastadas, registrar prueba de software/control ydejar aceptación externa pendiente; no publicar muestras ni identidades. No pedir otra vez Analyzer al usuario ni fabricar fuente para cerrar2D/banco.
- [x] Focals18/01/02, regresiones de snapshot/contratos/autoridad; después UIcompleta, typecheck/build y empaquetado17/18 fuera del checkout. Usar intérpretes/dependencias con ABI compatible; no confundir el runnerLinux sin NumPy nativo con un fallo físico ni contarlo comoPASS.
- [x] Congelar baseline/manifiesto/logs ysolicitar una revisión independiente del conjunto segúnexecuting-plans; aplicar una pasada conjunta de hallazgos importantes con pruebasRED/GREEN. No repetir bucle de revisión. Conservar evidencias por autorización previa, sin limpieza automática.
- [x] Documentar implementado, pruebas ybloqueos. Activación local solo con procesos propios identificados, inactividad ybackup consistente; verificar health, contratos, worker ydatos originales. Sin despliegue, instalación, push o migración cloud.

## Autorrevisión del plan

Revisión realizada contra el diseño aprobado y las rutas actuales: se concretaron informes/reconciliación, recuperación inmutable por revisión/digest, compatibilidad de InputRequest y separación de cobertura por rol. Los cinco casos de Review Focus tienen pruebas asignadas; no se han ejecutado pruebas de funcionalidades todavía inexistentes.

- Interfaces T1→T2/T3→T4→T5→T6/T7→T8 comparten paquetes/referencias; no requieren proyectos o aplicaciones separados.
- Decisiones del implementador explícitas: métricas iniciales, attestation observacional separada, límites de entrada yversiones; ninguna concede autoridad física o certificación externa.
- La ausencia por dominio no altera la evidencia de geometría válida. Los bloqueos globales existentes yel consentimiento/instrumentación biométrica no se eliminan.
- Se preserva ejecución en esta sesión. Este documento no es aceptación de las fuentes ni confirmación de que el producto completo está listo para vender.

## Cierre local

Ocho entregas ejecutadas y verificadas; revisión independiente y única pasada de corrección completadas. Servicios propios reiniciados con backup y health comprobados. Evidencias y límites en `docs/chassis-domain-evidence-acceptance-2026-10-26.md`. No acredita precisión externa ni disposición comercial de todo el producto.
