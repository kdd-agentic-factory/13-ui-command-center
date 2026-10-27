# Matriz de cierre de producto

Actualizada el 2026-10-25. El informe pasa a ser alcance mínimo, no evidencia de implementación. Fuente: `src/domain/telemetryReportRequirements.ts`; se conservan identificadores, condiciones de aceptación y referencias a párrafos.

## Requisitos del informe

| ID | Capacidad | Dominio | Estado |
|---|---|---|---|
| `static-geometry` | Geometría estática A/B | motorcycle | partial |
| `editable-bike` | Moto virtual y biblioteca de componentes | motorcycle | pending |
| `dynamic-trail` | Geometría dinámica, giro e inclinación | motorcycle | research |
| `wheel-flop` | Wheel flop y sensibilidades geométricas | motorcycle | research |
| `cog` | Centro de gravedad y reparto de masas | motorcycle | partial |
| `anti-squat` | Anti-squat y tiro de cadena | motorcycle | research |
| `progressive-suspension` | Suspensión progresiva rueda/amortiguador | motorcycle | partial |
| `spring-extensions` | Cámara de aire, topes y muelles de extensión | motorcycle | pending |
| `suspension-analysis` | Velocidad, histogramas y fases de suspensión | motorcycle | partial |
| `chassis-flex` | Flexión lateral, torsión y vibración estructural | motorcycle | research |
| `aim-reading` | Lectura real AiM | motorcycle | partial |
| `two-d-reading` | Lectura real 2D y contraste con Analyzer | motorcycle | external-validation |
| `hed` | Importación de contexto 2D HED | motorcycle | pending |
| `native-math-exports` | Puente bidireccional de canales matemáticos | motorcycle | pending |
| `vendor-ecosystems` | MoTeC, Marelli, Cosworth y otros ecosistemas | motorcycle | pending |
| `can-acquisition` | Adquisición CAN y diccionario de sensores | motorcycle | pending |
| `tire-thermal` | Neumático: superficie IR, carcasa y presión | motorcycle | pending |
| `powertrain` | Motor, transmisión y electrónica | motorcycle | partial |
| `braking-metrology` | Frenos y metrología | motorcycle | pending |
| `geodesic-track` | Circuito 3D y microsectores | track | pending |
| `fim-rules` | Reglas FIM con edición y ámbito | track | external-validation |
| `microclimate` | Clima y evolución de pista | track | pending |
| `surface-cv` | Visión de baches y deterioro superficial | track | research |
| `sensor-fusion` | Sincronización vídeo, GNSS e IMU | track | research |
| `friction` | Fricción y riesgo de trayectoria | track | research |
| `rider-debrief` | Debrief del piloto vinculado a sesión | rider | pending |
| `physical-emg` | EMG, dinamometría y carga física | rider | research |
| `hand-arm-vibration` | Vibración mano-brazo y dosis | rider | research |
| `neuro-flow` | EEG, mirada y estado cognitivo | rider | research |
| `speech` | Audio y transcripción del debrief | rider | pending |
| `biometric-governance` | Gobierno de datos del piloto | rider | pending |
| `six-specialists` | Seis especialistas con contratos de evidencia | oracle | partial |
| `traceable-recommendations` | Recomendaciones y siguientes pruebas trazables | oracle | partial |
| `contextual-optimization` | Optimización contextual bayesiana, RL y Monte Carlo | oracle | research |
| `conflict-resolution` | Conflictos entre circuito, piloto y moto | oracle | partial |
| `session-report` | Informe reproducible de sesión | oracle | partial |
| `team-isolation` | Aislamiento y operación privada del equipo | oracle | partial |
| `human-approval` | Aprobación humana antes de cambios físicos | oracle | partial |
| `validation-program` | Validación por fases y criterios de precisión | oracle | external-validation |

## Módulos de navegación existentes

