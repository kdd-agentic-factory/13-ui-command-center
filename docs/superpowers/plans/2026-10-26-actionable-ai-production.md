# IA accionable: plan de implementación

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans para ejecución inline en esta sesión. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** identificar solicitudes concretas y verificables de los agentes y acreditar el análisis local completo sin inventar datos ni relajar los bloqueos.

**Architecture:** ampliar el contrato entre01/02/18; comprobar las solicitudes contra el snapshot inmutable; estabilizar la representación enviada al modelo y reflejar el resultado en13. El servicio central con nodos locales es el destino aprobado, pero esta entrega no realiza enrolamiento, despliegue ni transferencia de datos.

**Tech Stack:** Python/Pydantic, JSON Schema, MCP, Ollama local, React/TypeScript y pruebas aisladas.

**Spec:** `docs/superpowers/specs/2026-10-26-actionable-ai-production-design.md` — aprobada por el usuario el26 de octubre.

## Global Constraints

-60 s por llamada,600 por run,12 llamadas y2 slots globales; ninguna ampliación ni retry oculto.
- Conservar HMAC, alcance exacto, membresías, leases, cancelación y descarte de resultados tardíos.
- No calcular física en01; no inventar medidas ni exigir curva/calibración para toda comparación planar.
- Mantener unidad SI, procedencia, incertidumbre y advertencias; ningún remuestreo, redondeo ni cambio de curva.
- Los históricos mantienen sus hashes, selección original y significado; nuevo contrato requiere actualización conjunta01/02/18.
- Ninguna nueva salida supera un gate por tener lista vacía; aprobación humana titular/sustituto vigente.
- Sin commits, push, migraciones cloud, exposición de secretos ni cambios en datos originales.
- Pruebas de seguridad sólo en sandbox con entorno permitido, red externa deshabilitada, fuentes/herramientas de sólo lectura y recursos/escrituras acotados. Si no se puede acreditar, registrar el bloqueo; no sustituirlo por ejecución insegura.

## Review Focus

- Solicitud a un campo presente o a otro scope: rechazo explícito sin mostrar un dato inventado.
- Revisión geométrica con entradas asumidas: no imponer requisitos de dinámica, pero conservar límites físicos.
- Históricos sin requested_inputs: lectura compatible sin regeneración ni modificación del hash.
- Cambios sólo de UUID/orden: representación estable; cambios reales de valor/unidad/curva deben seguir visibles.
- Run cancelado o deadline agotado durante síntesis: no publicar resultado tardío ni esconder fallo de limpieza.

### Task1: Contrato versionado y compatibilidad

**Files:** `01/src/orchestrator/engineering/models.py`; `02/src/mcp_gateway/contracts/engineering.tools.yaml`; `18/src/telemetry_dataset/chassis/schemas/engineering-tools.json`, `engineering-result.json`; `18/schema-version.yaml`; pruebas `01/tests/unit/test_engineering_specialists.py`, `02/tests/unit/test_engineering_tools.py`, `18/tests/test_engineering_local_model.py`.

**Interfaces:** añadir `InputRequest` y `Analysis.requested_inputs` (máximo20, default vacío para lectura histórica). Campos cerrados: `source` (`comparison|setup_a|setup_b|domain`), `field` (`interval_s|calibration|linkage_curve|values_si|track_context|weather_context|tires_powertrain_context`), `parameter` (identificador acotado sólo para values_si), `reason` (`absent|unmeasured|incompatible|domain_unrepresentable`), `blocks` (`geometry_review|suspension_replay|physical_setup_change|domain_review`). Ninguna ruta libre/URL/ID de objeto. Validar combinaciones, sin coerción ni extras. Conservar MissingCode histórico.

- [ ] RED: peticiones tipadas válidas, combinaciones inválidas, extras/rutas arbitrarias, duplicados y21 solicitudes; resultado histórico sin nuevo campo se lee igual.
- [ ] Implementar contratos y sincronizar ambas copias de herramientas byte a byte. Herramientas4.0.0 y registro6.0.0; registrar versión2 del resultado nuevo y permitir lectura de versión1 histórica sin reescritura. Mantener TechnicalContext2.0.0.
- [ ] GREEN: suites focales de contrato/lectura histórica; ninguna fixture histórica se cambia sólo para ocultar incompatibilidad.

### Task2: Validación y diagnóstico de las solicitudes

**Files:** crear `01/src/orchestrator/engineering/input_requests.py`; modificar `specialists.py`; probar `tests/unit/test_engineering_input_requests.py` y especialistas.

**Interfaces:** `validate_input_requests(requests, facts, role) -> list[dict]` devuelve diagnóstico de referencias válidas contra hechos congelados; contradicción levanta error específico y no genera observaciones. No devuelve cálculos ni introduce requisitos físicos nuevos. `values_si` sólo admite claves presentes en el esquema/catálogo de parámetros del producto, no identificadores de recursos.

- [ ] RED: campo ausente, valor presente, curve.measured true/false, procedencia asumida/medida, calibración incompatible, intervalo no seleccionado, otro dominio y snapshot parcial.
- [ ] Implementar comprobaciones estructurales/estado y conservar por separado solicitud, estado observado y motivo. Una petición genérica sin solicitud concreta no se atribuye a una ausencia física: causa `model_request_not_actionable`, estado bloqueado. Solicitudes legítimas concretas siguen bloqueadas.
- [ ] GREEN: no convertir ausencia de curva en requisito universal de geometry_review; conservar el rechazo previo requested_input_already_present y todos los casos de cancelación/presupuesto.

