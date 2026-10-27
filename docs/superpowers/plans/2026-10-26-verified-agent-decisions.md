# Verified Agent Decisions Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking. El usuario conserva ejecución en esta sesión; una revisión independiente final, no un implementador/revisor por tarea.

**Goal:** Integrar decisiones de revisión, solicitud y abstención vinculadas al contexto autorizado, y comprobarlas con IA local real sin forzar éxito.

**Architecture:**18 es autoridad de preflight, catálogo, prompt y expansión;01 coordina decisiones terminales por MCP;02 valida contratos y delegación. Contextos de decisión se guardan como sidecars inmutables por tarea; resultados e informes referencian su digest. Chassis Tool, sus cálculos y el Crew Chief humano conservan sus responsabilidades.

**Tech Stack:** Python/Pydantic/JSON Schema, SQLite local, MCP/HTTP, Ollama local, React/TypeScript. Sin dependencias nuevas.

**Spec:** `docs/superpowers/specs/2026-10-26-verified-agent-decisions-design.md`, aprobada por el usuario el26 de octubre de2026.

## Global Constraints

- Herramientas5.0.0, tarea2.0.0, resultado3.0.0, registro7.0.0, DecisionContext1. Contexto técnico2 y hashes de snapshots históricos intactos.
- Máximo20 opciones;16000 caracteres de entrada,64KiB de respuesta,12KB por resultado y128KiB por sobre MCP. Sin truncamiento, redondeo o pérdida de hechos.
-12 llamadas/2slots/60s por llamada/600s por run; una decisión terminal por especialista, sin tool_requests ni segundas rondas nuevas; Chief separado.
- Solo `physical_inputs_missing` como único bloqueo, cobertura completa/fuente válida/opción verificada permite input_triage. Snapshot sigue no analizable, sin succeeded. Cualquier otro bloqueo conserva preflight sin inferencia.
- Abstención siempre posible si se llama al modelo; catálogo vacío no significa datos completos ni éxito. Ningún campo inválido se filtra para convertir respuesta en válida.
- Decisión/modelo/expansión/preflight/humano separados; no se modifica fixture positiva para facilitar resultados ni se reducen cuatro especialistas críticos y Chief.
- Mantener lecturas1/2, hashes y omisión de nuevos campos históricos. No permitir contratos antiguos para tareas nuevas.
- No nuevos modelos, swaps automáticos, transferencias, despliegues, migraciones cloud, pagos ni federación. Fuerzas progresivas/biometría y dominios no proyectados no se declaran revisados por IA.
- Fuentes/secretos/raw principales no se mutan. Verificación en el banco Docker existente, sin socket Docker dentro de procesos del producto ni red externa. No commits/push en esta entrega; conservar la base dirty/untracked aprobada y los baselines/manifiestos, sin reset/clean.

## Review Focus

1. El trabajador intenta sustituir prompt/catálogo o reutilizar digest de otra tarea: rechazo antes de inferir (Tasks2/3/4).
2. Catálogo vacío o salida abstain acaba convertido en succeeded por listas vacías: rechazo en coordinación, sellado, Chief e interfaz (Tasks1/4/5/6).
3. Una geometría asumida o wheelbase opcional se convierte en bloqueo universal: política por diagnóstico existente; no inventar requisitos (Task2).
4. Snapshot2D experimental con ausencias físicas intenta aprovechar triage: bloqueo sin inferencia de especialistas (Tasks2/4/7).
5. Contexto grande/74 agregados, opciones excesivas o lectura histórica: no pérdida silenciosa, hashes conservados y exceso explícito (Tasks1/2/3/5/7).

## Mapa de archivos y contratos

-01 `src/orchestrator/engineering/models.py`: DTO de decisión/contexto y versiones, conservando imports públicos; `local_model.py`: llamada tipada sin prompt para tareas2; `specialists.py`: preflight/decisión terminal; `worker.py`: transporte/versión cuando corresponda.
-18 `chassis/engineering/decision_contracts.py` nuevo: DTO local equivalente a01, sin dependencia runtime entre repositorios.
-18 `decision_context.py` nuevo: política de catálogo/cobertura/modos; `decision_store.py` nuevo: sidecar SQLite inmutable; `decision_generation.py` nuevo: entrada del servidor, esquema de generación y expansión de alias.
-18 `tools.py`, `grants.py`, `runs.py`: integrar contexto, invocación y sellado. `proposals.py`, `reports.py`: proyección persistida sin reinterpretación de históricos. `input_contract.py` conserva InputRequest/diagnósticos actuales.
-02 `src/mcp_gateway/contracts/engineering.tools.yaml` y18 `chassis/schemas/engineering-tools.json`: copias idénticas. Esquemas task/result/section/proposal/report afectados se versionan en18 `schema-version.yaml`.
-13 `src/domain/engineeringSession.ts`, `src/components/engineering/AnalysisRunPanel.tsx`, `ContrastPanel.tsx`, `InputRequests.tsx`, `engineeringPresentation.tsx`; nuevo `AgentDecision.tsx` para estado/origen. Usar diseño existente y leer `design.md` antes de tocar componentes.

