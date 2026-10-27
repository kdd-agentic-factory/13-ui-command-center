# Revisión de preparación para producción — 26 de octubre de 2026

## Dictamen y alcance

**No autorizar todavía un lanzamiento comercial general.** Destino elegido por el usuario: servicio central multi-equipo y nodos locales en el paddock. Chassis Tool es el producto central; las otras superficies deben declarar su madurez real.

Se inventariaron los 27 directorios y sus referencias Git actuales; se revisaron fuentes de producto, autorización, entradas de datos, agentes y despliegue, con contraste independiente de los principales candidatos. Es una revisión de código y evidencias anteriores, no una nueva ejecución integral, un pentest completado, una inspección de infraestructura desplegada ni una validación científica. La auditoría de seguridad queda **incompleta**: faltan cobertura exhaustiva por clase de ataque, validaciones aisladas y verificación de controles efectivos. No se asigna severidad de vulnerabilidad confirmada a candidatos sólo estáticos.

Expediente externo: `C:/Users/usuario/security-audit-skill/kdd-agentic-factory/run-1/`. El inventario Git es un corte anterior a la redacción posterior de una asignación sensible en README. Los cambios previos, incluidos archivos sin seguimiento, forman parte del producto local; los commits de cada repositorio no bastan para reconstruirlo.

## Bloqueos de salida

| Prioridad de entrega | Bloqueo | Evidencia y condición de cierre |
| --- | --- | --- |
| P0 | IA sin aceptación completa | El E2E anterior falló: tres peticiones genéricas, un timeout y Chief sin propuesta terminada. Un caso aislado válido no acredita el flujo. Exigir ejecución completa con modelo real, referencias válidas y un caso negativo que permanezca bloqueado. |
| P0 | Contrato de peticiones no accionable | `01/src/orchestrator/engineering/models.py:50` sólo admite tres MissingCode. Incorporar peticiones tipadas, referencias al campo y motivos comprobables, conservando límites y ausencia real de datos. |
| P0 | Perímetro público e identidades paralelas | `13/default.conf.template:206` inyecta credencial interna y principal fijo hacia 24 sin autenticación de usuario en esa plantilla. Validación estática independiente mantiene el riesgo condicionado a despliegue/clave; no se probó acceso remoto. Cerrar mediante autenticación y delegación verificadas o retirada del proxy privilegiado del perímetro público. |
| P0 | Autoridad humana y aislamiento cloud sin activar | 18/21 contienen controles y migraciones, pero no se han acreditado usuarios, designaciones, RLS y revocación reales. Pruebas con dos equipos, roles y titular/sustituto; activación controlada posterior. |
| P0 | Datos físicos y 2D sin contraste independiente | Faltan mediciones reales verificadas de geometría/curva/calibración y una misma medición 2D exportada por Analyzer. Mantener lector experimental y bloqueo de acciones físicas. No inventar medidas ni declarar compatibilidad universal. |
| P0 | Entrega no reproducible del producto actual | Hay cambios locales y archivos sin seguimiento esenciales en varios repositorios. Preparar manifiesto coordinado de fuentes, contratos, dependencias y artefactos; construir y verificar fuera del checkout. Sin commit/push automático. |
| P1 | Operaciones legacy anuncian resultados inexistentes | `18/routers/sessions.py:297-360` registra eventos y devuelve completed/published/exported sin la transformación. `routers/export.py:101-189` no aplica anonimización/filtros a la rama Parquet. La allowlist autenticada actual deniega esas rutas: no se demuestra filtración productiva. Rechazar operaciones no soportadas o implementarlas con resultado verificable. |
| P1 | Autorización y contexto alternativos | 15 actualiza decisiones por ID sin predicado visible de rol/equipo; 16 permite headers de tenant/contexto por encima de claims. JWT y controles adicionales limitan las afirmaciones: no se ha probado actuación física ni filtración entre equipos. Consolidar el producto sobre la autoridad de 18 y probar vías paralelas. |
| P1 | Escrituras fuera de raíces lógicas | 04 une proposed_skill_id con su directorio y escribe skill.yaml; 08 une experiment_id al export y escribe un sufijo fijo. Revisiones independientes no encuentran containment. Probar con filesystem efímero y corregir identificación/canonicalización antes de exponerlos. |
| P1 | Despliegue y recuperación | Compose de desarrollo usa mocks por diseño; Kubernetes tiene recursos y políticas seleccionados transitivamente que aún necesitan revisión/render efectivo. Faltan restauración comprobada, RPO/RTO, migración única y monitorización de fallos reales. |
| P1 | Nodos locales aún sin contrato operativo | Definir enrolamiento, identidad por dispositivo/equipo, revocación, capacidad, sincronización idempotente y funcionamiento sin red. No confundir nodo federado con aprendizaje federado ya implementado. |

