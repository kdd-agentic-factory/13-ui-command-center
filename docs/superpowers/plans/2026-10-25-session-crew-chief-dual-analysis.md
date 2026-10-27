# Session Crew Chief Dual Analysis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Convertir Chassis en un expediente de ingeniería con contexto persistente, jerarquía de especialistas, contraste autónomo separado y decisión humana exclusiva del titular o sustituto.

**Architecture:** 18 conserva contexto, snapshots y evidencia; 01 coordina mediante herramientas autenticadas de 02, y 07 declara el flujo. La autoridad de designaciones, vigencia y decisiones se serializa en 21; SQLite no pretende convertir una lectura remota previa en aprobación atómica. 13 presenta el expediente y ambas ramas dentro de Chassis.

**Tech Stack:** React 18/TypeScript/Vite, Python 3.11+/FastAPI/Pydantic/SQLite/httpx, PostgreSQL/InsForge existente, Ollama local. Mantener el motor determinista de 17 y los contratos de 18.

**Spec:** `../specs/2026-10-25-session-crew-chief-dual-analysis-design.md` (aprobada el 2026-10-25).

**Execution:** Agentes necesarios autorizados expresamente por el usuario; ejecución en esta sesión, implementador fresco por tarea y revisión independiente, sin implementadores simultáneos sobre contratos compartidos. Plan aprobado por el usuario: «Confío continuamos», 2026-10-25. Ejecutar en esta sesión con agentes.

## Global Constraints

- Solo el Crew Chief humano titular o su sustituto designado pueden aprobar. Ninguna identidad de agente puede ejercer esa autoridad.
- La procedencia de datos live/recorded/sample/synthetic es independiente: una carrera grabada sigue siendo race.
- Los LLM no sustituyen este motor ni inventan clics, presiones o ganancias de vuelta.
- La fuente 2D experimental mantiene el gate actual: no recomendaciones mecánicas; primero contrastar el lector.
- Separar solo el texto de prompts no basta: aislamiento de ramas comprobado en servidor antes del sellado.
- Approved significa decisión autorizada, nunca aplicación automática.
- Datos crudos, GPS, identidad de piloto y comentarios privados no salen de la frontera restringida.
- Preparar migraciones y documentación operativa sin aplicarlas a cloud, sin commits/push/despliegue en esta fase.
- Conservar cambios previos no confirmados, datos históricos sin reasignación automática y denegación de rutas no clasificadas.
- No introducir otro runtime de agentes ni integrar roles del proyecto de identidad de 15 como autoridad de 18/21.

## Review Focus

- Revocación remota concurrente con aprobación: una sola frontera transaccional debe determinar qué ocurrió primero (tareas 3 y 8).
- Cambio de calibración, contexto o nueva ejecución durante una firma: cercar la propuesta antes de modificar entradas y fallar cerrado si no se puede (2, 3 y 8).
- Acceso cruzado por IDs conocidos, logs, paginación o caché: ni otro equipo ni otra rama obtienen contenido protegido (1, 4 y 10).
- Trabajador reiniciado, lease vencido y respuesta tardía: ningún resultado perdido/cancelado aparece como válido ni duplica propuesta (6).
- Modelo de rol idéntico y lector común defectuoso: distinguir independencia de proceso de validación externa y preservar bloqueo 2D (5, 7 y 11).

## Estructura y decisiones técnicas del plan

Todos los paths siguientes son relativos a `C:/Users/usuario/Desktop/kdd-agentic-factory`. Los archivos nuevos indicados son decisiones del plan, no afirmaciones de que ya existen. Leer AGENTS por repositorio. Para UI leer `13/design.md` y aplicar impeccable sobre los componentes afectados. InsForge requiere sus skills cuando comience la implementación del adaptador/migración.

18: nuevos módulos enfocados bajo `chassis/engineering/` (`models`, `store`, `sessions`, `snapshots`, `runs`, `grants`, `authority`, `decisions`, `proposals`, `tools`, `reports`), router `routers/engineering.py` y esquemas en `chassis/schemas/`. Reutilizar `chassis/store.connect()` como base transaccional, con tablas propias append-only y cabezas por revisión; no listar catálogos mediante `all_objects()` sin paginación.