En todas las rutas abreviadas de18, el prefijo es `18-telemetry-dataset/src/telemetry_dataset/`;01/02/13 indican los directorios completos de la fábrica.

### Task1: DTO, versiones y compatibilidad cerrada

**Files:**01 `models.py`;18 nuevo `decision_contracts.py`; esquemas `engineering-tools.json`, `engineering-result.json`, `specialist-result.json`;02 contrato;18 `schema-version.yaml`. Tests nuevos01 `tests/unit/test_engineering_decision_contract.py`,18 `tests/test_engineering_decision_contract.py`.

**Interfaces:** `DecisionOption(id, request: InputRequest, observed_state, capability)`; `DecisionContext(schema_version, policy_version, task_id, snapshot_digest, role, mode, capabilities, coverage, blockers, options, limitations, digest)`. Mode es reference_review/input_triage/blocked. IDs/digests canónicos acotados; options max20. Contexto no contiene copia de muestras/evidencias. `ModelDecision` es unión discriminada: ReviewSupported(kind,references,hypotheses,alternatives,assumptions,limitations); RequestInput(kind,request_id,references,limitations); Abstain(kind,reason,references,limitations). Abstain.reason catálogo exacto de la spec. Referencias/restricciones reutilizan las existentes, no prosa/cantidades.

Resultado3 añade `model_decision`, `decision_context_digest` y `decision_mode`; requested_inputs/diagnostics siguen siendo expansión de servidor. No fabrica Analysis/model_selection. Una inferencia validada exige decisión; preflight o errores de transporte/esquema/plazo pueden tener llamadas contabilizadas y ninguna decisión válida. Añadir `decision_error` opcional cerrado con phase=context/transport/schema/expansion/policy/deadline, cause de catálogo y response_sha256 opcional: permite conservar el fallo sin promover prosa/referencias inválidas a una selección verificada. model_selection de Analysis es exclusivo de versiones1/2. La tarea2 empareja schema_version/tool_contract_version2; RunConfig nuevo analysis_version2, tareas nuevas nunca1. Lecturas antiguas mantienen sus discriminadores.

- [ ] RED: `test_decision_union_rejects_mixed_outcomes_and_extra_fields` rechaza review+request, extras y reasons libres; `test_empty_catalog_does_not_imply_success` mantiene abstención; `test_v3_cannot_masquerade_as_v2_analysis` rechaza model_selection en3 y campos3 en1/2; `test_execution_failure_keeps_error_without_requiring_a_valid_decision` permite model_calls=1 con timed_out/error y rechaza succeeded sin decisión. Matriz pública01/18/JSON equivalente, incluyendo versiones ausentes y arrays21.
- [ ] Run: banco existente `run-tests.ps1 -Repository 01-agent-orchestrator -TestArgs @('tests/unit/test_engineering_decision_contract.py','-q')`; Expected: fallos por DTO ausente antes de implementar.
- [ ] Implementar DTO/validadores, esquemas de tarea/result y entrada5 de local_model_json: target, context_version, context_digest, timeout_seconds; sin prompt. read_snapshot5 devuelve DecisionContext. Salida contiene decisión canónica, digest, solicitudes/diagnósticos expandidos y metadatos del modelo, o error de ejecución cerrado. Sobres/target/grants no pierden campos. Conservar defaults de lectura históricos sin reescribir JSON persistido.
- [ ] Run: ambos archivos nuevos y pruebas de contrato/request existentes en01/02/18. Expected:PASS; copias02/18 y alias result idénticos byte a byte; esquema públicamente inválido no llega al modelo ni al sellado.

### Task2: Política y sidecar de contexto autorizado

**Files:**18 nuevos `decision_context.py`, `decision_store.py`; integrar lectura en `tools.py`/`runs.py`; tests nuevos `tests/test_engineering_decision_context.py`, `test_engineering_decision_store.py`. Leer la política de datos antes de cualquier fixture/dato.