P0/P1 son prioridades del producto, no severidades de seguridad.

## Inventario completo de repositorios

| Repositorio | Qué existe | Principal trabajo para la salida |
| --- | --- | --- |
| 00 governance | API y políticas | Vincular decisiones vigentes a operaciones reales y mantener separación de autoridad humana. |
| 01 orchestrator | API, trabajadores y análisis de ingeniería | Contrato accionable de IA, aceptación real, presupuestos/cancelación y autoridad por alcance. |
| 02 gateway | Herramientas y vía engineering con grants | Conservar grants; revisar rutas generales cuyo approval_id no vacío no prueba aprobación de la acción. |
| 03 knowledge | Recuperación, caché, ingesta e indexación | Procedencia, filtros por equipo y alcance en consulta/caché; no dar por revisado el árbol paralelo no seleccionado. |
| 04 skills | Registro y ciclo AutoSkills | Containment de rutas, estados controlados por servidor y promoción con aprobación verificada. |
| 05 documentation | Generadores y comprobaciones de evidencia | Alinear flags de escritura/evidencia con comportamiento y comprobar artefactos generados. |
| 06 pipelines | API, workers, almacenamiento y broker | Cola alternativa acotada en fallo de broker; distinguir endpoint triggered_mock de procesamiento real. |
| 07 workflows | Catálogo YAML y API de registro | No presentarlo como ejecutor; verificar persistencia y gobierno de transiciones. |
| 08 experiments | API de experimentos, métricas y exportación | Validar IDs/rutas, pertenencia y escritura exclusiva de artefactos. |
| 09 observability | Configuración y exporters | Distinguir cargas sintéticas, fijar versiones, comprobar alertas y eliminar datos sensibles de trazas. |
| 10 Docker | Ensambles, bootstrap y scripts | Separar desarrollo con http-echo de un perfil de entrega con servicios reales. Backup sin falso éxito. |
| 11 Kubernetes | Bases y overlays | Revisar selección transitiva; no afirmar ausencia total de Ingress/NetworkPolicy. Acreditar políticas efectivas, almacenamiento y recuperación. |
| 12 CI/security | Workflows reutilizables y plantillas | Verificar callers y checks obligatorios, procedencia y promoción de artefactos, no sólo presencia de plantillas. |
| 13 UI | Producto Chassis real más módulos demo/históricos | Perímetro BFF, identidad de equipo, estados de capacidad y flujo completo comprensible. |
| 14 reproducibility | Validadores y material científico | Mantener separado de operación comercial y aplicar clasificación/anonimización verificadas a toda salida. |
| 15 race command | Backend y frontend paralelos con APIs y escenarios | Evitar una segunda autoridad de decisiones; denegar operaciones no consolidadas en producción. |
| 16 copilot | Chat, contexto, Ollama y frontend | Vincular tenant a identidad verificada; no confundir contexto de headers con autoridad. Middleware JWT sí bloquea rutas protegidas sin token. |
| 17 digital twin | Física y heurísticas what-if | Calibración y límites científicos explícitos. Heurísticas no equivalen a simulación validada de fidelidad completa. |
| 18 telemerty | Repositorio de archivos originales, nombre erróneo | Mantenerlo como datos restringidos e inmutables; no es el servicio. No se abrieron sus payloads. |
| 18 telemetry | Ingesta, datos, Chassis, ingeniería e identidad | Fuente principal de verdad; cerrar contraste 2D, medidas, contratos legacy y aceptación de IA. |
| 19 Hermes | Wrapper Compose de un runtime externo | Verificar imagen, procedencia, identidad y capacidades antes de integrarlo. |
| 20 Paperclip | Wrapper Compose/Postgres | Verificar runtime y alinear README con imagen realmente seleccionada. |
| 21 InsForge | Migraciones, funciones y scripts | Unificar runners, historial/idempotencia y comprobar privilegios/RLS efectivos sin aplicar cambios durante esta revisión. |
| 22 Fluent Bit | Wrapper/configuración enlazada | Comprobar destino, redacción, retención y aislamiento; no se auditó el upstream. |
| 23 MinIO | Wrapper y volumen persistente | Políticas por equipo, acceso y restauración; liveness no acredita disponibilidad de datos. |
| 24 security | Servicio de políticas y aprobaciones | Proteger chat paralelo, autorización de aprobadores y binding de aprobación a recurso/acción. Hay selección memory/SQLite/Postgres; la descripción exclusivamente in-memory de AGENTS está obsoleta. |
| 25 monorepo | Índice/documentación, no monorepo ejecutable | Sustituir estados Deployed no acreditados por evidencia versionada. Asignación sensible de README reemplazada por placeholder en esta revisión. |