01: paquete `orchestrator/engineering/` con contratos, coordinación, modelo local, worker y acceso MCP. 02: contrato y handlers de herramientas de ingeniería, usando su router y autenticación interna existentes. 07: workflow nuevo de ingeniería, sin alterar otros flujos. 21: migración `013_chassis_crew_chief_authority.sql`, runner SQL local aislado y pruebas. 13: tipos/servicio `engineeringSession`, provider scope-aware y componentes `engineering/`; adaptar la página Chassis existente.

**Autoridad propuesta para cerrar el riesgo distribuido:** 21 almacena designaciones, cabeza de expediente certificada, elegibilidad de propuesta y eventos de decisión. Todas sus operaciones bloquean la fila de equipo usada por `chassis_set_membership`. El backend registra elegibilidad usando una capacidad exclusiva de servicio; el humano solo puede decidir sobre esa elegibilidad, nunca enviarla como verdadera. Cualquier cambio relevante cerca primero la cabeza remota mediante CAS y después modifica SQLite. Si falla la parte local queda conservadoramente bloqueada hasta reconciliación. No se habilita aprobación autenticada si esa autoridad no está disponible. Esta decisión técnica conserva el comportamiento aprobado y no aplica migraciones cloud.

**Tipos compartidos:** IDs de entidades, operaciones y nonces UUID canónicos; workflow_id de traza opaco compatible con01, string seguro de1..128 caracteres sin controles; agent_id etiqueta estable; `revision` entero >=1; fechas UTC del servidor; `schema_version='1.0.0'` para contratos nuevos; `operation_id` idempotente. `EngineeringSession.id` es distinto de `recording_id`, aunque ambos sean UUID. Cada resultado lleva `snapshot_digest`, `run_id`, `workflow_id`, `branch` y `agent_id`. No registrar bearer tokens ni datos privados en informes de agentes implementadores.

**Canonicalización:** `kdd-json-v1`: normalizar strings a NFC, claves string ordenadas, UTF-8, sin espacios, `ensure_ascii=False`, NaN/Infinity prohibidos; magnitudes físicas normalizadas a strings decimales en unidades SI antes de hash (cero sin signo, sin ceros decimales finales). Los campos numéricos no físicos son enteros. Digest SHA-256 de bytes canónicos incluye versión de canonicalización. Validar claves que colisionen tras NFC y rechazarlas.

## Preparación de ejecución

Crear el workspace/ledger de este plan con el script sdd-workspace de Superpowers. Inventariar branch/status de cada repo afectado y registrar bases antes de delegar. Conservar las ramas de trabajo existentes y todos los cambios previos. En repos que siguen en main (01/02/07), crear rama de tarea sin reset ni traslado de archivos; no crear otro worktree que deje fuera la base sin confirmar. No hacer commits por la restricción de la spec. Los paquetes de revisión deben incluir únicamente archivos/diffs atribuibles a esta ampliación, con copia de baseline previa para archivos ya modificados y listado de archivos nuevos. El ledger sirve de mapa para reanudar tras compactación.

Los implementadores leen su tarea, restricciones globales y AGENTS aplicables, no una copia de todo el historial. Ningún implementador crea subagentes. Un agente implementa cada tarea y otro revisa cumplimiento/calidad antes de continuar; pruebas RED/GREEN quedan en el workspace del plan. Ante desviaciones técnicas documentar una decisión sin relajar autoridad, independencia o aislamiento.

## Task 1: Catálogos y expediente versionados

**Files:** Create `18/src/telemetry_dataset/chassis/engineering/{__init__,models,store,sessions}.py`, `18/src/telemetry_dataset/routers/engineering.py`, `18/tests/test_engineering_sessions.py`, `18/tests/test_engineering_catalogs.py`. Modify `18/src/telemetry_dataset/main.py`, `identity/policy.py`, `schema-version.yaml`; crear esquemas correspondientes.

**Interfaces:** `create_catalog_entity(kind, body, principal, operation_id) -> CatalogRevision`; `revise_catalog_entity(id, body, expected_revision, principal) -> CatalogRevision`; `create_session(body, principal, operation_id) -> EngineeringSession`; `revise_session(id, body, expected_revision, principal) -> EngineeringSession`; `get_session(id, principal) -> EngineeringSession`; `list_sessions(principal, limit=20, cursor=None) -> SessionPage`. Principal None solo preparación local. Modelos `extra='forbid'`. CRUD catálogo circuit/bike/rider con retiro lógico; sesión stint/warm_up/practice/qualifying/test/race/other, other exige etiqueta. Referencias contienen ID y revisión.