**Interfaces:** `build_decision_context(snapshot, task: dict, evidence: list[dict]) -> DecisionContext`; `save_decision_context(db, context) -> DecisionContext`; `load_decision_context(db, task_id, digest) -> DecisionContext`. `db` es la conexión SQLite existente; tabla aditiva `engineering_decision_contexts(task_id PRIMARY KEY, snapshot_digest, policy_version, digest, payload)`. Inserción idempotente de contenido idéntico; conflicto no sobrescribe. No API de edición. El sidecar evita duplicar todo el catálogo dentro del resultado12KB.

Las capacidades y opciones siguen exactamente la política de la spec: tres entradas de trail/normal_trail, wheelbase opcional, concordancia entre missing_inputs congelado y valor ausente por lado; supuestos no bloquean. Señales solo del contrato de seis métricas con metadatos congelados interpretables. Desacuerdo/cobertura desconocida nunca prueba ausencia. Catálogo de fuerzas no proyectadas no existe. No cálculos nuevos en01 ni18.

- [ ] RED: `test_assumed_geometry_and_optional_wheelbase_do_not_create_requests`; `test_missing_geometry_requires_matching_frozen_diagnostic_and_side`; `test_false_absence_or_unknown_policy_blocks_context`; `test_only_physical_inputs_missing_allows_request_only_triage`; parametrizar2D/contexto/dominio inválido además de physical_inputs_missing y esperar mode=blocked sin model_allowed.
- [ ] RED: `test_context_is_task_role_snapshot_bound_and_not_overwritable`; `test_equivalent_context_has_stable_option_order_but_distinct_authority_digest`; `test_catalogue_over_20_is_explicitly_unavailable` sin cortar opciones. Task/rol/equipo ajenos no cargan sidecar. La tabla no toca snapshot/histórico.
- [ ] Run: archivos nuevos en banco18; Expected:FAIL por módulos/política ausentes.
- [ ] Implementar constructor/persistencia, validando referencias/digests completos antes de guardar. El catálogo contiene opciones de corrección, no validación física. Preflight blocked no consume llamada de modelo. Preservar sidecar durante sellado/informes históricos sin recalcular según la política más reciente.
- [ ] Run: tests nuevos + `test_analysis_snapshots.py`, `test_engineering_projection_scope.py`, `test_engineering_grants.py` focales. Expected:PASS; no nuevo acceso a raw ni cambios de hash de snapshot.

### Task3: Prompt del servidor y generación de decisiones

**Files:**18 nuevo `decision_generation.py`; modificar `tools.py`, `local_model.py`, `reference_codec.py` solo donde se reutilicen alias/formatos; pruebas nuevas `tests/test_engineering_decision_generation.py`. No alterar el comportamiento de lectura de Analysis histórico.

**Interfaces:** `prepare_decision(context, frozen_facts: dict) -> (prompt: str, wire_schema: dict, decode)`; `validate_model_decision(decision, context, evidence) -> (requested_inputs, request_diagnostics)`. El decoder expande referencias/q-alias exactamente; nunca cambia kind/reason ni elige una decisión. `LocalModelProvider.generate_decision(context, frozen_facts, timeout_seconds) -> ModelDecision` usa el mismo transporte/deadline/modelo fijo.

EngineeringTools.local_model_json5 ignora ninguna entrada libre: la rechaza por esquema. Verifica digest/sidecar/task, vuelve a comprobar el snapshot/delegación y construye frozen_facts internamente. Modelo recibe vista sin task/snapshot/grant/digest de autoridad, con opciones sanitizadas y referencias. Esquema por catálogo: abstain siempre disponible; request_input solo si hay opciones; review_supported solo si preflight de referencia lo permite y no quedan blockers. Comparar canónico después de decode; ninguna respuesta fallida se limpia para ajustarse al esquema.

- [ ] RED: `test_client_cannot_replace_prompt_facts_or_catalogue_before_inference`; `test_other_task_digest_never_reaches_provider`; `test_no_options_keeps_abstention_and_does_not_force_review`; `test_request_alias_roundtrip_is_exact_and_foreign_alias_rejected`; `test_supported_with_pending_blocker_is_rejected`.
- [ ] RED: `test_uuid_changes_do_not_change_wire_facts_but_physics_changes_do`; `test_large_context_keeps_all_74_aggregates_and_units`; `test_input_over_16000_blocks_without_pruning`; `test_slow_or_late_decision_is_discarded`. Proveedor controlado registra solo forma/llamada; no inferencia real todavía.
- [ ] Run: archivo nuevo18; Expected:FAIL con interfaz ausente.
- [ ] Implementar preparación/gramática/expansión y enlace de herramientas. Reutilizar el watchdog de transporte existente; catálogo/alias no amplían límites. Reservas y límites se validan antes de enviar al modelo; fuente2D experimental no entra a especialistas por el camino nuevo.
- [ ] Run: generación nueva + codec/canónico/proveedor/grants actuales y suite02. Expected:PASS; ninguna llamada para payload inválido, ninguna salida parcial tardía publicada, esquemas públicos y wire no aceptan otro catálogo.