### Task3: Representación estable y esquema de generación

**Files:** `18/src/telemetry_dataset/chassis/engineering/reference_codec.py`, `local_model.py`; `18/tests/test_engineering_reference_codec.py`, `test_engineering_local_model.py`; prompt de `01/.../specialists.py` sólo para explicar solicitudes nuevas.

**Interfaces:** mantener `prepare(data, schema) -> (prompt, wire_schema, decode)`; referencias request-local deterministas con mapeo de expansión separado. El sobre de autorización no se normaliza ni se entrega al modelo. La selección nueva produce InputRequest; la validación posterior es la deTask2.

- [ ] RED: dos contextos físicamente idénticos con UUID distintos y evidencia en orden no semántico distinto tienen el mismo prompt wire; la expansión vuelve a cada identidad original. Valores SI, orden de curva/tiempo y warnings distintos conservan su diferencia.
- [ ] Implementar alias sólo en campos de identidad tipados y orden canónico de conjuntos; no reemplazo recursivo de cadenas arbitrarias ni modificación de metadatos físicos. Mantener límites128 referencias/16000 caracteres y expansión exacta.
- [ ] GREEN: esquema, pérdida cero, aislamiento entre solicitudes, referencias desconocidas/duplicadas y límites existentes.

### Task4: Persistencia, informes y barreras del Chief

**Files:** `18/.../engineering/proposals.py`, `reports.py` y esquemas de informe cuando corresponda; pruebas `test_engineering_proposals.py`, `test_engineering_reports.py`, `test_engineering_decisions.py`; lectura result en02 si la versión lo requiere.

**Interfaces:** posiciones e informe conservan las solicitudes nuevas y su diagnóstico sin regenerar selecciones históricas. Disponibilidad sigue dependiendo de status succeeded; solicitar un dato no valida una propuesta física.

- [ ] RED: roundtrip nuevo/histórico, hash preservado, petición no accionable, lista vacía pero status bloqueado, aprobación humana y revocación.
- [ ] Implementar proyección de campos y compatibilidad explícita; no inferir consentimiento por un resultado del agente.
- [ ] GREEN: consumidores, límites de informe y barreras de decisión/montaje/validación.

### Task5: Interfaz de corrección accionable

**Files:** `13/src/services/engineeringSession.ts` y tipos consumidores; `src/components/engineering/AnalysisRunPanel.tsx`, `engineeringPresentation.tsx`; pruebas del panel y presentación. Leer `design.md` antes de editar.

**Interfaces:** mostrar campo/estado, tarea afectada, motivo y siguiente acción disponible; distinguir no accionable, petición legítima y timeout. Conservar etiquetas para históricos. No mostrar éxito de IA ante un bloqueo.

- [ ] RED: solicitud de calibración/curva/intervalo y dato presente rechazado; histórico genérico conserva explicación; ninguna acción cruza scope.
- [ ] Implementar dentro del panel existente, sin rediseño general ni nuevos datos simulados.
- [ ] GREEN: pruebas focales, typecheck y un pase visual con estados sintéticos aislados, sin poblar la biblioteca principal.

### Task6: Aceptación local completa y entrega verificable

**Files:** `18/tests/test_engineering_integration.py`, helpers de prueba necesarios; `13/docs/engineering-delivery-status.md`, runbook y expediente nuevo de aceptación.

**Interfaces:** banco aislado con identidades/datos sintéticos, modelo real configurado explícitamente y transporteHTTP01→02→18. Respetar deadline600 del run; documentar cambio de la espera240 del harness como alineación del banco, no del producto. Cierre de procesos propios acotado aunque falle el modelo.

- [ ] RED/GREEN de helpers: espera derivada del deadline real y cancelación/cierre con inferencia lenta controlada; no modificar asserts de los cuatro especialistas críticos y Chief.
- [ ] Ejecutar suites afectadas en entorno aislado y revisión independiente del delta antes de inferencia. Una aceptación positiva y una negativa suficiente para verificar solicitudes concretas, sin bucles de reintento.
- [ ] Registrar modelo, hashes de contrato/prompt, contexto, duración y estados reales. Si no pasa, no activar modelo nuevo ni declarar cerrado el gap. Medidas reales/2D siguen siendo gates externos distintos.
- [ ] Empaquetar y comprobar consumidores fuera del checkout; verificar salud tras una recarga local acotada sólo si procede. Actualizar estado y manifiesto, sin desplegar cloud.

## Secuencia y revisión del plan

Ejecución inline conservada. Tasks1–4 están ligadas por contrato y van en orden; UI después de consumidores estables; aceptación al final. Revisión independiente al cerrar el delta y antes de activar. La auditoría amplia y el diseño de nodos tienen expedientes separados; no se reejecutan tareas anteriores ya aceptadas.

Autorrevisión: los apartados de contrato, presentación estable, presupuesto, interfaz/Chief y aceptación de la especificación corresponden aTasks1–6. Los cinco riesgos de Review Focus se fijan en pruebas deTasks1/2/3/4/6. El plan no autoriza activar rutas legacy, cuentas cloud, nodos ni acciones físicas.