- [x] Escribir tests `test_warmup_is_not_practice`, `test_recorded_race`, `test_no_seed_entities`, `test_restart_persists_context`, `test_foreign_or_retired_reference_rejected`, `test_concurrent_revision_one_conflict` y `test_cursor_is_team_scoped`; afirmar tipos independientes, 404 ajeno, 409 CAS y revisión inmutable.
- [x] Desde 18 ejecutar `.venv/Scripts/python.exe -m pytest tests/test_engineering_sessions.py tests/test_engineering_catalogs.py -q`; comprobar RED por contrato ausente.
- [x] Implementar tablas y operaciones atómicas, backup aditivo, cursor acotado y paginación SQL. Rutas bajo `/api/v1/engineering/catalog/{kind}` y `/sessions`; clasificar exactamente GET/POST/PUT/DELETE, escribir solo engineer/admin, retirar en vez de borrar referencias.
- [x] Repetir tests hasta GREEN y ejecutar `tests/test_team_route_isolation.py`. Revisar que ningún listado incluye arrays crudos ni ejemplos.
- [x] Guardar evidencia RED/GREEN y cambios delimitados en ledger; sin commit por restricción global.

## Task 2: Snapshot de análisis y cercado de revisiones

**Files:** Create `18/.../engineering/snapshots.py`, `authority.py` (protocolo de autoridad y adaptador disabled, no cloud todavía), `18/.../chassis/schemas/analysis-snapshot.json`, `18/tests/test_analysis_snapshots.py`. Modify `engineering/sessions.py`, `schema-version.yaml`, `pyproject.toml` solo si el paquete nuevo lo requiere.

**Interfaces:** `canonical_snapshot_bytes(payload) -> bytes`; `create_snapshot(session_id, expected_revision, selection, principal, operation_id) -> AnalysisSnapshot`; `get_snapshot(id, principal) -> AnalysisSnapshot`. `DecisionAuthority.fence_session(team_id, session_id, expected_generation, operation_id) -> AuthorityHead`; `publish_eligibility(certificate) -> AuthorityHead`; `decide(principal, input, operation_id) -> ApprovalEvent`. DisabledAuthority devuelve unavailable, nunca aprobación.

- [x] Tests `test_digest_key_order_and_nfc`, `test_nonfinite_and_normalized_key_collision_rejected`, `test_each_supporting_revision_changes_digest`, `test_foreign_recording_rejected`, `test_stale_selection_conflicts`, `test_snapshot_immutable_after_revision`, `test_fence_before_mutation`. El último verifica orden fence→mutación y ausencia de escritura si la autoridad autenticada falla.
- [x] Ejecutar `.venv/Scripts/python.exe -m pytest tests/test_analysis_snapshots.py -q` y capturar RED.
- [x] Implementar selección explícita de grabaciones/intervalos/A/B/comparación y referencias a calibración/validación/entorno; importar lecturas existentes de recorded/chassis con ownership, sin tocar raw. Contexto incompleto se guarda, pero snapshot analizable requiere entradas válidas. Transacción CAS final tras resolver entradas. Añadir relación de dependencias para cercar todos los expedientes afectados por una edición de geometría/binding/setup relevante, incluso mediante rutas antiguas; revisiones inmutables no se alteran.
- [x] GREEN y regresión `tests/test_chassis_api.py tests/test_chassis_product.py`; test de ruta antigua no puede dejar aprobación vigente con entrada cambiada.
- [x] Registrar decisiones y pruebas en ledger, sin commit.

## Task 3: Autoridad humana y vigencia transaccional

**Files:** Create `21/migrations/013_chassis_crew_chief_authority.sql`, `21/tests/chassis_crew_chief_authority.sql`, `21/tests/chassis_approval_races.py`, `21/scripts/test_chassis_authority_local.py`, `18/.../engineering/authority_insforge.py`, `18/tests/test_decision_authority.py`. Modify funciones de membresía mediante migración adicional, no editar el historial 012.

**Interfaces:** RPC `chassis_set_crew_chief_designation(p_team uuid,p_primary uuid,p_substitute uuid,p_expected_revision bigint)` admin autenticado; `chassis_fence_session(p_team uuid,p_session uuid,p_expected_generation bigint,p_operation uuid)` y `chassis_register_eligibility(p_team uuid,p_session uuid,p_generation bigint,p_proposal uuid,p_proposal_revision bigint,p_proposal_digest text,p_snapshot_digest text,p_eligibility jsonb,p_operation uuid)` solo backend de confianza; `chassis_decide_proposal(p_team uuid,p_session uuid,p_proposal uuid,p_expected_generation bigint,p_expected_designation_revision bigint,p_proposal_digest text,p_snapshot_digest text,p_action text,p_note text,p_operation uuid)` usuario autenticado. Devuelven autoridad/revisión/evento tipados de tarea2. La identidad humana procede de auth.uid(), no del cuerpo. Backend no comparte su credencial de servicio con 01/02/LLM/browser.