### Task4: Coordinación terminal y aislamiento de versiones

**Files:**01 `local_model.py`, `specialists.py`, `models.py`, `worker.py` si necesita dispatch;18 `runs.py`, `grants.py`; tests nuevos01 `tests/unit/test_engineering_decisions.py`, ampliar18 `test_engineering_worker_transport.py`/`test_engineering_runs.py`.

**Interfaces:**01 `generate_decision(task, context, tools, timeout_seconds) -> verified response`; `execute_specialist`/`execute_reviewer` conservan firmas públicas, seleccionan ruta nueva por tarea2. Nueva ruta: un read_snapshot, contexto/grant cotejados, máximo una decisión terminal; no serializa prompt desde el trabajador ni ejecuta tool_requests. Rutas/DTO antiguos se conservan para lectura/pruebas históricas, no autorizan nueva tarea1 en backend5.

Mapeo exacto: review_supported→succeeded con referencias por capacidad y llamada registrada; request_input→blocked_missing_inputs/model_reported_missing_inputs; abstain→blocked_missing_inputs con `model_abstained_insufficient_evidence`, `model_abstained_capability_limit` o `model_abstained_context_not_representable`. No crea MissingCode. preflight blocked→causa de cobertura/capacidad/fuente; triage nunca succeeded. Metadata de modelo real no se sustituye por preflight.

- [ ] RED: `test_terminal_decision_has_one_model_call_and_no_tool_loop`; `test_triage_cannot_succeed_even_with_references`; `test_abstention_with_empty_lists_is_still_blocked`; `test_task2_cannot_use_v1_prompt_payload`; `test_role_snapshot_team_and_revocation_are_rechecked`.
- [ ] Run: banco01 pruebas nuevas; Expected:FAIL por dispatch/mapa ausente.
- [ ] Implementar coordinación y creación de tareas2/RunConfig2. Mantener la separación principal/revisión ciega y los gates de físico/neuro/Registry/RAG/domino no representado. Reintentos explícitos siguen creando otro run ligado; no retry interno.
- [ ] Run: unidades01 completas y transportes02/18 controlados, grants, presupuesto/leases/cancelación. Expected:PASS o límites del banco registrados por nombre; preservar el caso74 de hechos exactos y los asserts de cuatro roles del E2E positivo original.

### Task5: Sellado, informes y Chief sin convertir abstenciones en éxito

**Files:**18 `runs.py`, `proposals.py`, `reports.py`, `decision_store.py`; esquemas result/alias/section-summary/final-proposal/synthesis-report y registro; tests nuevos `tests/test_engineering_decision_results.py`, existentes proposals/reports/decisions/authority.

**Interfaces:** `verify_decision_result(result, task, context, evidence) -> None` en18 `decision_generation.py` revalida selección y proyecciones antes de sellar. Resultado3 conserva decisión/digest/modo; requested_inputs/diagnostics son expansión comprobada. Position/informe añaden esos campos opcionales y los omiten si antes no existían. El sidecar asociado es inmutable y se carga por task/digest; no se vuelve a generar con otra política para abrir históricos.

- [ ] RED: `test_sealer_rejects_success_without_model_or_with_abstention`; `test_tampered_expansion_context_or_projection_is_rejected`; `test_decision_survives_sections_report_and_reload`; `test_v1_v2_hashes_and_absent_fields_remain_exact`; `test_unavailable_critical_role_still_limits_chief_and_human_authority`.
- [ ] Run: pruebas nuevas18; Expected:FAIL por proyección/sellado ausentes.
- [ ] Implementar verificación y persistencia; usar decisión real para status, no inferirlo de request/evidence list vacía. No reasignar propiedad de datos ni cambiar actor/roles de decisiones humanas. Publicar propuesta de medición sigue separado de aprobación/montaje.
- [ ] Run: suites afectadas de sellado/proposals/reports/decisions/protocolo SQL en PostgreSQL efímero del banco. Expected:PASS; contradicción devuelve422 sin sellar, revocación impide publicar o aprobar, históricos intactos.

### Task6: Interfaz operativa de decisión y origen