## Qué sí protege el flujo principal

- 18 deniega por defecto métodos/rutas no inventariados, exige membresía en modo autenticado y prohíbe modo local en producción.
- La vía engineering usa grants con HMAC, alcance exacto, estado de run/lease y presupuesto vivo; no hereda automáticamente la comprobación débil de approval_id de otras herramientas.
- La aprobación productiva distingue Crew Chief humano titular/sustituto, propuesta, montaje y validación. La autoridad cloud permanece desactivada hasta configuración comprobada.
- La importación recorded tiene controles de tamaño, hash, ownership y parser 2D acotado sin extracción de ZIP. Es distinto del importador de metadatos legacy.
- No hay prueba de acceso anónimo general a 16: el middleware JWT lo refuta para sus rutas protegidas. Su bypass de preview es un caso distinto.
- Las evidencias y advertencias físicas congeladas se conservan; valores asumidos no se convierten en medidas por pasar un esquema.

## Gap de IA: causa establecida y límites

El resultado real anterior contiene tres peticiones explícitas additional_evidence con nueve referencias válidas. El correctivo de clasificación de causas no resolvería esos casos. El catálogo cerrado sólo ofrece tres solicitudes y no permite identificar una calibración, parámetro o campo concreto. Es una limitación del contrato confirmada por fuente y revisión independiente; no prueba por qué cada modelo seleccionó ese código.

La llamada aislada 4B válida y el E2E usan los mismos datos físicos reconstruidos, pero difieren en identificadores opacos y orden de referencias. La sensibilidad a esos cambios es una hipótesis no demostrada. Canonicalizar la presentación y verificar invariancia es una tarea comprobable; no es garantía de mejora del razonamiento.

Los líderes de sección actuales son agregadores deterministas (`SectionSummary.leader_role`), no especialistas LLM independientes. El Chief selecciona candidatos restringidos respaldados por datos persistidos; no calcula ni valida una modificación numérica nueva. Debe conservarse esa honestidad mientras se amplía la capacidad.

## Destino de producción acordado

Servicio central: identidad/membresías, catálogo de sesiones y revisiones, informes, permisos y auditoría de decisiones humanas. Nodo local: lectura AiM mediante dependencia Windows oficial cuando corresponda, ingesta 2D contrastada, datos originales, normalización, cálculo físico e inferencia local.

Cada tarea debe vincular equipo, nodo, sesión, revisión/snapshot y capacidades autorizadas. Enrolamiento/revocación, transporte autenticado, protección contra replay y sincronización idempotente son requisitos nuevos; no se consideran implementados. El trabajo offline produce borradores y evidencia, sin afirmar aprobación central vigente ni ejecutar cambios físicos. La federación futura de informes no autoriza compartir datos entre equipos ni entrenar modelos.

## Secuencia recomendada

1. Cerrar el contrato de IA accionable y su banco de aceptación, manteniendo fallos y solicitudes legítimas visibles.
2. Cerrar perímetro público y vías paralelas de autoridad/tenant; pruebas aisladas con dos equipos y roles.
3. Eliminar falsos éxitos legacy y corregir límites de archivos/colas; habilitar sólo capacidades verificadas.
4. Completar referencia 2D y medidas físicas reales; registrar versiones, escala, tiempo, unidades e incertidumbre.
5. Empaquetar servicio central y nodo local con configuración de producción explícita, migraciones únicas, backups/restauración y observabilidad de negocio.
6. Piloto con un equipo y luego dos equipos aislados; registrar una decisión humana, montaje y contraste posterior reales antes de disponibilidad general.

Las fases requieren evidencias distintas. Un build, HTTP200, firma de artefacto, salida JSON o prueba sintética no sustituye las otras.

## Cambios y pendientes de esta revisión

Se retiró de `25-monorepo/README.md` una asignación con aspecto de credencial y se dejó un placeholder; no se mostró ni se duplicó su valor. Esto no elimina el histórico ni acredita que la credencial fuese válida o estuviese revocada. El propietario del entorno debe comprobar exposición y rotación antes de reutilizarla.

Durante la fase de reconocimiento no se ejecutaron inferencias ni suites del producto. Posteriormente se aprobaron la especificación y el plan `2026-10-26-actionable-ai-production` y se implementó su contrato de IA accionable; sus pruebas y límites constan en `engineering-delivery-status.md` y en el expediente de aceptación. No se desplegó, migró cloud, contactó a fabricantes ni transfirió telemetría. Los controles de seguridad candidatos necesitan pruebas aisladas y comprobación de despliegue antes de declarar su cierre.