- [x] SQL tests para titular/sustituto distintos, engineer/admin activos, admin no designado rechazado, lector/otro equipo/revocado/agente rechazados; RPC públicas no permiten publicar elegibilidad. Race tests usan dos conexiones y barreras reales: revocación vs aprobación, fence vs aprobación y dos decisiones finales.
- [x] Crear runner explícitamente local con contenedor Docker efímero propio y --network=none (imagen postgres:16-alpine ya disponible), o DSN loopback de base efímera marcada si fuese necesario. Rechazar hosts cloud/bases no marcadas y nunca reutilizar contenedores ajenos; aplicar 012+013 solo ahí y no crear usuarios reales. Preferir Docker exec psql sin exponer puertos ni instalar otro driver para este runner. Ejecutarlo antes de SQL nuevo para obtener RED verificable. Usar fixtures auth.users/auth.uid/roles aisladas; no fingir que mocks HTTP prueban RLS/concurrencia.
- [x] Implementar tablas, políticas y funciones con search_path fijo, privilegios mínimos, lock de equipo común y CAS de generation. Elegibilidad incluye snapshot/proposal digests, versiones, gates y origen humano/agent de solicitudes. Al invalidar membresía se revoca designación aplicable de forma auditada dentro del mismo lock. Idempotencia por actor/operación con fingerprint; acción incompatible 409 equivalente.
- [x] Implementar adaptador 18 con timeouts, errores fail-closed y consultas de autoridad sin caché permisiva. Fence remoto previo a mutación local y reconciliación idempotente: caída intermedia conserva bloqueo, nunca restaura aprobación antigua. Pruebas de timeout y respuesta inválida.
- [x] Ejecutar runner y `.venv/Scripts/python.exe -m pytest tests/test_decision_authority.py -q` desde18 hasta GREEN. Guardar evidencia de prueba local; migración cloud permanece sin aplicar.

## Task 4: Herramientas MCP y grants por rama

**Files:** Create `18/.../engineering/{grants,tools}.py`, `18/tests/test_engineering_grants.py`; `02/src/mcp_gateway/contracts/engineering.tools.yaml`, `02/src/mcp_gateway/servers/engineering_mcp.py`, `02/tests/unit/test_engineering_tools.py`; modify `01/src/orchestrator/clients/mcp_client.py`, `02/src/mcp_gateway/{models/tool_call.py,routers/tools.py,services/tool_execution_service.py,registry/tool_registry.py,main.py}` y configuración/autenticación interna existentes; `identity/policy.py`18 solo rutas internas exactas. Los paths entre llaves son archivos separados.

**Interfaces:** `ExecutionGrant` contiene issuer/audience, team/session/snapshot/run/branch/agent, allowed_tools, expiry y nonce. `issue_grant(run, task) -> str`; `authorize_tool(grant, tool, target) -> ToolScope`; `MCPClient.call_tool(tool_name, payload, *, workflow_id, execution_grant) -> dict`. Mantener compatibilidad de clientes existentes sin debilitar autenticación. Herramientas read_snapshot, read_evidence, read_result y local_model_json, nunca approve/write_setup.

- [ ] RED: tests de grant alterado/caducado/wrong-audience, cambio de team/branch/snapshot por payload, lectura de otro revisor/principal antes de cierre, falta workflow_id y cabeceras internas, acceso a decisión con grant y salida MCP que incumple output_schema. Afirmar denegación incluso con UUID conocido.
- [ ] Implementar transporte 01→02 con workflow_id raíz y las cabeceras de autenticación interna que 02 exige; usar identidad de servicio verificada, nunca identidad humana del prompt. Grants firmados por autoridad18 y verificados de nuevo por endpoints de evidencia18. Clave de firma solo en backend/MCP autorizados; generarla como secreto local fuera de repo sin imprimir y documentar rotación. Reutilizar JWT soportado02 si cumple audiencia/algoritmo explícitos; no aceptar algoritmo del token.
- [ ] Validar output_schema antes de devolver éxito de herramientas de ingeniería en02, sin exponer detalles privados en errores. Adaptador de evidencia únicamente agregada permitida y herramientas de solo lectura; no exponer rutas generales de objetos ni resultados de otra rama. Modelo local recibe scope validado y salida acotada, no credenciales ni red arbitraria.
- [ ] Ejecutar pytest de los tres conjuntos nuevos y `01/tests/unit/test_mcp_client.py`, `02/tests/unit` afectadas, hasta GREEN. No probar con claves reales de cloud.
- [ ] Registrar amenazas cubiertas y límites de transporte en ledger.