**Files:**13 tipos `src/domain/engineeringSession.ts`, nuevo `src/components/engineering/AgentDecision.tsx`, consumidores AnalysisRunPanel/ContrastPanel/InputRequests/engineeringPresentation; tests nuevos `tests/engineering-decisions.check.mjs` y pruebas existentes. Leer `design.md` y skills UI pertinentes al ejecutar.

**Interfaces:** `AgentDecision({decision,contextMode,status,diagnostics})` presenta el DTO cerrado, sus límites y referencias. La abstención no muestra “sube una curva”; catálogo vacío no muestra “datos completos”. Identifica preflight determinista, agente, expansión de servidor y autoridad humana. No nuevo asistente de aprobación ni formularios para modificar setup desde texto generado.

- [ ] RED: SSR/componente con revisión sustentada, petición exacta, abstención, triage, fallo de formato y resultado histórico. Asserts de status/copia operativa; `test_empty_options_are_not_data_complete` y `test_abstention_is_not_success` deben fallar con el componente antiguo.
- [ ] Implementar dentro de disclosures/paneles existentes, sin tarjetas anidadas ni rediseño general. Tipos/guardas runtime rechazan enums/extras incompatibles, referencias de otro scope no generan enlaces de acción.
- [ ] Run: comprobaciones focales13 y typecheck completo. Expected:PASS; registrar limitación de binarios nativos del banco si no se ejecuta Vitest/build, no acreditarlos por SSR. Una tanda visual de estados sintéticos aislados escritorio/móvil y teclado, sin poblar biblioteca principal; corregir problemas comprobados.

### Task7: Aceptación real y entrega

**Files:**18 `tests/test_engineering_integration.py`, `engineering_acceptance_helpers.py` cuando lo requiera el contexto nuevo;13 `docs/engineering-delivery-status.md`, expediente nuevo de aceptación y runbook18 `docs/local-chassis-ai.md`.

**Interfaces:** banco HTTP01→02→18, identidades sintéticas, PostgreSQL efímero y transporte a Ollama fijo. Casos: positivo actual intacto; negativo triage con un diagnóstico de ausencia del motor coherente y catálogo exacto; negativo2D experimental original. El modelo selecciona o se abstiene; ningún helper modifica la selección para pasar.

- [ ] Run: suites afectadas, una suite completa de ingeniería, contratos/paridad, empaquetado y smoke fuera del checkout. Expected:PASS de ámbitos ejecutables; documentar por nombre errores globales/catalogo/dependencias no resueltos, no afirmar suite global verde.
- [ ] Hacer revisión independiente del delta completo con contexto fresco. Expected:ningún Critical/Important pendiente antes de inferencia; registrar límites de revisión.
- [ ] Elegir explícitamente candidato local ya instalado y ejecutar una aceptación positiva y una negativa semántica, preservando four-critical/Chief. Registrar DTO/versión/digests, prompt/esquema hash, decisión/status/causa por rol y duración antes de asserts. No ejecutar tareas de rendimiento en paralelo a inferencia. El negativo2D sigue sin prueba de InputRequest real por sí solo.
- [ ] Expected:positivo con4roles succeeded y Chief; negativo con petición comprobada o abstención honestamente bloqueada y sin cambio físico. Un fallo conserva gate, no amplía presupuesto ni inicia bucle de modelos/prompts. Resultados tardíos y limpieza acotados por helpers existentes.
- [ ] Actualizar expediente/manifiestos y salud local. Solo considerar recarga conjunta01/02/18 si aceptación/revisión pasan, procesos propios verificados y ningún run activo; no despliegue ni cambio de modelo automático. Sin prueba positiva no marcar listo para vender ni plan completamente logrado.

## Auto-revisión y secuencia

Tasks1→2→3→4→5→6→7; son un contrato vertical, no proyectos independientes. Versiones/historia en1/5; política/triage en2/4; autoridad/prompt en2/3/4; alias/bounds en3; eventos/Chief en5; UI en6; aceptación y distribución en7. Los cinco riesgos de Review Focus tienen regresión asignada. No hay integración real de dominios, fuerzas progresivas en IA,2D fabricante, cloud o nodos escondida en estas tareas.

Decisiones de planificación (no requisitos adicionales atribuidos al usuario): persistir contexto en sidecar SQLite para conservar política histórica y el límite12KB; una decisión nueva terminal sin bucle de tools; usar las rutas de modelo/reservas registradas con payload5; registrar errores cerrados sin exigir una decisión válida a una llamada fallida; conservar ejecución inline y una revisión final. Todo se contrasta con la especificación aprobada y el código al ejecutar; cualquier divergencia material se registra y no se oculta modificando fixtures.