Task10: `ChassisPage` integra preparación, snapshot/run persistidos, reanudación desde `runs/current`, estados originales, contraste por objeto, propuesta y autoridad vigente consultada por revisión. `SettingsPage` integra designaciones sobre UUIDs de miembros reales. El informe de ingeniería se crea, relee, descarga e imprime desde el JSON persistido; su vigencia es la capturada al crear. Evidencia: `AnalysisRunPanel.test.tsx`, `ContrastPanel.test.tsx` y tests de `engineering_run_routes` en 18. Esto acredita integración y casos controlados, no inferencia viva, funcionamiento científico completo ni validación externa; QA manual y smoke vivo corresponden a Task11.

| ID | Responsable | Pantalla/API | Persistencia y permisos | Evidencia/prueba | Estado |
|---|---|---|---|---|---|
| `overview` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `pre-gp` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `raceday` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `live` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `chassis` | 13 / 18 | /api/v1/chassis/* | Aislamiento local probado; cloud pendiente | chassis-operation.md y tests de identidad/importación/Chassis | parcial |
| `data` | 13 / 18 | /api/v1/recorded/* | Aislamiento local probado; cloud pendiente | chassis-operation.md y tests de identidad/importación/Chassis | parcial |
| `cockpit` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `telemetry` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `circuit` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `corners` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `setup` | 13 / 18 | Vista autorizada de revisiones e informe persistido | Filtrado por equipo en servidor; cloud pendiente | chassisProductUI y chassis-product-workspace E2E | parcial |
| `parts` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `twin` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `tires` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `pressure` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `crew` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `replay` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `compare` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `ghost-lap` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `studio` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `report` | 13 / 18 | Vista autorizada de revisiones e informe persistido | Filtrado por equipo en servidor; cloud pendiente | chassisProductUI y chassis-product-workspace E2E | parcial |
| `debrief` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `copilot` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `advisor` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `strategy` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `predict` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `risk` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `weather` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `knowledge` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `federated` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `learning-path` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `patterns` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `research` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `sandbox` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `sim-lab` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `experiments` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `causal` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `platform` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `settings` | 13 / 18 | Identidad y configuración | Aislamiento local probado; cloud pendiente | chassis-operation.md y tests de identidad/importación/Chassis | parcial |
| `edge` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `lakehouse` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `devhub` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `trust` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `orchestrator` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `stewards` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `pit-radio` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `team` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `workbench` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `human` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `ai-crew` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `black-box` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `style` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `engctrl` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `electronics` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `aero` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `fuel` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `gearing` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `setup-lab` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `brakes` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `bike-compare` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `track-evo` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `surface` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `events` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `history` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `cube` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `season` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `quali` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |
| `rivals` | 13 | Ruta histórica en DashboardShell; integración real pendiente de verificar | No verificado para sesión real | Protección PageContent; pruebas específicas aún no acreditadas | pendiente de verificar |

## Inventario de repositorios

| Repositorio | Papel y estado de verificación | Dependencia / siguiente evidencia |
|---|---|---|

## Diferenciación exigida

Chassis conserva el centro del producto. Toda propuesta debe enlazar sesión, setup, intervalo, fuente, calibración, modelo, supuestos y siguiente prueba. Los seis especialistas son contratos pendientes, no agentes ya desplegados. Las discrepancias entre dominios se mostrarán como hipótesis y necesidades de prueba, sin convertir correlaciones en causalidad.

## Dependencias externas que no se cierran con diseño

Referencia independiente de 2D Analyzer; medidas físicas de moto y suspensión; formatos/licencias y pruebas en software destino; datos calibrados de circuito y piloto; consentimiento biométrico; reglas FIM oficiales aplicables; identidad cloud real; evaluación de modelos fuera de muestra.

## Suite integral aportada el26 de octubre de2026

Referencia de producto: `chassis_tools_pro_gemelo_digital_manual_de_taller (1).tsx`. No es evidencia de ejecución: su optimización asigna un setup fijo y sus métricas de EMG/VDV/EEG derivan de coeficientes y ajustes, no de sensores ni inferencia identificada. No se importan como resultados.

| Área solicitada | Integración actual/pendiente | Evidencia necesaria |
|---|---|---|
| Chassis global, horquilla, tren trasero y curva | En ejecución según plan visual aprobado | Contratos, física, API, UI y aceptación |
| Frenos radiales, embrague y ergonomía | Ampliación de catálogo/diseño pendiente; no modelo operativo todavía | Fichas por componente, puntos de medida, banco hidráulico y postura cuantificada |
| Circuito3D, microgeodesia y ámbito FIM | Requisito de producto; no homologación implementada | Levantamiento/precisión/edición normativa y fuentes |
| YOLO/SLAM y evasión de baches | Investigación; ninguna detección real certificada por el prototipo | Modelos/versiones/datasets etiquetados/calibración/aceptación |
| EMG6/VDV/EEG/mirada/radio | Investigación e integración pendiente | Sensores, relojes, consentimiento, artefactos y validación específica |
| Oráculo y optimización | Flujo de decisiones verificables local existente; optimizador contextual pendiente | Objetivos, restricciones, observaciones reales y validación prospectiva; sin delta de vuelta ficticio |

Los cuatro módulos comparten el contexto de sesión previsto y la autoridad del Crew Chief humano. La ampliación no sustituye el plan aprobado ni convierte los especialistas sin cobertura en agentes operativos. Se concretará por contratos y entregas verificables, conservando como centro el Chassis Tool.

## Producto único y vistas por perfil — aceptación local26Oct2026

| Requisito | Implementación | Evidencia / límite |
|---|---|---|
| Piloto, Mecánico, Ingeniero, Analista, Crew Chief, Dirección/observación | Selector y agrupación sobre un solo contexto/B/análisis | chassisWorkViews, Header, integración de página y AnalysisRunPanel; sin nuevos agentes/sensores |
| Siguiente paso accionable | Estado actual, asociación, fuente, medidas y propietarios de borradores | Pruebas de proyección y página con asociación borrada y contexto dirty |
| Autoridad visible en lectura | Resumen de vigencia/motivos y recarga sin firma | Misma propuesta caducada en seis vistas; backend conserva aprobación |
| Recuperación de orden antigua | Revisión histórica no ejecutable tras completarse | Ciclo real SQL efímero; identidad/inferencia controladas, no instalación física |
| Navegación común | Entrada Chassis/biblioteca en perfiles históricos | DashboardShell real con sonda de página destino; no acceso público a datos |
| Accesibilidad completa y validación comercial | Pendiente | Orden de foco completo de taller y pruebas con usuarios/compradores reales |
# Ampliación Banco y señales — estado local 26-Oct-2026

| Requisito añadido | Estado | Evidencia / límite |
|---|---|---|
| Recorrido, velocidad estimada y cobertura | Implementación local | Motor determinista y UI; ejecución readonly sobre suspensión nativa2D existente, siempre exploratoria |
| Banco de fuerza y movimiento | Implementación local; validación externa pendiente | CSV explícito, curvas y trabajo condicionado; falta referencia independiente de instrumento |
| Welch y STFT | Implementación local condicionada por calidad | Señales analíticas y flujo HTTP controlado; Welch sobre2D existente exploratorio; AiM inspeccionado rechazado por reloj |
| Anexos y snapshot opcional | Implementación local | Sin arrays para agentes; serialización histórica conservada; aislamiento/idempotencia probados |
| IA sobre nuevos dominios | Contrato escalar verificado y cuatro especialistas con modelo local en control sintético; aceptación integral real pendiente | Anexo exploratorio mantiene bloqueo físico; no anunciar diagnóstico de cavitación, desgaste o RUL |
| Despliegue y validación comercial | Pendiente | Identidad productiva, fuentes contrastadas, referencias de banco y usuarios; no resuelto por esta ampliación |

Aceptación local del laboratorio: navegador con backend real aislado, importación → banco → seis vistas → Welch/STFT → anexo → recarga/recuperación pasa. Los snapshots con anexo y la migración concurrente tienen regresiones específicas. La aceptación comercial con referencia externa y el recorrido completo de pista/Chief siguen pendientes.

Continuación de aceptación de equipos/IA: corregido inventario de rutas de laboratorio y24restricciones de snapshot en contratos embebidos. Flujo autenticado con anexo, cuatro especialistas y Chief pasa con Ollama real sobre control sintético; aprobación/invalidation humana pasa en el caso controlado. Los otros cinco dominios siguen sin contexto proyectado en esta aceptación. Referencias externas pendientes.

## Evidencias de dominio — ampliación aditiva local

| Requisito | Implementación | Límite |
|---|---|---|
| Pista, clima y neumáticos/propulsión | Paquetes privados, CSV/canales propios, selección por sesión y revisión documental | Sin metrología externa ni precisión certificada |
| Contexto por especialista y revisión independiente | Snapshot1.2, contexto2.2, solicitudes verificadas por dominio | Sin optimización física nueva |
| Chief e informe | Cobertura congelada y vigencia invalidada al revisar evidencia | Decisión final humana |
| Físico/neuro | Requisitos de adquisición privados | Inferencia deshabilitada |

IA local y navegador pasan con controles explícitamente sintéticos; revisión final y correcciones de concurrencia, borradores, ámbito y citas verificadas. Ver `chassis-domain-evidence-acceptance-2026-10-26.md`.

## Robustez visual y carga — continuación local26Oct2026

| Corrección | Estado | Verificación |
|---|---|---|
| Cabecera móvil: circuito y adquisición sin solapamientos | Corregida | Cinco anchuras, menú y foco de teclado en Chromium |
| Carga del motor3D | Corregida dentro del umbral existente | Chunk5,08→1,07MB; cuatro escenas renderizan en build compilado |
| Inicio sin WebGL | Comprobación previa y fallback conservado | Página permanece operativa y no crea instancias parciales en el caso probado |

445pruebas de interfaz,7recorridos de navegador compilado, typecheck/build y revisión independiente pasan. No acredita precisión de los modelos ni compatibilidad integral de fabricantes. Evidencia en `chassis-interface-hardening-2026-10-26.md`.

## Recuperación del trabajo pendiente — 26 octubre 2026

«Siguiente paso» dirige los borradores de sesión, geometría, comparación, contexto medido, laboratorio y curva a su panel. La ausencia de grabación o un error anterior ya no impide terminar la entrada pendiente. El foco y los valores se conservan al recorrer las seis vistas; la curva reabre su pestaña con o sin grabación. La salida sigue protegida por el diálogo existente.

Aceptación: seis recorridos de navegador sobre build compilado y backend vacío real a 390/1366 px; 17 pruebas focales y revisión independiente sin hallazgos materiales. Estado y resultados completos en `chassis-workflow-recovery-2026-10-26.md`. No modifica datos físicos, permisos ni decisiones humanas.

## Integridad y desconexión de importaciones — 26 octubre 2026

La publicación de grabaciones usa staging sincronizado y enlace duro exclusivo; evita JSON parciales y sobrescritura concurrente. Los fallos de almacenamiento son recuperables y la inspección2D comparte el límite100MiB. Véase `chassis-recorded-import-integrity-2026-10-26.md`.

La desconexión observada después de decodificar y antes de publicar impide guardar. El control pasa por el receive ASGI exterior, comprobado con la pila completa de middleware. No es cancelación inmediata del SDK ni rollback de commits; el proxy puede retrasar la detección. Véase `chassis-import-disconnect-2026-10-26.md`. AiM real conserva110canales/286.508muestras en la aceptación aislada; no certifica2D. Persisten los requisitos de referencia externa y aceptación del almacenamiento de producción.

Geometría de grabación: revisión completa y cabecera sincronizada con reemplazo atómico, errores503 y dos ediciones simultáneas verificadas. No cambia el modelo físico ni acredita metrología. Ver `chassis-geometry-storage-2026-10-26.md`.


## Perímetro comercial — 2026-10-26

Implementados inventario humano verificable, perfil comercial con autenticación obligatoria, SDK de autenticación limitado, bloqueo de integraciones históricas y proxy HTTPS mínimo. Desarrollo local se conserva. Evidencias y límites en [aceptación del perímetro](chassis-commercial-perimeter-acceptance-2026-10-26.md); configuración en [operación del perímetro](../deploy/chassis-perimeter.md).

Estado de salida: parcial, pendiente de cadena completa con imagen productiva y navegador aislado. Proveedor/RLS cloud, release/storage/CI/backups (1B), contraste externo2D y referencia de banco permanecen abiertos. No se ha desplegado ni declarado disponibilidad general.


Paquete comercial (continuación1A): build real comprobado sin URLs operativas históricas, ajustes de desarrollo ni previews estáticas heredadas; variables públicas limitadas expresamente y scratch excluido de Docker. Build de desarrollo preservado. La aceptación completa de imágenes, navegador y proveedor sigue pendiente; esto cierra el gate de empaquetado, no el de despliegue.


## Instancia única — evidencia del27octubre2026

Persistencia, exclusiónOS, copia/restauración y transporteTLS cuentan con pruebas; ver [aceptación](chassis-delivery-acceptance-2026-10-27.md) y [operación](chassis-single-writer-operation.md). El candidato permanece bloqueado: seguridad de las imágenes, sandbox de navegador, aceptación comercial completa y pipelineCI coordinada no están cerrados. No se ha desplegado, migrado cloud ni certificado adquisición/IA real.

Actualización del27 de octubre: dos migraciones autorizadas aplicadas y69 comprobaciones con dos equipos y ocho cuentas reales de preproducción: RLS, revocación, aislamiento, agentes/Ollama local y aprobación mediante cuentas de titular/suplente. Véase [aceptación autenticada](chassis-preproduction-identity-acceptance-2026-10-27.md). También pasan el análisis HIGH/CRITICAL de las imágenes Python finales y el smoke de Chromium con sandbox. Esto actualiza esos bloqueos concretos; permanecen navegador autenticado completo, entrega coordinada definitiva, CI y validaciones físicas externas. No hay despliegue productivo ni disponibilidad general.


Actualización de entrega coordinada: las cuatro imágenes `ubuntu-images-09` pasan el escaneo fijado, sin HIGH/CRITICAL. Frontend492, backend981 (20 omitidas), contratos de entrega34 y autoridad SQL73 pasan. La API instalada pasa35 pruebas de backup/restore/lease/readiness. CSP comercial, separación de cuotas y permisos de TLS de CI corregidos. El navegador autenticado básico tiene19 checks; la ampliación con revisión y firma UI sigue bajo aceptación y no se considera cerrada por ese resultado anterior. Véase el bloque de continuación en [aceptación de entrega](chassis-delivery-acceptance-2026-10-27.md). No hay despliegue ni publicación; el frontend de ensayo no es una imagen para clientes.


Cierre de este ensayo: candidato coordinado10, cuatro imágenes escaneadas sin HIGH/CRITICAL y27 comprobaciones de navegador autenticado pasan. Titular A y suplente B firman desde UI, contrastados con SQL. Frontend493/typecheck, autoridad instalada73, recuperación35, física34 y contratos35 pasan. Corregidos sondeo que agotaba la cuota humana y omisión de configuración de autoridad/modelo en Compose. La aceptación global continúa bloqueada; pendientes detallados al inicio del [informe actualizado](chassis-delivery-acceptance-2026-10-27.md). Sin despliegue ni disponibilidad general.

Continuación del candidato13: backend985 pases/20 omitidas, autoridad instalada77, contratos47 y cuatro imágenes sin HIGH/CRITICAL. Navegador autenticado32 comprobaciones, incluidas caída del emisor y cambio de equipo durante una petición retenida; firmas UI del titular/suplente contrastadas con SQL. Recuperación HTTP ampliada11 comprobaciones: dos reservas reales conservadas, permisos antiguos rechazados, propuestas restauradas bloqueadas y reconciliación explícita. Sonda IPv4 del frontend corregida y estado Docker saludable. La repetición conjunta y sus límites constan al inicio del [informe de entrega](chassis-delivery-acceptance-2026-10-27.md). No implica aceptación del destino, ejecución de CI remota ni disponibilidad general; las imágenes frontend siguen siendo de ensayo.

Cierre de la repetición conjunta: `stack-37-full` pasa sus11 controles obligatorios, sin bloqueos, con las cuatro imágenes del candidato13. Queda cerrada la aceptación aislada de este bloque. La promoción comercial sigue bloqueada y las referencias externas conservan su estado pendiente.