## Task 5: Contratos y ejecución real de especialistas y contraste

**Files:** Create `01/src/orchestrator/engineering/{__init__,models,specialists,local_model}.py`, `01/tests/unit/test_engineering_specialists.py`, `01/tests/unit/test_engineering_local_model.py`; create `18/src/telemetry_dataset/chassis/engineering/local_model.py` y `18/tests/test_engineering_local_model.py` para provider local real consumido por el proxy MCP, conectarlo al registro de herramientas de18 sin activar jobs; modify `01/src/orchestrator/agents/crew_chief_agent.py` solo para enrutar al nuevo flujo cuando haya contrato válido; crear `07/workflows/race-engineering/dual-analysis.workflow.yaml` y `07/tests/test_dual_analysis_workflow.py`; actualizar `07/catalog/{workflows,workflow-dependencies,workflow-ownership,workflow-maturity}.yaml` con las referencias registradas y madurez honesta.

**Interfaces:** `execute_specialist(task: SpecialistTask, tools: ScopedTools) -> SpecialistResult`; `execute_reviewer(task: ReviewerTask, tools: ScopedTools) -> SpecialistResult`; `generate_structured(request: ModelRequest) -> ModelResponse`. Definir en models.py `ScopedTools.call(name: str, args: dict) -> dict` como protocolo async, `SpecialistTask`/`ReviewerTask` con IDs de snapshot/run/workflow/branch/agent, manifiesto de evidencia y presupuesto; `ModelRequest` con prompt depurado, output_schema y grant interno opaco fuera del prompt; `ModelResponse` con salida JSON validada y metadatos de modelo. Contrato v1 incluye estados y todos los IDs/versions de spec. Seis especialistas conservan IDs chassis/track/weather/physical/neuro/tires-powertrain; revisores mechanical-check/evidence-quality/alternative-hypotheses.

- [ ] RED: `test_missing_integration_unavailable`, `test_missing_inputs_blocked`, `test_unknown_evidence_and_new_physical_values_rejected`, `test_biometric_inference_not_enabled`, `test_experimental_2d_not_bypassed`, `test_invalid_or_oversized_model_json_fails`, `test_same_model_independence_label`.
- [ ] Implementar adapter Ollama local con red loopback sin proxy/redirect, máximo64KiB de respuesta por llamada, salida JSON tipada y validación estricta. Límites de tiempo compartidos con presupuesto6; no reutilizar el ranking actual como si fuese agente completo. Selección autónoma limitada a dos herramientas permitidas por revisor, con historial de acciones separado, sin cadena de pensamiento. Evidencia física solo desde18/17. Sin herramienta o modelo disponibles, unavailable; no fake succeeded.
- [ ] Workflow declara workflow_id, etapas KDD (selección/limpieza/transformación/minería/interpretación según vocabulario existente), dependencias y sellado antes de confrontar. Registry/RAG ausentes bloquean sus tareas; no responder con contexto inventado. Mantener método determinista del chasis como herramienta, no algoritmo duplicado en01.
- [ ] Ejecutar tests nuevos con transporte de prueba controlado para ramas positivas/negativas; `python validators/validate_workflow_schema.py`, `python validators/validate_approval_gates.py`, `python validators/validate_required_artifacts.py`, `python validators/validate_workflow_catalog.py`, `python validators/validate_workflow_dependencies.py` desde07 y tests del CrewChiefAgent existente. GREEN no significa prueba de inferencia real todavía: esa está en11.
- [ ] Registrar cobertura real por especialista y límites explícitos.

## Task 6: Trabajador persistente, sellado y recuperación

**Files:** Create `18/.../engineering/runs.py`, `18/tests/test_engineering_runs.py`, `18/tests/test_engineering_run_recovery.py`; `01/src/orchestrator/engineering/{coordinator,worker}.py`, `01/tests/unit/test_engineering_worker.py`; modify router18 y entrypoint/config01.

**Interfaces:** `start_run(session_id, snapshot_id, config, expected_revision, principal, operation_id) -> AnalysisRun`; `claim_task(worker_id, now) -> TaskLease | None`; `complete_task(task_id, lease_id, result) -> TaskRecord`; `cancel_run(run_id, principal) -> AnalysisRun`; `get_run(run_id, principal) -> AnalysisRun`. Coordinador01 consume/persiste estado mediante herramientas MCP, no copia raw ni usa dict en memoria como fuente de verdad.

- [ ] RED: restart/lease vencido→failed interrupted; ejecución activa duplicada/idempotente; resultado tardío tras cancelación rechazado; salida sellada inmutable; reintento tras reveal→informed_review; principal y cada revisor no pueden leer otras salidas antes del cierre; límite de llamadas/concurrencia cumplido entre dos workers.
- [ ] Implementar tablas runs/tasks/leases con CAS y presupuestos persistidos: una ejecución activa por expediente, dos llamadas modelo simultáneas por instalación, doce por ejecución, dos herramientas por revisor, 60s por llamada, 10min total. Lease60s renovable cada15s; recuperación sin éxito ficticio. Concurrency global requiere registro compartido de instalación, no un semáforo por proceso.
- [ ] Lanzamiento de ejecución cerca autoridad vigente antes de crear trabajo; solicitudes repetidas con misma configuración/fingerprint recuperan run, no cercan ni duplican indefinidamente. Rama coordinada y revisores cierran resultados independientes; solo después se habilita lectura para confrontación. No sondear sosteniendo una petición larga; GET estado y cancelación explícita.
- [ ] Ejecutar pytest de runs/recovery/worker y test de dos workers con reloj controlado; verificar GREEN y cierre de conexiones Windows.
- [ ] Documentar arranque y recuperación en ledger sin cambiar servicios actuales durante pruebas.

## Task 7: Síntesis del Crew Chief y propuestas sustentadas

**Files:** Create `18/.../engineering/proposals.py`, `18/tests/test_engineering_proposals.py`; `01/src/orchestrator/engineering/synthesis.py`, `01/tests/unit/test_engineering_synthesis.py`; JSON schemas specialist-result/section-summary/final-proposal bajo18 y registro de versiones.

**Interfaces:** `summarize_section(results) -> SectionSummary`; `reconcile(primary_draft, sealed_reviews) -> ConflictMatrix`; `build_final_proposal(snapshot, section_summaries, primary_draft, sealed_reviews) -> FinalProposal`; `evaluate_gates(proposal, run, snapshot) -> ProposalEligibility`. Propuesta completa/revisión/digest; items measurement/controlled_test/setup_change con evidencias y evaluaciones.

- [ ] RED: opinión minoritaria conservada, ausencia no equivale a acuerdo, contradicción sobre mismo ajuste bloquea, desconocidos/no finitos no pasan, modelo no introduce valor/ganancia, 2D experimental bloquea modificación mecánica, mismafamilia modelo etiquetada sin validación externa. Cierre humano de conflicto requiere nota/evidencia y nueva versión; no levanta bloqueo de dominio.
- [ ] Implementar resúmenes y matriz trazable; modelo puede sugerir hipótesis/orden dentro de catálogo permitido, servidor valida cada afirmación/evidencia/valor. Números de cambio solo refieren alternativas calculadas ya persistidas, no nuevos valores generados. Ambos resultados originales permanecen inmutables. No usar voto ni confidence arbitrario para habilitar aprobación.
- [ ] Ejecutar tests de síntesis/propuestas hasta GREEN, incluidos casos de contraste caído y propuesta de medición sin ajuste. Registrar causas de bloqueo como códigos tipados con mensajes entendibles.
- [ ] Publicar certificado elegible a autoridad de3 solo tras persistencia local; no aceptar elegibilidad enviada por browser/agent. Si falla publicación, propuesta no aprobable.
- [ ] Registrar evidencia y schema versions en ledger.

## Task 8: Decisión humana, aplicación manual e informe

**Files:** Create `18/.../engineering/{decisions,reports}.py`, `18/tests/test_engineering_decisions.py`, `18/tests/test_engineering_reports.py`; modify router/policy18, authority adapter3 y esquemas nuevos. Extend runnerSQL para contrato integrado si falta.

**Interfaces:** `decide_proposal(proposal_id, input: DecisionInput, principal, operation_id) -> ApprovalEvent`; `record_application(proposal_id, input, principal, operation_id) -> ApplicationEvent`; `record_validation(application_id, input, principal, operation_id) -> ValidationEvent`; `build_engineering_report(session_id, revision, principal) -> EngineeringReport`. DecisionInput solo expected_session/proposal/designation_revision, digests, action y note; rechaza actor_id/approved_by adicionales.

- [ ] RED: titular/sustituto sí; admin/ingeniero no designado, agente, revocado, ajeno y local anónimo no; falsa elegibilidad no; nuevo contexto/run/setup no vigente; doble envío igual idempotente y distinto409; fallo entre aprobación remota y réplica local se recupera sin segunda decisión. Aprobar no crea applied/validated.
- [ ] Implementar RPC decisión como autoridad final; reflejar evento local por ID remoto/idempotencia, nunca cambiar historia para parecer aprobado sin confirmación remota. Aplicación solo la registra titular/sustituto activo con setup montado y fecha real declarada; validación requiere aplicación existente y evidencia propia del equipo. Un posterior revocado no borra firma histórica, pero no permite eventos nuevos.
- [ ] Informe incluye contexto/snapshot, ambas ramas, independencia, desacuerdos, gates, propuesta y evento humano con vigencia; no raw/GPS/biometría ni cadena privada. No cambia el esquema previo de informe de comparación; nuevo informe versionado separado.
- [ ] Ejecutar tests decisions/reports, SQL races y regresión identity/report hasta GREEN. Autoridad ausente debe producir bloqueo explicativo sin falsa firma.
- [ ] Registrar evidencia y limitaciones cloud no activado.

## Task 9: Preparación de sesión y contexto en Chassis

**Files:** Create `13/src/domain/engineeringSession.ts`, `13/src/services/engineeringSession.ts`, `13/src/context/EngineeringSessionContext.tsx`, `13/src/components/engineering/{SessionPreparation,SessionHeader}.tsx` y tests colocalizados; `13/src/styles/engineering.css`. Modify ChassisPage, DashboardShell/TeamContext solo composición mínima, conservar WorkspaceDraftContext.

**Interfaces:** tipos TS reflejan contratos18; `listEngineeringSessions`, `createEngineeringSession`, `reviseEngineeringSession`, `listCatalog`, `saveCatalogEntity`, `getEngineeringSession` mediante telemetryFetch; provider devuelve sesión/revisión/loading/error y selección scope-aware. No usar selectores demo como autoridad.

- [ ] RED con Vitest: preparar circuito/moto/piloto/warm-up sin seeds; recorded race; vacío sin grabación guardable; error409 pide recargar; catálogo ajeno no visible; respuestas tardías de otro scope descartadas; cambio voluntario protege borrador.
- [ ] Aplicar skills de UI, leer design.md. Implementar formulario, catálogo y reapertura persistida, encabezado compacto y asociación explícita de grabaciones/setup actual. Mantener Chassis como primera herramienta y todas sus funciones A/B; no convertir un archivo en sesión real por nombre. No introducir nueva landing ni animar agentes falsos.
- [ ] Ejecutar `npm test -- src/components/engineering/SessionPreparation.test.tsx src/context/EngineeringSessionContext.test.tsx`, `npm run typecheck` y suites de borradores/Chassis afectadas hasta GREEN.
- [ ] Guardar evidencia de tests; revisión visual agrupada con tarea10/11 para evitar rondas repetidas.

## Task 10: Panel de análisis, contraste y decisión

**Files:** Create `13/src/components/engineering/{AnalysisRunPanel,ContrastPanel,CrewChiefProposal,HumanDecisionPanel,DesignationSettings}.tsx` y tests; extend servicio/tipos ingeniería; modify ChassisPage, SettingsPage, chassisReport integration y estilos engineering.css.

**Interfaces:** `startAnalysisRun`, `getAnalysisRun`, `cancelAnalysisRun`, `getProposal`, `decideProposal`, `getDesignation`, `setDesignation`, `getEngineeringReport`; todos vía telemetryFetch. Poll de2s solo visible, AbortController y epoch por scope; red no reactiva cancelado ni muestra agente activo sin estado servidor.

- [ ] RED: estados de tarea reales y unavailable; identidad Crew Chief agente distinta del humano; discrepancia visible; no designado sin botón activo y servidor rechaza bypass; 409 recarga; doble click no duplica; local no permite firma; cambio de equipo borra caché/resultado/modal/URL privada.
- [ ] Implementar paneles con evidencia enlazada, cobertura, método de independencia y gates; aprobar/rechazar/solicitar revisión sobre propuesta concreta completa, mostrando titular/sustituto vigente. Configuración admin de designaciones solo sobre miembros reales, no nombres de perfil. Informe persistido y descarga/impresión de nueva versión; no exportar borrador.
- [ ] Ejecutar tests nuevos, `npm run typecheck`, tests de autenticación/drafts/report existentes hasta GREEN. Comprobar accesibilidad por teclado, foco y móvil en11.
- [ ] Actualizar catálogo/matriz de producto solo donde haya evidencia de implementación, sin declarar capacidades científicas completas.

## Task 11: Integración operativa, revisión y evidencia final

**Files:** Create `13/tests/e2e/engineering-crew-chief.spec.ts`, `18/tests/test_engineering_integration.py`, `01/tests/integration/test_engineering_gateway.py`, `18/tests/packaging_engineering_smoke.py`, `13/docs/engineering-crew-chief-operation.md`; modify startup scripts18 y configuración local01/02 solo para dependencias nuevas, documentación15 de enlace al expediente.

- [ ] Escribir E2E sintético determinista contexto→grabación válida→A/B→dos ramas→propuesta→humano→cambio invalida. Backend/provider de QA aislado con usuarios sintéticos y autoridad PostgreSQL local, nunca cloudreal. Casos negativos modelo ausente/2D experimental/contraste fallido/revocación. Escribir primero tests integración y capturar RED antes de ajustar scripts o composición del servicio para que pasen.
- [ ] Ejecutar integración HTTP real01→02→18 con grants y modelo de prueba controlado para reproducibilidad. Además ejecutar smoke separado contra Ollama real local para demostrar tool selection/JSON/sellado, registrar familia/version/tiempo y no afirmar equivalencia entre ese smoke y precisión física. Si no produce salida válida, corregir adapter; no convertir la prueba positiva a fallback simulado.
- [ ] Tests por repo: frontend `npm test`, `npm run typecheck`, `npm run build`, `npx playwright test tests/e2e/engineering-crew-chief.spec.ts`; backend pytest de todos los tests ingeniería más suites identity/chassis/readers afectadas; 01/02 suites nuevas y regresiones MCP/approval; validadores07; runnerSQL local. Ejecutar Ruff solo paths cambiados para no confundir deuda previa. Ninguna dependencia se instala sin necesidad verificada.
- [ ] Construir wheel18 con dependencias declaradas y probar instalado fuera del checkout con `python -I tests/packaging_engineering_smoke.py <installed>`; verificar esquemas nuevos incluidos y reutilizar smoke anterior. Probar arranque sin servicios externos y cierre honesto de dependencias.
- [ ] Revisión visual CUA desktop1440/móvil390, teclado, sin overflow; guardar e incluir captura absoluta del resultado. Leer skill computer-use antes de CUA. Ejecutar detector impeccable una vez sobre cambios nuevos, corregir hallazgos relevantes.
- [ ] Revisión final fresca del conjunto con agente gpt-6-astra (high), modelo más capaz disponible, contrastando spec/plan/ledger y cambios delimitados; corregir hallazgos demostrables con pruebas. Preservar cambios previos; no usar diff contraHEAD como si todo fuera de esta ampliación.
- [ ] Documentar evidencia, estados realmente operativos y gates externos: referencia2D, validación física, activación cloud/cuentas/designaciones reales. No afirmar producto comercial listo mientras falten. Dejar servicios locales verificables, sin publicar ni aplicar migraciones.

## Auto-revisión del plan

Cobertura de spec: contexto/catálogos1; snapshot2; autoridad3/8; permisosMCP4; especialistas/workflow5; autonomía/presupuesto/recuperación6; conflicto/síntesis7; informe8; experiencia9/10; aceptación/integración11. Las cinco clases Review Focus tienen tests propietarios. Los tipos compartidos, IDs separados, estados y digests mantienen los mismos nombres entre tareas. Cualquier ajuste de firmas descubierto durante ejecución se resuelve y registra en ledger antes de pasar la interfaz al siguiente agente, sin cambiar requisitos aprobados.

No se requiere resolver ciencia biométrica, adquisición de hardware o validación del fabricante para implementar este flujo; sus especialistas deben declarar falta de capacidad/entradas. Sí se requiere transporte real y autoridad transaccional para habilitar sus respectivas capacidades. Un mock útil para unit tests no es una integración terminada.
